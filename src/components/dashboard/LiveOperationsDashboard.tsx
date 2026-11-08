import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarDays, RefreshCw, ReceiptText, HandCoins, CalendarCheck2, Clock3, ArrowRightLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLiveClosetData, useLiveFinanceData, moneyBRL, dateTimeBR } from "@/hooks/useLiveClosetData";
import { addDays, localDay, operationRows, payableBalance, receivableBalance, periodResults, type Period, type OperationKind } from "@/lib/operationalAnalytics";
import DashboardVisitConfirmationDialog from "@/components/dashboard/DashboardVisitConfirmationDialog";
import { fetchDashboardVisitList, visitCount, type DashboardVisitPeriod, type DashboardVisitKind } from "@/lib/dashboardVisits";

const labels: Record<OperationKind,string> = { prova:"Provas", retirada:"Retiradas", devolucao:"Devoluções" };
const themes = {
  overdue:"bg-rose-50 text-rose-700 border-rose-100",
  today:"bg-blue-50 text-blue-700 border-blue-100",
  next:"bg-teal-50 text-teal-700 border-teal-100",
};
const labelBR = (day:string) => day.split("-").reverse().join("/");

export default function LiveOperationsDashboard() {
  const live = useLiveClosetData();
  const finance = useLiveFinanceData();
  const [today] = useState(()=>localDay(new Date()));
  const [visitList,setVisitList] = useState<{period:DashboardVisitPeriod;kind:DashboardVisitKind}|null>(null);
  const data = live.data;
  const operations = useMemo(()=>data?operationRows(data):[],[data]);
  const visits=useQuery({
    queryKey:["closet-dashboard-visits","summary",today],
    queryFn:async()=>{
      const periods:DashboardVisitPeriod[]=["overdue","today","next10"];
      const entries=await Promise.all(periods.map(period=>fetchDashboardVisitList(period,null,0,1)));
      return Object.fromEntries(entries.map((result,index)=>[periods[index],result])) as
        Record<DashboardVisitPeriod,(typeof entries)[number]>;
    },
    staleTime:0,refetchOnMount:"always",refetchOnWindowFocus:true,refetchInterval:60000,
  });

  if (live.isPending) return <p className="rounded-xl border bg-white p-6">Consultando dados reais do Supabase...</p>;
  if (live.error || !data) return <Card className="border-red-200"><CardContent className="space-y-3 p-6">
    <p role="alert">Falha na leitura da loja. Nenhum indicador será estimado.</p>
    <p className="text-sm text-red-700">{live.error instanceof Error?live.error.message:"Consulta indisponível"}</p>
    <Button variant="outline" onClick={()=>void live.refetch()}>Tentar novamente</Button>
  </CardContent></Card>;

  const todayAgenda = data.appointments.filter(a=>a.status!=="cancelled"&&localDay(a.start_at)===today)
    .sort((a,b)=>a.start_at.localeCompare(b.start_at));
  const customers = new Map(data.clients.map(c=>[c.id,c.full_name]));
  const products = new Map(data.products.map(p=>[p.id,p.name]));
  const groups = [
    {title:"Em atraso",from:"0000-01-01",to:addDays(today,-1),theme:"overdue" as const},
    {title:"Hoje",from:today,to:today,theme:"today" as const},
    {title:"Próximos 10 dias",from:addDays(today,1),to:addDays(today,10),theme:"next" as const},
  ];
  const results: {title:string;period:Period}[] = [
    {title:"Resultados do dia",period:"day"}, {title:"Resultados da semana",period:"week"},
    {title:"Resultados do mês",period:"month"},
  ];
  const moneyReady=finance.canRead && Boolean(finance.data) && !finance.error;
  const periodValue=(period:Period)=>{
    if(!moneyReady)return null;
    return periodResults(data,finance.data!,period,today);
  };
  const pendingAppointments=operations.filter(o=>o.day===today);
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-2xl font-semibold">Painel operacional</h2>
        <p className="text-sm text-muted-foreground">Períodos pela data local de Campo Grande/RJ • {labelBR(today)} • Somente dados reais</p></div>
      <Button variant="outline" onClick={()=>{void live.refetch();void visits.refetch();if(finance.canRead)void finance.refetch();}}>
        <RefreshCw className="mr-2 h-4 w-4"/> Atualizar
      </Button>
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {groups.map(group=><Card key={group.title} className="shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm">{group.title}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(["prova","retirada","devolucao"] as DashboardVisitKind[]).map(kind=>{
            const period=group.theme==="overdue"?"overdue":group.theme==="today"?"today":"next10";
            const counts=visitCount(visits.data?.[period],kind);
            return <button key={kind} type="button"
              onClick={()=>setVisitList({period,kind})}
              className={`flex w-full items-center justify-between rounded-md border px-4 py-3 text-left text-sm transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-marsala-600 ${themes[group.theme]}`}>
              <span className="flex items-center gap-3"><CalendarCheck2 size={16}/>{labels[kind]}</span>
              <span className="text-right">
                <strong className="tabular-nums">{visits.isPending?"…":visits.isError?"—":counts.total}</strong>
                {period!=="overdue"&&visits.isSuccess&&counts.total>0&&
                  <span className="block text-[10px] opacity-80">{counts.confirmed} confirmado(s)</span>}
              </span>
            </button>;
          })}
          {visits.isError&&<p role="alert" className="text-xs text-red-700">
            Não foi possível consultar os compromissos. Atualize para tentar novamente.
          </p>}
        </CardContent></Card>)}
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {results.map(({title,period})=>{
        const value=periodValue(period);
        return <Card key={period} className="shadow-sm"><CardHeader className="pb-2">
          <CardTitle className="text-sm">{title}</CardTitle></CardHeader><CardContent className="space-y-3">
          {[
            ["Total de pedidos",value?moneyBRL(value.totalOrders):"—",ReceiptText],
            ["Total recebido",value?moneyBRL(value.received):"—",HandCoins],
            ["Número de pedidos",value?String(value.orderCount):"—",CalendarDays],
          ].map(([label,val,Icon])=><div key={String(label)} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-3">
              <span className="rounded bg-teal-50 p-2 text-teal-600"><Icon size={16}/></span>{String(label)}
            </span>
            <strong className="rounded bg-slate-50 px-2 py-1 tabular-nums">{String(val)}</strong>
          </div>)}
          {!moneyReady&&<p className="text-xs text-muted-foreground">
            {finance.canRead?"Dados financeiros indisponíveis no momento.":"Valores financeiros restritos ao seu perfil."}
          </p>}
        </CardContent></Card>;
      })}
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card className="shadow-sm"><CardHeader><CardTitle className="text-sm">Contas a pagar</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-semibold">{moneyReady?moneyBRL(payableBalance(finance.data!)):"—"}</p>
          <p className="mt-1 text-xs text-muted-foreground">Despesas ainda não quitadas</p>
          <Link to="/financial" className="mt-3 block text-sm text-blue-700 underline">Abrir financeiro</Link></CardContent></Card>
      <Card className="shadow-sm"><CardHeader><CardTitle className="text-sm">Contas a receber</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-semibold">{moneyReady?moneyBRL(receivableBalance(data,finance.data!)):"—"}</p>
          <p className="mt-1 text-xs text-muted-foreground">Saldo dos contratos e recebíveis manuais, sem contar em dobro</p>
          <Link to="/financial" className="mt-3 block text-sm text-blue-700 underline">Ver valores pendentes</Link></CardContent></Card>
      <Card className="shadow-sm"><CardHeader><CardTitle className="text-sm">Agenda do dia</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {todayAgenda.length===0 && pendingAppointments.length===0&&
            <p className="text-xs text-muted-foreground">Nenhum compromisso marcado para hoje.</p>}
          {todayAgenda.slice(0,6).map(a=><div className="text-xs" key={a.id}>
            <span className="font-medium">{new Date(a.start_at).toLocaleTimeString("pt-BR",{timeZone:"America/Sao_Paulo",hour:"2-digit",minute:"2-digit"})}</span>
            {" "}· {a.title} · {customers.get(a.client_id??"")??"Cliente não disponível"}
          </div>)}
          {pendingAppointments.filter(o=>o.source==="locacao").slice(0,5).map(o=>
            <div key={o.id} className="text-xs">{labels[o.kind]} · {products.get(o.productId??"")??"Traje"} · {customers.get(o.clientId??"")??"Cliente"}</div>)}
          <Link to="/calendar" className="mt-3 block text-sm text-blue-700 underline">Abrir agenda</Link>
        </CardContent></Card>
    </div>
    <DashboardVisitConfirmationDialog selected={visitList} onClose={()=>setVisitList(null)}/>
    <p className="text-xs text-muted-foreground">
      As listas de confirmação agrupam contratos por cliente, dia e tipo de atendimento.
      A presença registrada é independente da retirada ou devolução física dos trajes.
      Os totais de pedidos usam o valor dos contratos criados no período; o recebido usa
      a data do registro de pagamento. Não representam fechamento de caixa nem conciliação bancária.
    </p>
  </div>;
}
