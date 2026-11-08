import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import GoalsProgress from "@/components/reports/GoalsProgress";
import { useLiveClosetData, useLiveFinanceData, moneyBRL, dateTimeBR } from "@/hooks/useLiveClosetData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const methodLabel: Record<string,string> = {
  cash:"Dinheiro",pix:"Pix",credit:"Crédito",debit:"Débito",transfer:"Transferência",
};
export default function PDVReports() {
  const [days,setDays] = useState("30");
  const operations = useLiveClosetData();
  const financial = useLiveFinanceData();
  const start = useMemo(()=>days==="all"?null:new Date(Date.now()-Number(days)*86400000),[days]);
  if(!financial.canRead)return <p className="rounded-xl border p-6">Relatórios financeiros restritos ao perfil autorizado.</p>;
  if(operations.isPending||financial.isPending)return <p className="p-6">Consultando relatórios reais do Supabase...</p>;
  if(operations.error||financial.error||!operations.data||!financial.data)return <div role="alert" className="rounded-xl border border-red-200 p-5">
    <p>Não foi possível carregar relatórios, portanto nenhum número estimado será exibido.</p>
    <p className="text-sm text-red-700">{String(operations.error?.message??financial.error?.message??"Erro")}</p>
    <Button variant="outline" onClick={()=>{void operations.refetch();void financial.refetch();}}>Tentar novamente</Button>
  </div>;
  const contracts = operations.data.contracts.filter(c=>!start||new Date(c.created_at)>=start);
  const payments = financial.data.payments.filter(p=>p.status!=="reversed"&&(!start||new Date(p.recorded_at)>=start));
  const totalContracts=contracts.filter(c=>c.status!=="cancelled").reduce((s,c)=>s+Number(c.total),0);
  const totalPayments=payments.reduce((s,p)=>s+Number(p.amount),0);
  const methods=new Map<string,number>();
  for(const payment of payments)methods.set(payment.method,(methods.get(payment.method)??0)+Number(payment.amount));
  const contractsById=new Map(operations.data.contracts.map(c=>[c.id,c]));
  return <div className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-2xl font-semibold">Relatórios de locações</h2>
        <p className="text-sm text-muted-foreground">Somente contratos e recebimentos registrados no Supabase.</p></div>
      <div className="flex gap-2">
        <select value={days} onChange={e=>setDays(e.target.value)} aria-label="Período do relatório"
          className="rounded-md border bg-background px-3 text-sm">
          <option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option><option value="all">Todo o histórico</option>
        </select>
        <Button variant="outline" onClick={()=>{void operations.refetch();void financial.refetch();}}><RefreshCw className="mr-2 h-4 w-4"/>Atualizar</Button>
      </div>
    </header>
    <GoalsProgress contracts={operations.data.contracts} payments={financial.data.payments}/>
    <div className="grid gap-4 sm:grid-cols-3">
      <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Contratos no período</p>
        <p className="mt-3 text-2xl font-semibold">{contracts.length}</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Valor contratado</p>
        <p className="mt-3 text-2xl font-semibold">{moneyBRL(totalContracts)}</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Recebimentos registrados</p>
        <p className="mt-3 text-2xl font-semibold">{moneyBRL(totalPayments)}</p>
        <p className="text-xs text-muted-foreground">Sem conciliação bancária; períodos usam datas próprias de contrato e pagamento.</p>
      </CardContent></Card>
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Formas de recebimento</CardTitle></CardHeader><CardContent className="divide-y">
        {methods.size===0&&<p className="py-4 text-sm text-muted-foreground">Nenhum pagamento no período.</p>}
        {Array.from(methods).sort((a,b)=>b[1]-a[1]).map(([method,value])=>
          <div className="flex justify-between py-3 text-sm" key={method}>
            <span>{methodLabel[method]??method}</span><strong>{moneyBRL(value)}</strong></div>)}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Contratos recentes</CardTitle></CardHeader><CardContent className="divide-y">
        {contracts.length===0&&<p className="py-4 text-sm text-muted-foreground">Nenhum contrato no período.</p>}
        {[...contracts].sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,15).map(c=>
          <div key={c.id} className="flex justify-between gap-3 py-3 text-sm">
            <Link to={`/pdv/pedidos/${c.id}`} className="text-blue-700 hover:underline underline-offset-2">
              ALU-{String(c.contract_number).padStart(6,"0")} • {c.status} • {dateTimeBR(c.created_at)}
            </Link>
            <strong>{moneyBRL(Number(c.total))}</strong></div>)}
      </CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle>Pagamentos registrados ({payments.length})</CardTitle></CardHeader><CardContent className="divide-y">
      {payments.length===0&&<p className="py-4 text-sm text-muted-foreground">Nenhum recebimento no período.</p>}
      {[...payments].sort((a,b)=>b.recorded_at.localeCompare(a.recorded_at)).slice(0,50).map(p=>
        <div key={p.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm">
          <Link to={`/pdv/pedidos/${p.contract_id}`} className="text-blue-700 hover:underline underline-offset-2">
              ALU-{String(contractsById.get(p.contract_id)?.contract_number??"—").padStart(6,"0")}
              {" "}• {methodLabel[p.method]??p.method} • {dateTimeBR(p.recorded_at)} • {p.status}
            </Link>
          <strong>{moneyBRL(Number(p.amount))}</strong></div>)}
    </CardContent></Card>
  </div>;
}
