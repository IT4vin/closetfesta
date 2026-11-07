import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/stores/authStore";
import { fetchAllRows, moneyBRL, type LiveClosetData } from "@/hooks/useLiveClosetData";
import { Card,CardHeader,CardTitle,CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type View = "creditos" | "consignados" | "comissoes";
type CreditEntry={id:string;client_id:string;delta:number;kind:string;related_client_id:string|null;
  note:string;created_at:string;operation_id:string;};
type Consignment={id:string;unit_id:string;product_id:string;partner_name:string;status:string;
  note:string|null;started_at:string;returned_at:string|null;};
type Commission={id:string;contract_id:string;seller_id:string;rate:number;amount:number;status:string;
  created_at:string;paid_at:string|null;};
type Profile={id:string;full_name:string|null;};
const number=(input:string)=>Number(input.replace(",","."));
const date=(input:string)=>new Date(input).toLocaleString("pt-BR");
const selectClass="h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const empty=<p className="py-5 text-sm text-muted-foreground">Nenhum registro encontrado.</p>;

export default function SpecialReports({view,operations,loading,error}:{view:View,operations:LiveClosetData|undefined,
  loading:boolean,error:Error|null}) {
  const {user}=useAuth();
  const manager=user?.role?.id==="admin"||user?.role?.id==="manager";
  const [mode,setMode]=useState<"adjust"|"transfer">("adjust");
  const [client,setClient]=useState("");
  const [destination,setDestination]=useState("");
  const [amount,setAmount]=useState("");
  const [direction,setDirection]=useState("plus");
  const [reason,setReason]=useState("");
  const [unit,setUnit]=useState("");
  const [partner,setPartner]=useState("");
  const [contract,setContract]=useState("");
  const [seller,setSeller]=useState("");
  const [rate,setRate]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [submitError,setSubmitError]=useState("");
  const clientName=new Map((operations?.clients??[]).map(c=>[c.id,c.full_name]));
  const productName=new Map((operations?.products??[]).map(p=>[p.id,p.name]));
  const contracts=new Map((operations?.contracts??[]).map(c=>[c.id,c]));
  const queryClient=useQueryClient();
  const canRead=Boolean(user?.id)&&(view!=="creditos"||manager);
  const query=useQuery({
    queryKey:["closet-special-report",view,user?.id],
    enabled:canRead,
    queryFn:async()=>{
      if(view==="creditos")return {credits:await fetchAllRows<CreditEntry>("client_credit_entries",
        "id,client_id,delta,kind,related_client_id,note,created_at,operation_id")};
      if(view==="consignados")return {consignments:await fetchAllRows<Consignment>("product_consignments",
        "id,unit_id,product_id,partner_name,status,note,started_at,returned_at")};
      const [commissions,profiles]=await Promise.all([
        fetchAllRows<Commission>("sales_commissions",
          "id,contract_id,seller_id,rate,amount,status,created_at,paid_at"),
        fetchAllRows<Profile>("profiles","id,full_name"),
      ]);
      return {commissions,profiles};
    },
  });

  const invalidate=async()=>{
    await Promise.all([
      queryClient.invalidateQueries({queryKey:["closet-special-report"]}),
      queryClient.invalidateQueries({queryKey:["closet-live-operations"]}),
    ]);
  };
  const action=async(fn:()=>Promise<void>)=>{
    if(busy||!manager)return;
    setBusy(true);setMessage("");setSubmitError("");
    try{await fn();await invalidate();setMessage("Operação confirmada pelo Supabase.");}
    catch(e){setSubmitError(e instanceof Error?e.message:"A operação não foi concluída.");}
    finally{setBusy(false);}
  };
  const rpc=async(name:string,payload:Record<string,unknown>)=>{
    const r=await (supabase as any).rpc(name,payload);
    if(r.error)throw new Error(r.error.message);
    if(!r.data)throw new Error("O banco não confirmou a operação.");
  };
  const submitCredit=(e:React.FormEvent)=>{e.preventDefault();void action(async()=>{
    if(!client||!amount||!reason.trim()||reason.trim().length<3)throw new Error("Informe cliente, valor e justificativa.");
    const value=number(amount);
    if(!Number.isFinite(value)||value<=0||Math.round(value*100)!==value*100)throw new Error("Valor monetário inválido.");
    if(mode==="transfer"){
      if(!destination||destination===client)throw new Error("Escolha cliente de destino diferente.");
      await rpc("credit_transfer",{p_from:client,p_to:destination,p_amount:value,p_note:reason.trim(),p_operation:crypto.randomUUID()});
    }else{
      await rpc("credit_adjust",{p_client:client,p_delta:direction==="minus"?-value:value,
        p_note:reason.trim(),p_operation:crypto.randomUUID()});
    }
    setAmount("");setReason("");
  });};
  const submitConsignment=(e:React.FormEvent)=>{e.preventDefault();void action(async()=>{
    if(!unit||partner.trim().length<2)throw new Error("Selecione exemplar e parceiro.");
    await rpc("consignment_register",{p_unit:unit,p_partner:partner.trim(),p_note:reason.trim(),
      p_operation:crypto.randomUUID()});
    setUnit("");setPartner("");setReason("");
  });};
  const submitCommission=(e:React.FormEvent)=>{e.preventDefault();void action(async()=>{
    const v=number(rate);
    if(!contract||!seller||!Number.isFinite(v)||v<=0||v>100)throw new Error("Informe contrato, vendedor e percentual.");
    await rpc("commission_register",{p_contract:contract,p_seller:seller,p_rate:v,p_operation:crypto.randomUUID()});
    setContract("");setSeller("");setRate("");
  });};
  if(!canRead)return <p className="rounded-lg border p-6 text-sm">Acesso a créditos restrito à gerência.</p>;
  if(loading||query.isPending)return <p className="rounded-lg border p-6">Consultando registros no Supabase...</p>;
  if(error||query.error||!operations||!query.data)return <div role="alert" className="rounded-lg border border-red-200 p-6 text-sm text-red-700">
    Falha ao consultar registros reais: {String(error?.message??query.error?.message??"indisponível")}
    <Button variant="outline" className="ml-2" onClick={()=>void query.refetch()}>Tentar novamente</Button>
  </div>;
  const payload=query.data;
  const credits="credits" in payload?payload.credits:[];
  const consignments="consignments" in payload?payload.consignments:[];
  const commissions="commissions" in payload?payload.commissions:[];
  const profiles="profiles" in payload?payload.profiles:[];
  const name=new Map(profiles.map(p=>[p.id,p.full_name??p.id]));
  const balances=new Map<string,number>();
  for(const entry of credits)balances.set(entry.client_id,(balances.get(entry.client_id)??0)+Number(entry.delta));
  const occupiedUnits=new Set(operations.items.filter(i=>["confirmed","picked_up"].includes(i.status)).map(i=>i.unit_id));
  const freeUnits=operations.units.filter(u=>u.status==="available"&&!occupiedUnits.has(u.id)&&productName.has(u.product_id));
  const availableContracts=operations.contracts.filter(c=>c.status!=="cancelled");
  return <div className="space-y-4">
    {!!submitError&&<p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{submitError}</p>}
    {!!message&&<p role="status" className="rounded border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">{message}</p>}
    {view==="creditos"&&<>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Créditos em circulação",moneyBRL(Array.from(balances.values()).reduce((s,v)=>s+v,0))],
          ["Clientes com saldo",String([...balances.values()].filter(v=>v>0).length)],
          ["Lançamentos auditáveis",String(credits.length)],
        ].map(([title,value])=><Card key={title}><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">{title}</p><p className="mt-2 text-xl font-semibold">{value}</p>
        </CardContent></Card>)}
      </div>
      {manager&&<Card><CardHeader><CardTitle className="text-base">Registrar crédito / transferência</CardTitle></CardHeader>
        <CardContent><form className="grid gap-3 md:grid-cols-2" onSubmit={submitCredit}>
          <div><Label>Operação</Label><select className={selectClass} value={mode} onChange={e=>setMode(e.target.value as typeof mode)}>
            <option value="adjust">Ajustar crédito de cliente</option><option value="transfer">Transferir entre clientes</option></select></div>
          <div><Label>Cliente de origem *</Label><select className={selectClass} value={client} required onChange={e=>setClient(e.target.value)}>
            <option value="">Selecione o cliente</option>{operations.clients.map(c=><option key={c.id} value={c.id}>{c.full_name} ({moneyBRL(balances.get(c.id)??0)})</option>)}
          </select></div>
          {mode==="transfer"?<div><Label>Cliente de destino *</Label>
            <select className={selectClass} value={destination} required onChange={e=>setDestination(e.target.value)}>
              <option value="">Selecione o destinatário</option>{operations.clients.filter(c=>c.id!==client).map(c=><option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select></div>:<div><Label>Tipo de ajuste</Label><select className={selectClass} value={direction} onChange={e=>setDirection(e.target.value)}>
              <option value="plus">Adicionar crédito autorizado</option><option value="minus">Debitar crédito</option>
            </select></div>}
          <div><Label>Valor em reais *</Label><Input value={amount} required type="number" step="0.01" min="0.01" onChange={e=>setAmount(e.target.value)}/></div>
          <div className="md:col-span-2"><Label>Justificativa obrigatória *</Label>
            <Input maxLength={500} minLength={3} required value={reason} onChange={e=>setReason(e.target.value)}/></div>
          <Button type="submit" disabled={busy} className="md:col-span-2">Confirmar operação no banco</Button>
        </form></CardContent></Card>}
      <Card><CardHeader><CardTitle className="text-base">Saldos dos clientes</CardTitle></CardHeader><CardContent className="divide-y">
        {operations.clients.map(c=><div className="flex justify-between py-3 text-sm" key={c.id}>
          <span>{c.full_name}</span><strong>{moneyBRL(balances.get(c.id)??0)}</strong></div>)}
        {operations.clients.length===0&&empty}
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Histórico de ajustes e transferências</CardTitle></CardHeader>
        <CardContent className="divide-y">{[...credits].sort((a,b)=>b.created_at.localeCompare(a.created_at)).map(e=>
          <div key={e.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm">
            <div><strong>{clientName.get(e.client_id)??"Cliente"}</strong>
              <p className="text-xs text-muted-foreground">{e.kind==="transfer_in"?"Transferência recebida":e.kind==="transfer_out"?"Transferência enviada":"Ajuste"} • {date(e.created_at)}</p>
              <p className="text-xs text-muted-foreground">{e.note}</p></div>
            <strong className={Number(e.delta)<0?"text-red-700":"text-teal-700"}>{moneyBRL(Number(e.delta))}</strong>
          </div>)}
          {credits.length===0&&empty}</CardContent></Card>
      <p className="text-xs text-muted-foreground">Crédito é um saldo de cliente, não pagamento em dinheiro ou receita bancária. Ajustes e transferências exigem autorização da gerência.</p>
    </>}
    {view==="consignados"&&<>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Exemplares consignados</p>
          <p className="text-2xl font-semibold">{consignments.filter(c=>c.status==="active").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Exemplares reservados em locações</p>
          <p className="text-2xl font-semibold">{occupiedUnits.size}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Exemplares livres para consignar</p>
          <p className="text-2xl font-semibold">{freeUnits.length}</p></CardContent></Card>
      </div>
      {manager&&<Card><CardHeader><CardTitle className="text-base">Registrar consignação</CardTitle></CardHeader><CardContent>
        <form onSubmit={submitConsignment} className="grid gap-3 md:grid-cols-2">
          <div><Label>Exemplar disponível *</Label><select required value={unit} onChange={e=>setUnit(e.target.value)} className={selectClass}>
            <option value="">Selecione um exemplar livre</option>
            {freeUnits.map(u=><option key={u.id} value={u.id}>{productName.get(u.product_id)} • exemplar {u.unit_number}</option>)}
          </select></div>
          <div><Label>Parceiro / consignatário *</Label><Input minLength={2} maxLength={180} required value={partner}
            onChange={e=>setPartner(e.target.value)}/></div>
          <div className="md:col-span-2"><Label>Observações</Label><Input value={reason} onChange={e=>setReason(e.target.value)} maxLength={500}/></div>
          <Button disabled={busy} type="submit" className="md:col-span-2">Registrar consignação e bloquear exemplar</Button>
        </form></CardContent></Card>}
      <Card><CardHeader><CardTitle className="text-base">Histórico de consignações</CardTitle></CardHeader><CardContent className="divide-y">
        {[...consignments].sort((a,b)=>b.started_at.localeCompare(a.started_at)).map(c=>
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <div><strong>{productName.get(c.product_id)??"Produto arquivado"}</strong>
              <p className="text-xs text-muted-foreground">{c.partner_name} • {date(c.started_at)}</p>
              <p className="text-xs text-muted-foreground">{c.status==="active"?"Em consignação":"Devolvido pelo parceiro"}</p></div>
            {manager&&c.status==="active"&&<Button variant="outline" disabled={busy} size="sm" onClick={()=>void action(async()=>{
              if(!window.confirm("Confirma a devolução física do exemplar consignado?"))return;
              await rpc("consignment_return",{p_id:c.id});
            })}>Registrar retorno</Button>}
          </div>)}
        {consignments.length===0&&empty}
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Exemplares reservados em contratos</CardTitle></CardHeader>
        <CardContent className="divide-y">{operations.items.filter(i=>["confirmed","picked_up"].includes(i.status)).map(i=>{
          const c=contracts.get(i.contract_id);
          return <div key={i.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm">
            <div><strong>{productName.get(i.product_id)??"Produto arquivado"}</strong>
              <p className="text-xs text-muted-foreground">Contrato #{c?.contract_number??"—"} • {clientName.get(c?.client_id??"")??"Cliente"}
                {" "}• {i.pickup_date} até {i.return_date}</p></div><span>{i.status}</span>
          </div>;
        })}{occupiedUnits.size===0&&empty}</CardContent></Card>
      <p className="text-xs text-muted-foreground">Consignação e reserva são situações diferentes: consignar altera o status físico do exemplar; reservar associa um exemplar a contrato com datas.</p>
    </>}
    {view==="comissoes"&&<>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Comissões registradas",String(commissions.length)],
          ["Valor pendente",moneyBRL(commissions.filter(c=>c.status==="pending").reduce((s,c)=>s+Number(c.amount),0))],
          ["Valor marcado pago",moneyBRL(commissions.filter(c=>c.status==="paid").reduce((s,c)=>s+Number(c.amount),0))],
        ].map(([title,value])=><Card key={title}><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">{title}</p><p className="mt-2 text-xl font-semibold">{value}</p></CardContent></Card>)}
      </div>
      {manager&&<Card><CardHeader><CardTitle className="text-base">Vincular comissão a contrato</CardTitle></CardHeader><CardContent>
        <form onSubmit={submitCommission} className="grid gap-3 md:grid-cols-3">
          <div><Label>Contrato real *</Label><select required className={selectClass} value={contract} onChange={e=>setContract(e.target.value)}>
            <option value="">Selecione</option>{availableContracts.map(c=><option key={c.id} value={c.id}>#{c.contract_number} — {moneyBRL(Number(c.total))}</option>)}
          </select></div>
          <div><Label>Vendedor *</Label><select required className={selectClass} value={seller} onChange={e=>setSeller(e.target.value)}>
            <option value="">Selecione</option>{profiles.map(p=><option key={p.id} value={p.id}>{p.full_name??p.id}</option>)}
          </select></div>
          <div><Label>Comissão (%) *</Label><Input required value={rate} type="number" min="0.01" max="100" step="0.01"
            onChange={e=>setRate(e.target.value)}/></div>
          <Button type="submit" disabled={busy} className="md:col-span-3">Registrar comissão calculada pelo banco</Button>
        </form>
      </CardContent></Card>}
      <Card><CardHeader><CardTitle className="text-base">Histórico de comissões</CardTitle></CardHeader>
        <CardContent className="divide-y">{[...commissions].sort((a,b)=>b.created_at.localeCompare(a.created_at)).map(c=>
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <div><strong>{name.get(c.seller_id)??"Vendedor"}</strong>
              <p className="text-xs text-muted-foreground">Contrato #{contracts.get(c.contract_id)?.contract_number??"—"} • {c.rate}% • {date(c.created_at)}</p>
              <p className="text-xs text-muted-foreground">{c.status==="paid"?"Marcada como paga":"Pendente"}</p></div>
            <div className="flex items-center gap-3"><strong>{moneyBRL(Number(c.amount))}</strong>
              {manager&&c.status==="pending"&&<Button size="sm" variant="outline" disabled={busy}
                onClick={()=>void action(async()=>{
                  if(!window.confirm("Confirmar pagamento já realizado ao vendedor?"))return;
                  await rpc("commission_mark_paid",{p_id:c.id});
                })}>Marcar paga</Button>}</div>
          </div>)}
          {commissions.length===0&&empty}</CardContent></Card>
      <p className="text-xs text-muted-foreground">Percentuais são definidos pelo gerente, não presumidos. Marcar como paga registra controle interno; não realiza transferência financeira.</p>
    </>}
  </div>;
}
