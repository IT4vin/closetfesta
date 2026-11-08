import React, { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Plus, ArrowRightLeft, BadgePercent, Trash2, CalendarDays,
  Contact, FileText, XCircle, Wallet, History, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/stores/authStore";
import PermissionManager from "@/lib/permissions";
import type { OrderDetail } from "@/lib/rentalOrderDetails";
import { fetchAllRows } from "@/hooks/useLiveClosetData";
import { editRentalOrder, loadRentalOrderAudit, type OrderEditAction } from "@/lib/rentalOrderEditing";

type EditorValues=Record<string,string>;
type CatalogEntry={id:string;name:string;sku:string|null;price:number;image:string|null};
type ClientChoice={id:string;full_name:string};
const money=(n:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n);
const title:Record<OrderEditAction,string>={
  client:"Editar dados do cliente",
  client_reassign:"Trocar cliente do pedido",
  notes:"Editar observações do pedido",
  item_dates:"Alterar datas do traje",
  add_item:"Incluir produto no pedido",
  replace_item:"Trocar produto do pedido",
  remove_item:"Retirar produto do pedido",
  item_discount:"Conceder desconto no traje",
  item_price:"Alterar valor do aluguel",
  order_discount:"Conceder desconto geral",
  reverse_payment:"Estornar lançamento de pagamento",
  cancel_contract:"Cancelar pedido",
};
const labels:Record<OrderEditAction,string>={
  client:"Dados do cliente", client_reassign:"Vincular outro cliente",notes:"Observações",
  item_dates:"Datas",add_item:"Adicionar traje",replace_item:"Trocar traje",remove_item:"Remover traje",
  item_discount:"Desconto no traje",item_price:"Editar preço",order_discount:"Desconto geral",
  reverse_payment:"Estornar pagamento",cancel_contract:"Cancelar pedido",
};
const inputStyle="w-full rounded-lg border border-stone-200 bg-background px-3 py-2 text-sm";
const actionStyle="h-8 rounded-lg border-marsala-200 text-marsala-800 hover:bg-marsala-50";
function dateValue(value:string|undefined|null){return value??""}
function fromClient(detail:OrderDetail):EditorValues {
  const c=detail.customer;
  const a=typeof c.address==="object"&&c.address?c.address:{} as Record<string,unknown>;
  return {
    full_name:c.full_name,phone:c.phone??"",email:c.email??"",document:c.document??"",
    notes:c.notes??"",street:String(a.street??""),number:String(a.number??""),
    complement:String(a.complement??""),neighborhood:String(a.neighborhood??""),
    city:String(a.city??""),state:String(a.state??""),cep:String(a.cep??""),
  };
}
function ItemDates({fields,setField}:{fields:EditorValues;setField:(key:string,value:string)=>void}){
  const lines:[string,string,boolean][]=[
    ["try_on_date","Prova",false],["pickup_date","Retirada",true],
    ["event_date","Evento",true],["return_date","Devolução",true],
  ];
  return <div className="grid gap-3 sm:grid-cols-2">{lines.map(([key,label,required])=>
    <div key={key} className="space-y-1"><Label htmlFor={"edit-"+key}>{label}</Label>
      <Input id={"edit-"+key} type="date" required={required} value={fields[key]??""}
        onChange={e=>setField(key,e.target.value)}/></div>)}</div>;
}

export type OrderEditorController={
  open:(action:OrderEditAction,opts?:{itemId?:string;paymentId?:string})=>void;
};
export default React.forwardRef<OrderEditorController,{detail:OrderDetail;onChanged:()=>Promise<unknown>|void}>(
function OrderEditPanel({detail,onChanged},ref){
  const {toast}=useToast();
  const {user}=useAuth();
  const queryClient=useQueryClient();
  const role=user?.role?.id;
  const manager=role==="admin"||role==="manager";
  const canBasic=(manager||role==="staff")&&PermissionManager.hasPermission("orders","update");
  const canPayments=manager&&PermissionManager.hasPermission("payments","refund");
  const [editor,setEditor]=useState<{action:OrderEditAction,itemId?:string,paymentId?:string}|null>(null);
  const [fields,setFields]=useState<EditorValues>({});
  const [reason,setReason]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [search,setSearch]=useState("");
  const [showHistory,setShowHistory]=useState(false);
  const request=useRef<{signature:string;id:string}|null>(null);
  const order=detail.order;
  const editable=order.status!=="cancelled"&&order.status!=="completed";
  const clients=useQuery({
    queryKey:["order-editor-clients"],
    enabled:Boolean(editor?.action==="client_reassign"&&manager),
    queryFn:async()=>{
      const rows=await fetchAllRows<ClientChoice>("clients","id,full_name");
      return rows.sort((a,b)=>a.full_name.localeCompare(b.full_name,"pt-BR"));
    },
  });
  const catalog=useQuery({
    queryKey:["order-editor-catalog"],
    enabled:Boolean((editor?.action==="add_item"||editor?.action==="replace_item")&&manager),
    queryFn:async()=>{
      const data=await fetchAllRows<any>("products",
        "id,name,sku,price,metadata,active,deleted_at,product_images(url,is_primary,position)");
      return data.filter((p:any)=>p.active&&!p.deleted_at).map((p:any)=>({
        id:p.id,name:p.name,sku:p.sku,
        price:Number(p.metadata?.rental_price??p.price),
        image:(p.product_images??[]).sort((a:any,b:any)=>
          Number(b.is_primary)-Number(a.is_primary)||Number(a.position)-Number(b.position))[0]?.url??null,
      })).sort((a:CatalogEntry,b:CatalogEntry)=>a.name.localeCompare(b.name,"pt-BR")) as CatalogEntry[];
    },
  });
  const audit=useQuery({
    queryKey:["rental-order-audit",order.id,user?.id],
    queryFn:()=>loadRentalOrderAudit(order.id),
    enabled:showHistory&&canBasic,
    staleTime:10000,
  });
  const activeItems=order.items.filter(item=>detail.itemProgress.find(p=>p.id===item.id)?.status!=="cancelled");
  const globalDiscount=Math.max(0,Number(order.total_discount)-activeItems.reduce((s,item)=>s+Number(item.discount),0));
  const selectedItem=order.items.find(item=>item.id===editor?.itemId);
  const selectedPayment=detail.payments?.find(p=>p.id===editor?.paymentId);
  const field=(key:string,value:string)=>{
    setFields(prev=>({...prev,[key]:value}));
    request.current=null;
  };
  const open=(action:OrderEditAction,opts:{itemId?:string;paymentId?:string}={})=>{
    if(!canBasic||!editable)return;
    if(!manager&&action!=="client"&&action!=="notes"&&action!=="item_dates")return;
    if(action==="reverse_payment"&&!canPayments)return;
    const item=order.items.find(i=>i.id===opts.itemId);
    const base:EditorValues=action==="client"?fromClient(detail):
      action==="notes"?{notes:order.observations??""}:
      action==="client_reassign"?{client_id:detail.customer.id}:
      action==="item_dates"&&item?{
        try_on_date:dateValue(item.try_on_date),pickup_date:dateValue(item.pickup_date),
        event_date:dateValue(item.event_date),return_date:dateValue(item.return_date),
      }:
      action==="add_item"?{
        product_id:"",try_on_date:dateValue(activeItems[0]?.try_on_date),
        pickup_date:dateValue(activeItems[0]?.pickup_date),
        event_date:dateValue(activeItems[0]?.event_date),
        return_date:dateValue(activeItems[0]?.return_date),
      }:
      action==="replace_item"?{product_id:""}:
      action==="item_discount"?{amount:String(item?.discount??0)}:
      action==="item_price"?{amount:String(item?.unit_price??0)}:
      action==="order_discount"?{amount:String(globalDiscount)}:{};
    setEditor({action,...opts});setFields(base);setReason("");setSearch("");setError("");request.current=null;
  };
  React.useImperativeHandle(ref,()=>({open}));
  const close=()=>{if(!busy){setEditor(null);setError("");}};
  const validateDate=()=>{
    if(!fields.pickup_date||!fields.event_date||!fields.return_date ||
       fields.pickup_date>fields.event_date||fields.event_date>fields.return_date||
       (fields.try_on_date&&fields.try_on_date>=fields.pickup_date)) {
      throw new Error("A prova deve ser anterior à retirada; o evento deve ocorrer entre retirada e devolução.");
    }
  };
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!editor||busy)return;
    if(reason.trim().length<3){setError("Informe uma justificativa com pelo menos 3 caracteres.");return;}
    const {action,itemId,paymentId}=editor;
    let payload:Record<string,unknown>={};
    try{
      if(action==="item_dates"||action==="add_item")validateDate();
      if(action==="client"){
        if(fields.full_name.trim().length<2)throw new Error("Nome do cliente obrigatório.");
        payload={
          full_name:fields.full_name,phone:fields.phone,email:fields.email,
          document:fields.document,notes:fields.notes,
          address:Object.fromEntries(["street","number","complement","neighborhood","city","state","cep"]
            .map(key=>[key,fields[key]??""])),
        };
      }else if(action==="client_reassign"){
        if(!fields.client_id)throw new Error("Selecione o cliente.");
        payload={client_id:fields.client_id};
      }else if(action==="notes"){
        payload={notes:fields.notes??""};
      }else if(action==="item_dates"){
        payload={item_id:itemId,...Object.fromEntries(
          ["try_on_date","pickup_date","event_date","return_date"].map(key=>[key,fields[key]??""]))};
      }else if(action==="add_item"){
        if(!fields.product_id)throw new Error("Selecione o traje.");
        payload={product_id:fields.product_id,...Object.fromEntries(
          ["try_on_date","pickup_date","event_date","return_date"].map(key=>[key,fields[key]??""]))};
      }else if(action==="replace_item"){
        if(!fields.product_id)throw new Error("Selecione o traje de substituição.");
        payload={item_id:itemId,product_id:fields.product_id};
      }else if(action==="item_discount"||action==="item_price"||action==="order_discount"){
        const amount=Number(fields.amount?.replace(",","."));
        if(!Number.isFinite(amount)||amount<0||Math.round(amount*100)!==amount*100)
          throw new Error("Informe um valor válido em reais com até duas casas decimais.");
        payload=action==="order_discount"?{amount}:{item_id:itemId,amount};
      }else if(action==="remove_item"){
        payload={item_id:itemId};
      }else if(action==="reverse_payment"){
        if(!paymentId)throw new Error("Selecione um pagamento.");
        payload={payment_id:paymentId};
      }else if(action==="cancel_contract")payload={
        confirmed:true,credit_authorized:fields.credit_authorized==="true",
      };

      if(["reverse_payment","cancel_contract","remove_item"].includes(action)&&
        !window.confirm(action==="reverse_payment"?
          "O dinheiro já foi devolvido ou o estorno externo já foi realizado? Este registro ficará no histórico.":
          action==="cancel_contract"?"Confirmar cancelamento? Os valores pagos que não foram estornados serão convertidos em crédito para o cliente, conforme autorização registrada.":"Confirma retirar o traje? O histórico será preservado."))return;
      const signature=JSON.stringify([order.id,action,payload,reason.trim()]);
      if(!request.current||request.current.signature!==signature)
        request.current={signature,id:crypto.randomUUID()};
      setBusy(true);setError("");
      const result=await editRentalOrder({
        contractId:order.id,action,data:payload,reason,
        requestId:request.current.id,
      });
      request.current=null;
      setEditor(null);
      const createdCredit=action==="cancel_contract"
        ?Number((result.result as Record<string,unknown>|undefined)?.credit_generated??0):0;
      toast({title:action==="cancel_contract"?"Contrato cancelado":"Alteração registrada",
        description:createdCredit>0
          ?"Crédito de R$ "+createdCredit.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})+
           " lançado automaticamente no cadastro do cliente."
          :"Atualizada no Supabase com histórico e justificativa."});
      try{
        await Promise.all([
          queryClient.invalidateQueries({queryKey:["closet-live-operations"]}),
          queryClient.invalidateQueries({queryKey:["closet-live-finance"]}),
          queryClient.invalidateQueries({queryKey:["rental-order-audit",order.id]}),
          queryClient.invalidateQueries({queryKey:["house-credit-client"]}),
          queryClient.invalidateQueries({queryKey:["house-credit-contract"]}),
          onChanged(),
        ]);
      }catch{
        toast({title:"Salvo no banco",description:"Atualize a página para ver os dados recém-alterados."});
      }
    }catch(cause){
      setError(cause instanceof Error?cause.message:"O banco não confirmou a alteração.");
    }finally{setBusy(false);}
  };
  const actionButton=(action:OrderEditAction,opts:{itemId?:string;paymentId?:string}={})=>
    <Button key={action} size="sm" variant="outline" className={actionStyle}
      onClick={()=>open(action,opts)}>{labels[action]}</Button>;
  const listItems=(catalog.data??[]).filter(p=>{
    const term=search.toLocaleLowerCase("pt-BR");
    return (p.name+" "+(p.sku??"")).toLocaleLowerCase("pt-BR").includes(term)
      &&(editor?.action!=="replace_item"||p.id!==selectedItem?.product_id);
  });
  return <>
    {canBasic&&<div className="flex flex-wrap gap-2 print:hidden">
      {editable&&actionButton("client")}
      {editable&&actionButton("notes")}
      {editable&&manager&&actionButton("client_reassign")}
      {editable&&manager&&actionButton("add_item")}
      {editable&&manager&&actionButton("order_discount")}
      {editable&&manager&&actionButton("cancel_contract")}
      <Button size="sm" variant="outline" onClick={()=>setShowHistory(v=>!v)}
        className={actionStyle}><History className="mr-1 h-4 w-4"/>Histórico</Button>
    </div>}
    {showHistory&&canBasic&&<div className="space-y-2 rounded-xl border border-marsala-100 bg-marsala-50/40 p-4 print:hidden">
      <h3 className="font-semibold text-marsala-900">Alterações auditadas</h3>
      {audit.isPending?<p className="text-xs">Carregando...</p>:
      audit.error?<p role="alert" className="text-xs text-red-700">{String(audit.error.message)}</p>:
      audit.data?.length===0?<p className="text-xs text-muted-foreground">Nenhuma alteração manual registrada.</p>:
      audit.data?.map(row=><div key={row.id} className="border-b py-2 text-xs">
        <strong>{labels[row.action]??row.action}</strong>{" "}
        <span className="text-muted-foreground">{new Date(row.created_at).toLocaleString("pt-BR")}</span>
        <p className="mt-1">{row.reason}</p>
      </div>)}
    </div>}
    <Dialog open={Boolean(editor)} onOpenChange={open=>{if(!open)close();}}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-marsala-900">{editor?title[editor.action]:"Editar pedido"}</DialogTitle>
          <DialogDescription>
            Pedido {order.order_number}. As alterações são verificadas no banco e registradas no histórico.
          </DialogDescription>
        </DialogHeader>
        {editor&&<form onSubmit={e=>void submit(e)} className="space-y-4">
          {editor.action==="client"&&<>
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              Os dados deste cliente são compartilhados com os demais pedidos do mesmo cadastro.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["full_name","Nome completo"],["phone","Telefone / WhatsApp"],["email","E-mail"],
                ["document","CPF / CNPJ"],["street","Rua"],["number","Número"],
                ["complement","Complemento"],["neighborhood","Bairro"],["city","Cidade"],
                ["state","UF"],["cep","CEP"]
              ].map(([key,label])=><div className="space-y-1" key={key}>
                <Label htmlFor={"edit-client-"+key}>{label}</Label>
                <Input id={"edit-client-"+key} value={fields[key]??""}
                  required={key==="full_name"} onChange={e=>field(key,e.target.value)}/>
              </div>)}
            </div>
            <div className="space-y-1"><Label>Observações do cliente</Label>
              <textarea className={inputStyle} rows={2} value={fields.notes??""}
                onChange={e=>field("notes",e.target.value)}/></div>
          </>}
          {editor.action==="client_reassign"&&<>
            <p className="text-xs text-amber-800">Vinculará o pedido a outro cliente existente. Não apaga o histórico de nenhum cliente.</p>
            <Label>Cliente do pedido</Label>
            <select className={inputStyle} required value={fields.client_id??""}
              onChange={e=>field("client_id",e.target.value)}>
              <option value="">Selecione</option>
              {(clients.data??[]).map(c=><option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
            {clients.error&&<p className="text-xs text-red-700">{String(clients.error.message)}</p>}
          </>}
          {editor.action==="notes"&&<>
            <Label>Observações do contrato</Label>
            <textarea rows={5} className={inputStyle} maxLength={3000}
              value={fields.notes??""} onChange={e=>field("notes",e.target.value)}/>
          </>}
          {(editor.action==="item_dates"||editor.action==="add_item")&&
            <ItemDates fields={fields} setField={field}/>}
          {(editor.action==="add_item"||editor.action==="replace_item")&&<div className="space-y-3">
            <Label>Selecione o traje cadastrado</Label>
            <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/>
              <Input className="pl-9" placeholder="Pesquisar nome ou código..." value={search}
                onChange={e=>setSearch(e.target.value)}/></div>
            {catalog.error&&<p role="alert" className="text-sm text-red-700">{String(catalog.error.message)}</p>}
            <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {catalog.isPending?<p className="text-sm">Carregando produtos...</p>:
              listItems.length===0?<p className="text-sm text-muted-foreground">Nenhum produto encontrado.</p>:
              listItems.map(p=><button key={p.id} type="button"
                onClick={()=>field("product_id",p.id)}
                className={"flex items-center gap-3 rounded-lg border p-2 text-left text-sm transition-colors "+
                  (fields.product_id===p.id?"border-marsala-700 bg-marsala-50":"hover:border-marsala-300")}>
                {p.image?<img src={p.image} alt="" className="h-16 w-12 shrink-0 rounded object-cover"/>:
                  <span className="flex h-16 w-12 shrink-0 items-center justify-center rounded bg-stone-100 text-stone-400">—</span>}
                <span className="min-w-0"><strong className="block truncate">{p.name}</strong>
                  <span className="text-xs text-muted-foreground">{p.sku??"Sem SKU"}</span>
                  <span className="block font-medium text-marsala-800">{money(p.price)}</span></span>
              </button>)}
            </div>
            <p className="text-xs text-muted-foreground">
              O banco confirmará um exemplar livre para as datas do contrato. O valor padrão do novo traje será usado.
            </p>
          </div>}
          {(editor.action==="item_discount"||editor.action==="item_price"||editor.action==="order_discount")&&<>
            <Label htmlFor="edit-amount">
              {editor.action==="order_discount"?"Desconto adicional sobre o pedido (R$)":
                editor.action==="item_discount"?"Desconto deste traje (R$)":"Novo valor do aluguel (R$)"}
            </Label>
            <Input id="edit-amount" type="number" min="0" step="0.01" required
              value={fields.amount??""} onChange={e=>field("amount",e.target.value)}/>
            <p className="text-xs text-muted-foreground">
              O total não poderá ficar abaixo dos pagamentos já registrados.
              {editor.action==="order_discount"?" Este desconto é separado dos descontos dos itens.":""}
            </p>
          </>}
          {editor.action==="reverse_payment"&&<>
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              {selectedPayment?.method==="cash"
                ?"Confirme que o dinheiro já foi devolvido fisicamente. O caixa do recebimento deve permanecer aberto."
                :"Esta operação não devolve Pix ou cartão automaticamente: faça o estorno pelo banco/adquirente antes de registrar."}
            </p>
            <p className="text-sm">Lançamento: {selectedPayment?money(Number(selectedPayment.amount)):"indisponível"}</p>
          </>}
          {editor.action==="cancel_contract"&&
            <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
              <strong>Cancelar contrato e gerar crédito na casa</strong>
              <p>O contrato será cancelado e os valores recebidos que ainda não foram estornados,
                inclusive créditos já utilizados neste pedido, serão colocados automaticamente
                no saldo do cliente. O registro ficará vinculado a este pedido.</p>
              <p><strong>Recebimentos não estornados:</strong> {money((detail.payments??[])
                .filter(payment=>payment.status!=="reversed")
                .reduce((total,payment)=>total+Number(payment.amount),0))}
              </p>
              <p className="text-xs">O valor definitivo é calculado pelo banco. A conversão não substitui
                reembolso ou estorno quando o consumidor tiver esse direito.
                Para reembolso, utilize o fluxo de estorno antes de cancelar.</p>
              <label className="flex items-start gap-2">
                <Checkbox checked={fields.credit_authorized==="true"}
                  onCheckedChange={v=>field("credit_authorized",v===true?"true":"false")}/>
                Confirmo que o cliente concordou em manter os valores como crédito na loja,
                respeitados os direitos de reembolso aplicáveis.
              </label>
            </div>
          {editor.action==="remove_item"&&<p className="text-sm text-muted-foreground">
            O traje será retirado da reserva, mas permanecerá no histórico. O total do contrato será recalculado.
          </p>}
          <div className="space-y-1"><Label htmlFor="edit-reason">Justificativa da alteração *</Label>
            <Input id="edit-reason" required minLength={3} maxLength={500}
              placeholder="Ex.: cliente solicitou alteração para outra data"
              value={reason} onChange={e=>{setReason(e.target.value);request.current=null;}}/>
          </div>
          {error&&<p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={close} disabled={busy}>Voltar</Button>
            <Button disabled={busy||((editor.action==="add_item"||editor.action==="replace_item")&&!fields.product_id)
              ||(editor.action==="cancel_contract"&&fields.credit_authorized!=="true")}
              className={["cancel_contract","remove_item","reverse_payment"].includes(editor.action)
                ?"bg-red-700 text-white hover:bg-red-800":"bg-marsala text-white hover:bg-marsala-700"}>
              {busy?"Salvando...":"Confirmar alteração"}
            </Button>
          </DialogFooter>
        </form>}
      </DialogContent>
    </Dialog>
    {/* Ações da tela principal são renderizadas nos respectivos blocos pelo componente abaixo. */}
    <span className="hidden" data-order-editor-active={editor?.action??""}/>
  </>;
});
