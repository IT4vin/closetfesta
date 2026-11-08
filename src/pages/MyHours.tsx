import React,{useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {CalendarDays,Clock3,History,TrendingDown,TrendingUp,Wallet} from "lucide-react";
import {Card,CardContent,CardHeader,CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {useAuth} from "@/stores/authStore";
import {clockAudit,clockKindLabels,clockReport,clockTime,
  dateAtStore,dateLabel,monthBounds,minutesToClock,workedHours,workWeekBounds} from "@/lib/timeClock";

export default function MyHoursPage(){
 const {user}=useAuth();
 const today=dateAtStore();
 const [month,setMonth]=useState(today.slice(0,7));
 const period=monthBounds(month);
 const week=workWeekBounds(today);
 const report=useQuery({
  queryKey:["time-clock-report","my-month",user?.id,month],
  enabled:Boolean(user?.id),
  queryFn:()=>clockReport(period.from,period.to),
  refetchInterval:60000,staleTime:0,
 });
 const weekly=useQuery({
  queryKey:["time-clock-report","my-week",user?.id,today],
  enabled:Boolean(user?.id),queryFn:()=>clockReport(week.from,week.to),
  refetchInterval:60000,staleTime:0,
 });
 const changes=useQuery({
  queryKey:["time-clock-audit",user?.id,month],
  enabled:Boolean(user?.id),
  queryFn:()=>clockAudit(period.from,period.to),
 });
 const data=report.data;
 const day=data?.days.find(d=>d.work_date===today);
 const cards=[
  {label:"Horas trabalhadas hoje",value:workedHours(day?.minutes??0),icon:Clock3},
  {label:"Total da semana",value:workedHours(weekly.data?.totals.worked_minutes??0),icon:CalendarDays},
  {label:"Total no mês",value:workedHours(data?.totals.worked_minutes??0),icon:Wallet},
  {label:"Horas extras no mês",value:workedHours(data?.totals.extra_minutes),icon:TrendingUp},
  {label:"Atrasos no mês",value:workedHours(data?.totals.late_minutes),icon:TrendingDown},
  {label:"Saldo do banco de horas",value:minutesToClock(data?.totals.balance_minutes),icon:History},
 ];
 return <div className="space-y-5 pb-10">
  <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-marsala-100 bg-gradient-to-r from-marsala-50 to-white p-5 sm:p-6">
   <div>
    <p className="text-xs font-semibold uppercase tracking-widest text-marsala-800">Minhas informações</p>
    <h1 className="mt-1 text-2xl font-bold text-marsala-950">Meu Banco de Horas</h1>
    <p className="mt-1 text-sm text-muted-foreground">
      Histórico individual de {user?.full_name||"seu usuário"}, com os registros do servidor.
    </p>
   </div>
   <label className="space-y-1 text-xs font-medium text-muted-foreground">
    Mês de referência
    <Input aria-label="Mês de referência" type="month" value={month}
      onChange={e=>setMonth(e.target.value)} className="max-w-[190px] bg-white"/>
   </label>
  </header>
  {report.isPending&&<p role="status" className="rounded-lg border p-4 text-sm">Carregando suas horas do Supabase...</p>}
  {report.isError&&<p role="alert" className="rounded-lg border border-red-200 p-4 text-sm text-red-700">
   {report.error instanceof Error?report.error.message:"Não foi possível carregar o banco de horas."}
  </p>}
  {data&&<>
   {!data.schedule&&<div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
    Sua jornada ainda não foi configurada pela administração. Horas extras, atrasos
    e saldo positivo/negativo não serão estimados até a configuração.
   </div>}
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {cards.map(({label,value,icon:Icon})=><Card key={label} className="border-border shadow-sm">
     <CardContent className="flex items-start justify-between gap-3 p-5">
      <div>
       <p className="text-xs text-muted-foreground">{label}</p>
       <p className="mt-2 text-xl font-semibold tabular-nums text-marsala-950">{value}</p>
      </div>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-marsala-50 text-marsala-800">
       <Icon className="h-5 w-5"/>
      </span>
     </CardContent>
    </Card>)}
   </div>
   {data.schedule&&<p className="text-xs text-muted-foreground">
    Escala configurada: início às {data.schedule.start_time.slice(0,5)},
    duração prevista {workedHours(data.schedule.expected_minutes)} e
    tolerância de {data.schedule.grace_minutes}min, conforme os dias definidos pela gerência.
   </p>}
   <Card className="shadow-sm">
    <CardHeader><CardTitle className="text-base">Histórico completo de {month}</CardTitle></CardHeader>
    <CardContent className="space-y-3">
     {data.days.length===0&&<p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">
      Nenhum registro encontrado neste mês.
     </p>}
     {data.days.map(d=><div key={d.work_date} className="rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
       <h3 className="text-sm font-semibold">{dateLabel(d.work_date)}</h3>
       <span className={"rounded-full px-2.5 py-1 text-xs font-medium "+
         (d.complete?"bg-emerald-50 text-emerald-800":"bg-amber-50 text-amber-900")}>
        {d.complete?"Jornada concluída":"Jornada incompleta"}
       </span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
       {d.punches.map(p=><div key={p.id} className="rounded-lg bg-marsala-50 p-2.5">
        <p className="text-[11px] text-muted-foreground">{clockKindLabels[p.kind]}</p>
        <p className="mt-1 font-semibold tabular-nums">{clockTime(p.effective_at)}</p>
        {p.source==="admin"&&<p className="text-[10px] text-muted-foreground">Ajuste gerencial</p>}
       </div>)}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 border-t pt-3 text-xs text-muted-foreground">
       <span>Trabalhadas: <strong className="text-foreground">{workedHours(d.minutes)}</strong></span>
       <span>Extras: <strong className="text-foreground">{workedHours(d.extra_minutes)}</strong></span>
       <span>Atraso: <strong className="text-foreground">{workedHours(d.late_minutes)}</strong></span>
       <span>Saldo: <strong className="text-foreground">{minutesToClock(d.balance_minutes)}</strong></span>
      </div>
     </div>)}
    </CardContent>
   </Card>
   <Card className="shadow-sm">
    <CardHeader><CardTitle className="flex items-center gap-2 text-base">
     <History className="h-4 w-4 text-marsala-800"/>Histórico de correções
    </CardTitle></CardHeader>
    <CardContent className="space-y-2">
     {changes.isPending&&<p className="text-xs text-muted-foreground">Consultando justificativas...</p>}
     {changes.isError&&<p role="alert" className="text-sm text-red-700">Falha ao consultar auditoria.</p>}
     {changes.data?.length===0&&<p className="text-xs text-muted-foreground">
      Nenhum ajuste registrado neste período.
     </p>}
     {changes.data?.map(a=><div key={a.id} className="rounded-lg border p-3 text-xs">
      <p className="font-semibold">{dateLabel(a.work_date)} · {clockKindLabels[a.kind]}</p>
      <p className="mt-1">Justificativa: {a.reason}</p>
      <p className="mt-1 text-muted-foreground">Por {a.changed_by_name} · {clockTime(a.new_at)}</p>
     </div>)}
    </CardContent>
   </Card>
   <p className="text-xs leading-relaxed text-muted-foreground">
    As horas em andamento são estimadas até o último horário do servidor; o saldo,
    atraso e extras só são apurados para jornadas fechadas com escala configurada.
    Dias sem marcação não geram débitos automáticos de falta, feriado ou afastamento.
   </p>
  </>}
 </div>;
}
