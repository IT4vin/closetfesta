import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, CheckCircle2, ClipboardList, CreditCard,
  FileText, Mail, MapPin, Package, Phone, Printer, RefreshCw, Shirt, UserRound, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RentalItemActions from "@/components/pdv/RentalItemActions";
import RentalPaymentActions from "@/components/pdv/RentalPaymentActions";
import OrderEditPanel, {type OrderEditorController} from "@/components/pdv/OrderEditPanel";
import { printRentalContract } from "@/lib/rentalContractPrint";
import ManualOrderMessages from "@/components/settings/ManualOrderMessages";
import PermissionManager from "@/lib/permissions";
import { useAuth } from "@/stores/authStore";
import { contactLinks, loadRentalOrderDetail, paymentTotals, readableAddress } from "@/lib/rentalOrderDetails";
import type { OrderItem } from "@/lib/api";

const currency=(n:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n);
const date=(iso:string|null|undefined)=>{
  if (!iso) return "Não informado";
  const d=/^\d{4}-\d{2}-\d{2}$/.test(iso)
    ? new Date(iso+"T12:00:00Z") : new Date(iso);
  if (!Number.isFinite(d.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"short",year:"numeric",
    timeZone: /^\d{4}-\d{2}-\d{2}$/.test(iso)?"UTC":"America/Sao_Paulo"}).format(d);
};
const timestamp=(iso:string)=>new Date(iso).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"});
const labelStatus=(value:string)=>({
  confirmed:"Confirmado",pending:"Aguardando retirada",picked_up:"Retirado",
  returned:"Devolvido",completed:"Concluído",cancelled:"Cancelado",
  operator_recorded:"Registrado no sistema",reconciled:"Conciliado",reversed:"Estornado",
}[value]??value);
const methodLabels:Record<string,string>={
  pix:"Pix",cash:"Dinheiro",debit:"Cartão de débito",credit:"Cartão de crédito",transfer:"Transferência",
};
function Step({title,when,Icon}:{title:string,when:string,Icon:typeof CalendarDays}){
  return <div className="flex min-w-0 items-start gap-2 rounded-lg bg-slate-50 px-3 py-3">
    <span className="rounded-md bg-marsala-100 p-2 text-marsala-800"><Icon className="h-4 w-4"/></span>
    <div className="min-w-0"><p className="text-xs font-semibold text-slate-700">{title}</p>
      <p className="mt-1 break-words text-xs text-muted-foreground">{when}</p></div>
  </div>;
}
function dateAcross(items:OrderItem[],field:"try_on_date"|"pickup_date"|"event_date"|"return_date"){
  const values=[...new Set(items.map(item=>item[field]).filter(Boolean))] as string[];
  return values.length===0?"Não agendado":values.length===1?date(values[0]):"Datas diferentes por traje";
}
export default function RentalOrderDetail(){
  const {id}=useParams<{id:string}>();
  const {user}=useAuth();
  const canRead=PermissionManager.hasPermission("orders","read");
  const canReadPayments=PermissionManager.hasPermission("payments","read");
  const canRecord=PermissionManager.hasPermission("payments","create");
  const [showPayment,setShowPayment]=useState(false);
  const editor=React.useRef<OrderEditorController>(null);
  const role=user?.role?.id;
  const manager=role==="admin"||role==="manager";
  const canEditDates=manager||role==="staff";
  const openEditor=(action:Parameters<OrderEditorController["open"]>[0],opts?:{itemId?:string;paymentId?:string})=>
    editor.current?.open(action,opts);
  const queryClient=useQueryClient();
  const validId=Boolean(id&&/^[a-f0-9]{8}-[a-f0-9-]{27,}$/i.test(id));
  const query=useQuery({
    queryKey:["rental-order-detail",user?.id,id,canReadPayments],
    queryFn:()=>loadRentalOrderDetail(id!,canReadPayments),
    enabled:Boolean(user?.id&&canRead&&validId),
    staleTime:10000,
    refetchOnWindowFocus:true,
    retry:1,
  });
  const detail=query.data;
  const order=detail?.order;
  const client=detail?.customer;
  const imageMap=useMemo(()=>{
    const m=new Map<string,string>();
    for(const image of detail?.images??[]){
      if(image.url&&(!m.has(image.product_id)||image.is_primary)){
        m.set(image.product_id,image.url);
      }
    }
    return m;
  },[detail]);
  const progressMap=useMemo(()=>new Map((detail?.itemProgress??[]).map(item=>[item.id,item])),[detail]);
  const currentItems=order?.items.filter(item=>progressMap.get(item.id)?.status!=="cancelled")??[];
  const contact=contactLinks(client?.phone??null);
  const address=readableAddress(client?.address??null);
  const financial=detail?.payments?paymentTotals(order?.total??0,detail.payments):null;
  const refresh=async()=>{
    await queryClient.invalidateQueries({queryKey:["rental-order-detail",user?.id,id]});
  };

  if(!canRead)return <div className="rounded-xl border bg-white p-8" role="alert">Seu perfil não tem permissão para consultar pedidos.</div>;
  if(!validId)return <div className="rounded-xl border bg-white p-8">
    <p role="alert">Número de pedido inválido.</p>
    <Link to="/pdv?tab=pedidos" className="mt-4 inline-block text-sm text-marsala-800 underline">Voltar aos pedidos</Link>
  </div>;
  if(query.isPending)return <div className="rounded-xl border bg-white p-8 text-sm">Carregando pedido, cliente e pagamentos no Supabase...</div>;
  if(query.isError)return <Card className="border-red-200"><CardContent className="space-y-3 p-6">
    <p role="alert" className="font-medium text-red-700">Não foi possível carregar este pedido.</p>
    <p className="text-sm">{query.error instanceof Error?query.error.message:"Erro de consulta"}</p>
    <Button variant="outline" onClick={()=>void query.refetch()}>Tentar novamente</Button>
  </CardContent></Card>;
  if(!detail||!order||!client)return <Card><CardContent className="space-y-3 p-8">
    <p role="alert">Pedido não encontrado ou indisponível para este usuário.</p>
    <Button variant="outline" asChild><Link to="/pdv?tab=pedidos">Voltar aos pedidos</Link></Button>
  </CardContent></Card>;

  return <div className="page-transition space-y-5 pb-10">
    <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
      <div>
        <Button variant="ghost" asChild className="-ml-3 mb-1 text-slate-600">
          <Link to="/pdv?tab=pedidos"><ArrowLeft className="mr-2 h-4 w-4"/> Voltar aos pedidos</Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Detalhes do pedido</h1>
        <p className="text-sm text-muted-foreground">Histórico de locação e contato do cliente • registros reais do Supabase</p>
      </div>
      <Button variant="outline" onClick={()=>void query.refetch()} disabled={query.isFetching}>
        <RefreshCw className="mr-2 h-4 w-4"/>Atualizar informações
      </Button>
    </div>

    <OrderEditPanel ref={editor} detail={detail} onChanged={refresh}/>
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_315px]">
      <div className="min-w-0 space-y-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Step title="Prova" when={dateAcross(currentItems,"try_on_date")} Icon={Shirt}/>
            <Step title="Retirada" when={dateAcross(currentItems,"pickup_date")} Icon={Package}/>
            <Step title="Evento" when={dateAcross(currentItems,"event_date")} Icon={CalendarDays}/>
            <Step title="Devolução" when={dateAcross(currentItems,"return_date")} Icon={CheckCircle2}/>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b pb-4"><div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-marsala-700"/>Produtos do pedido ({currentItems.length})
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {manager&&order.status!=="cancelled"&&order.status!=="completed"&&
                <Button size="sm" className="bg-marsala text-white hover:bg-marsala-700 print:hidden"
                  onClick={()=>openEditor("add_item")}>Incluir produto</Button>}
              <Badge variant="outline">{labelStatus(order.status)}</Badge>
            </div>
          </div></CardHeader>
          <CardContent className="divide-y">
            {detail.imagesError&&<p className="py-3 text-xs text-amber-700">Fotografias indisponíveis: {detail.imagesError}</p>}
            {order.items.map(item=>{
              const state=progressMap.get(item.id);
              const rawStatus=state?.status??item.status??"pending";
              const image=imageMap.get(item.product_id);
              const allowActions=order.status!=="cancelled" && rawStatus!=="cancelled";
              return <div key={item.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start">
                <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-slate-50">
                  {image?<img src={image} alt={item.product?.name??"Traje alugado"} className="h-full w-full object-cover" loading="lazy"/>:
                    <Shirt className="h-8 w-8 text-slate-300"/>}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className={"font-semibold "+(rawStatus==="cancelled"?"text-slate-400 line-through":"text-slate-900")}>
                    {item.product?.name??"Traje arquivado"}
                  </p>
                  {rawStatus==="cancelled"&&<p className="text-xs text-red-700">Removido da reserva; preservado apenas no histórico</p>}
                  <p className="text-xs text-muted-foreground">Código: {item.product?.sku??"Não informado"} • Exemplar contratado: 1</p>
                  <Badge variant={rawStatus==="cancelled"?"destructive":"outline"}>{labelStatus(rawStatus)}</Badge>
                  <div className="grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                    <p>Prova: <strong>{date(item.try_on_date)}</strong></p>
                    <p>Retirada: <strong>{date(item.pickup_date)}</strong></p>
                    <p>Evento: <strong>{date(item.event_date)}</strong></p>
                    <p>Devolução prevista: <strong>{date(item.return_date)}</strong></p>
                    {state?.picked_up_at&&<p>Entregue em: {timestamp(state.picked_up_at)}</p>}
                    {state?.actual_return_at&&<p>Devolvido em: {timestamp(state.actual_return_at)}</p>}
                  </div>
                  {state?.return_notes&&<p className="rounded-lg bg-slate-50 p-2 text-xs">Observações da devolução: {state.return_notes}</p>}
                  {allowActions&&<div className="flex flex-wrap gap-2 pt-1 print:hidden">
                    {canEditDates&&rawStatus==="confirmed"&&
                      <Button size="sm" variant="outline" className="border-marsala-200 text-marsala-800 hover:bg-marsala-50"
                        onClick={()=>openEditor("item_dates",{itemId:item.id})}>Editar datas</Button>}
                    {manager&&rawStatus==="confirmed"&&<>
                      <Button size="sm" variant="outline" className="border-marsala-200 text-marsala-800 hover:bg-marsala-50"
                        onClick={()=>openEditor("replace_item",{itemId:item.id})}>Trocar traje</Button>
                      <Button size="sm" variant="outline" className="border-marsala-200 text-marsala-800 hover:bg-marsala-50"
                        onClick={()=>openEditor("item_discount",{itemId:item.id})}>Desconto</Button>
                      <Button size="sm" variant="outline" className="border-marsala-200 text-marsala-800 hover:bg-marsala-50"
                        onClick={()=>openEditor("item_price",{itemId:item.id})}>Preço</Button>
                      <Button size="sm" variant="outline" className="border-red-200 text-red-700"
                        onClick={()=>openEditor("remove_item",{itemId:item.id})}>Retirar item</Button>
                    </>}
                  </div>}
                  {allowActions&&<div className="print:hidden pt-1">
                    <RentalItemActions orderId={order.id} item={{...item,status:rawStatus==="picked_up"?"picked_up":rawStatus==="returned"?"returned":"pending"}}
                      onChanged={refresh}/>
                  </div>}
                </div>
                <div className="shrink-0 text-right text-sm">
                  <p className="font-semibold">{currency(Number(item.unit_price)-Number(item.discount))}</p>
                  {Number(item.discount)>0&&<p className="text-xs text-emerald-700">Desconto {currency(Number(item.discount))}</p>}
                </div>
              </div>;
            })}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b pb-4"><div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-marsala-700"/>Pagamentos</CardTitle>
            {canRecord && financial && financial.remaining>0 && order.status!=="cancelled"&&
              <Button size="sm" className="print:hidden" onClick={()=>setShowPayment(v=>!v)}>
                <CreditCard className="mr-2 h-4 w-4"/> {showPayment?"Fechar formulário":"Novo pagamento"}
              </Button>}
          </div></CardHeader>
          <CardContent className="space-y-4 py-4">
            {detail.payments===null?
              <p className="text-sm text-muted-foreground">O histórico de pagamentos é restrito ao caixa e à gerência.</p>:
              detail.payments.length===0?
              <p className="text-sm text-muted-foreground">Nenhum pagamento registrado para este contrato.</p>:
              <div className="overflow-x-auto"><table className="w-full text-left text-sm">
                <thead className="border-b text-xs text-muted-foreground"><tr>
                  <th className="pb-3 pr-2 font-medium">Data</th><th className="pb-3 pr-2 font-medium">Meio</th>
                  <th className="pb-3 pr-2 font-medium">Situação</th><th className="pb-3 text-right font-medium">Valor</th>
                </tr></thead>
                <tbody>{detail.payments.map(payment=><tr key={payment.id} className="border-b last:border-none">
                  <td className="py-3 pr-2">{timestamp(payment.recorded_at)}</td>
                  <td className="py-3 pr-2">{methodLabels[payment.method]??payment.method}{payment.installments>1?` · ${payment.installments}x`:""}</td>
                  <td className="py-3 pr-2"><span className={payment.status==="reversed"?"text-red-700":"text-slate-600"}>
                    {labelStatus(payment.status)}</span></td>
                  <td className="py-3 text-right font-semibold">{currency(Number(payment.amount))}
                    {manager&&payment.status==="operator_recorded"&&order.status!=="cancelled"&&
                      <Button type="button" size="sm" variant="outline"
                        className="ml-2 border-red-200 text-red-700 print:hidden"
                        onClick={()=>openEditor("reverse_payment",{paymentId:payment.id})}>Estornar</Button>}
                  </td>
                </tr>)}</tbody>
              </table></div>}
            {financial&&<div className="flex flex-wrap justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <span>Recebido: <strong>{currency(financial.received)}</strong></span>
              <span>Saldo em aberto: <strong className={financial.remaining>0?"text-rose-700":"text-emerald-700"}>{currency(financial.remaining)}</strong></span>
            </div>}
            {financial?.exceeded&&<p role="alert" className="text-xs text-red-700">A soma dos recebimentos supera o total do contrato. Solicite conferência financeira.</p>}
            {showPayment&&canRecord&&order.status!=="cancelled"&&
              <div className="rounded-lg border p-3 print:hidden">
                <RentalPaymentActions contractId={order.id} contractTotal={order.total}
                  onChanged={()=>void refresh()}/>
              </div>}
            <p className="text-xs text-muted-foreground">Pagamentos registrados no sistema não comprovam, por si só, conciliação bancária.</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm"><CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-marsala-700"/>Observações do pedido</CardTitle>
        </CardHeader><CardContent className="py-5">
          <p className="whitespace-pre-wrap rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
            {order.observations?.trim()||"Nenhuma observação registrada neste contrato."}
          </p>
          {canEditDates&&order.status!=="cancelled"&&order.status!=="completed"&&
            <Button size="sm" variant="outline" className="mt-3 border-marsala-200 text-marsala-800 print:hidden"
              onClick={()=>openEditor("notes")}>Editar observações</Button>}
        </CardContent></Card>

        <Card className="shadow-sm"><CardHeader className="border-b pb-4">
          <CardTitle className="text-base">Documentos e cobranças</CardTitle>
        </CardHeader><CardContent className="space-y-2 py-4 text-sm text-muted-foreground">
          <p>O botão <strong>Imprimir contrato</strong> prepara uma minuta com as datas, itens e valores reais para conferência e assinatura.</p>
          <p>Nenhum carnê, boleto ou nota fiscal foi consultado ou emitido por esta tela.</p>
          <p>Emissão de documentos fiscais e boletos depende de integração própria. Imprimir o resumo não substitui o contrato assinado ou uma nota fiscal.</p>
        </CardContent></Card>
      </div>

      <aside className="min-w-0 space-y-4 xl:sticky xl:top-4">
        <div className="rounded-xl bg-marsala p-5 text-white shadow-sm">
          <p className="text-xs font-medium text-marsala-100">Pedido de aluguel</p>
          <p className="my-1 break-all text-2xl font-bold">{order.order_number}</p>
          <Badge className="my-2 border-white/30 bg-white/15 text-white hover:bg-white/15">{labelStatus(order.status)}</Badge>
          <div className="mt-3 flex items-start gap-2">
            <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-marsala-100"/>
            <h2 className="break-words text-xl font-semibold leading-tight">{client.full_name}</h2>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            {client.phone?<div className="flex flex-wrap items-center gap-2">
              <Phone className="h-4 w-4"/><a className="underline underline-offset-2" href={contact.tel??undefined}>{client.phone}</a>
              {contact.whatsapp&&<a href={contact.whatsapp} target="_blank" rel="noopener noreferrer"
                className="rounded-md bg-white/15 px-2 py-1 text-xs underline underline-offset-2">WhatsApp</a>}
            </div>:<p className="text-marsala-100">Telefone não cadastrado</p>}
            {client.email&&<a className="flex items-start gap-2 break-all underline underline-offset-2"
              href={`mailto:${client.email}`}><Mail className="mt-0.5 h-4 w-4 shrink-0"/>{client.email}</a>}
            {client.document&&<p>Documento: {client.document}</p>}
            {address&&<p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0"/>{address}</p>}
            {client.notes&&<p className="rounded-lg bg-white/10 p-2 text-xs">Observações do cadastro: {client.notes}</p>}
            {canEditDates&&order.status!=="cancelled"&&
              <Button size="sm" className="mt-3 border-white/50 bg-white/15 text-white hover:bg-white/25 print:hidden"
                variant="outline" onClick={()=>openEditor("client")}>Editar contato e cadastro</Button>}
          </div>
          <p className="mt-5 text-xs text-marsala-100">Criado em {timestamp(order.created_at)}</p>
          {detail.attendant&&<p className="mt-1 text-xs text-marsala-100">Atendido por {detail.attendant}</p>}
        </div>
        <Card className="shadow-sm"><CardContent className="space-y-3 p-5">
          <div className="flex justify-between gap-2 text-sm"><span className="text-muted-foreground">Subtotal</span>
            <strong>{currency(order.subtotal)}</strong></div>
          {Number(order.total_discount)>0&&<div className="flex justify-between gap-2 text-sm text-emerald-700">
            <span>Desconto no pedido</span><span>-{currency(order.total_discount)}</span></div>}
          <div className="flex justify-between gap-2 border-t pt-3 text-base"><strong>Total</strong>
            <strong>{currency(order.total)}</strong></div>
          {financial?<><div className="flex justify-between gap-2 text-sm"><span>Recebido</span>
              <span className="font-semibold text-emerald-700">{currency(financial.received)}</span></div>
            <div className="flex justify-between gap-2 text-sm"><span>Saldo aberto</span>
              <strong className={financial.remaining>0?"text-rose-600":"text-emerald-700"}>{currency(financial.remaining)}</strong></div></>:
            <p className="rounded bg-amber-50 p-2 text-xs text-amber-900">Informações financeiras restritas ao seu perfil.</p>}
          {manager&&order.status!=="cancelled"&&order.status!=="completed"&&<>
            <Button variant="outline" className="w-full border-marsala-300 text-marsala-800 print:hidden"
              onClick={()=>openEditor("order_discount")}>Conceder desconto no pedido</Button>
            <Button variant="outline" className="w-full border-red-200 text-red-700 print:hidden"
              onClick={()=>openEditor("cancel_contract")}>Cancelar pedido</Button>
          </>}
          {canRecord&&financial&&financial.remaining>0&&order.status!=="cancelled"&&
            <Button className="w-full bg-marsala hover:bg-marsala-700 print:hidden" onClick={()=>setShowPayment(true)}>
              <Wallet className="mr-2 h-4 w-4"/>Novo pagamento
            </Button>}
          <Button className="w-full bg-marsala text-white hover:bg-marsala-700 print:hidden"
            onClick={()=>{void printRentalContract(detail).catch(cause=>window.alert(
              cause instanceof Error?cause.message:"Erro ao preparar impressão."));}}>
            <Printer className="mr-2 h-4 w-4"/>Imprimir contrato
          </Button>
          {manager && <Button variant="outline" className="w-full border-marsala-300 text-marsala-800 print:hidden"
            onClick={()=>{if(!window.confirm("Emitir uma nova versão do contrato com os dados atuais? A anterior ficará preservada."))return;
              void printRentalContract(detail,{newRevision:true}).catch(cause=>window.alert(cause instanceof Error?cause.message:"Erro ao emitir versão."));}}>
            <FileText className="mr-2 h-4 w-4"/>Emitir nova versão do contrato
          </Button>}
          <Button variant="outline" className="w-full print:hidden" onClick={()=>window.print()}>
            <Printer className="mr-2 h-4 w-4"/>Imprimir resumo do pedido
          </Button>
          <p className="text-xs text-muted-foreground">Alterações exigem justificativa e ficam no histórico. Emissão fiscal e boletos dependem de integração própria.</p>
          <ManualOrderMessages detail={detail}/>
        </CardContent></Card>
      </aside>
    </div>
  </div>;
}
