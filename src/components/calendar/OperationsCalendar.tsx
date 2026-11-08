import React,{useMemo,useState} from "react";
import { Link } from "react-router-dom";
import { useQuery,useQueryClient } from "@tanstack/react-query";
import { CalendarDays,ChevronLeft,ChevronRight,Clock3,RefreshCw,Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription } from "@/components/ui/dialog";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import PermissionManager from "@/lib/permissions";
import VisitSlotInput from "@/components/calendar/VisitSlotInput";
import {
 countCalendarDay,dateKey,dateText,fetchCalendarMonth,monthRange,scheduleContractVisit,
 type CalendarVisit,
} from "@/lib/closetCalendar";

const weekdays=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const months=["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
 "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const kinds=[
 {kind:"Prova",label:"Provas",pill:"bg-purple-100 text-purple-900"},
 {kind:"Retirada",label:"Retiradas",pill:"bg-amber-100 text-amber-900"},
 {kind:"Devolução",label:"Devoluções",pill:"bg-emerald-100 text-emerald-900"},
] as const;

export default function OperationsCalendar(){
 const today=useMemo(()=>dateKey(new Date()),[]);
 const [year,setYear]=useState(new Date().getFullYear());
 const [month,setMonth]=useState(new Date().getMonth());
 const [selectedDay,setSelectedDay]=useState(today);
 const [filter,setFilter]=useState("Todos");
 const [editing,setEditing]=useState<CalendarVisit|null>(null);
 const [editTime,setEditTime]=useState("");
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const {toast}=useToast();
 const queryClient=useQueryClient();
 const canWrite=PermissionManager.hasPermission("schedule","create");
 const range=monthRange(year,month);
 const query=useQuery({
  queryKey:["closet-calendar-month",range.from,range.to],
  queryFn:()=>fetchCalendarMonth(range.from,range.to),
  staleTime:0,refetchOnMount:"always",refetchOnWindowFocus:true,refetchInterval:60000,
  retry:1,
 });
 const events=query.data?.events||[];
 const selected=events.filter(v=>v.day===selectedDay&&(filter==="Todos"||v.kind===filter));
 const summary=countCalendarDay(events,selectedDay);
 const monthTotal=events.length;
 const firstWeekday=new Date(year,month,1).getDay();
 const monthLength=new Date(year,month+1,0).getDate();
 const days=Array.from({length:Math.ceil((firstWeekday+monthLength)/7)*7},(_,i)=>{
  const n=i-firstWeekday+1;
  return n>=1&&n<=monthLength?{n,day:dateKey(new Date(year,month,n))}:null;
 });
 const move=(delta:number)=>{
  const next=new Date(year,month+delta,1);
  setYear(next.getFullYear());setMonth(next.getMonth());
  setSelectedDay(dateKey(next));
 };
 const goToday=()=>{
  const d=new Date();setYear(d.getFullYear());setMonth(d.getMonth());setSelectedDay(dateKey(d));
 };
 const chooseDate=(day:string)=>{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return;
  const [y,m]=day.split("-").map(Number);
  setYear(y);setMonth(m-1);setSelectedDay(day);
 };
 const openVisit=(visit:CalendarVisit)=>{
  if(!visit.contract_id||!["Prova","Retirada"].includes(visit.kind)||!canWrite)return;
  setEditing(visit);setEditTime(visit.time||"");setError("");
 };
 const save=async(e:React.FormEvent)=>{
  e.preventDefault();
  if(!editing?.contract_id||!editTime||saving)return;
  setSaving(true);setError("");
  try{
   await scheduleContractVisit(editing.contract_id,editing.kind as "Prova"|"Retirada",
    editing.day,editTime);
   await queryClient.invalidateQueries({queryKey:["closet-calendar-month"]});
   await queryClient.invalidateQueries({queryKey:["closet-live-operations"]});
   toast({title:"Horário confirmado",description:"Agendamento salvo no Supabase e registrado na agenda."});
   setEditing(null);
  }catch(cause){setError(cause instanceof Error?cause.message:"Falha ao agendar horário.");}
  finally{setSaving(false);}
 };
 return <div className="space-y-4">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div>
    <h3 className="flex items-center gap-2 text-xl font-semibold">
     <CalendarDays className="h-5 w-5 text-marsala-800"/>Calendário de atendimentos
    </h3>
    <p className="mt-1 text-sm text-muted-foreground">
     Provas, retiradas e devoluções dos contratos, incluindo datas sem horário definido.
    </p>
   </div>
   <div className="flex flex-wrap gap-2">
    <Button variant="outline" size="sm" onClick={goToday}>Hoje</Button>
    <Button variant="outline" size="sm" onClick={()=>void query.refetch()} disabled={query.isFetching}>
     <RefreshCw className="mr-2 h-4 w-4"/>Atualizar
    </Button>
   </div>
  </div>
  {query.isPending&&<p role="status" className="text-sm text-muted-foreground">Carregando agenda real do Supabase...</p>}
  {query.isError&&<div role="alert" className="rounded-lg border border-red-200 p-4 text-sm text-red-700">
   Erro ao consultar agenda: {query.error instanceof Error?query.error.message:"Indisponível"}
   <Button variant="outline" size="sm" className="ml-3" onClick={()=>void query.refetch()}>Tentar novamente</Button>
  </div>}
  <Card className="overflow-hidden">
   <CardHeader className="border-b pb-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <div>
      <CardTitle className="text-lg text-marsala-800">{months[month]} de {year}</CardTitle>
      <p className="mt-1 text-xs text-muted-foreground">{monthTotal} visita(s) e compromisso(s) no mês</p>
     </div>
     <div className="flex gap-2">
      <Button variant="outline" size="icon" aria-label="Mês anterior" onClick={()=>move(-1)}>
       <ChevronLeft className="h-4 w-4"/>
      </Button>
      <Button variant="outline" size="icon" aria-label="Próximo mês" onClick={()=>move(1)}>
       <ChevronRight className="h-4 w-4"/>
      </Button>
     </div>
    </div>
   </CardHeader>
   <CardContent className="p-2 sm:p-4">
    <div className="grid grid-cols-7 gap-1">
     {weekdays.map(day=><div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground">{day}</div>)}
     {days.map((date,i)=>{
      if(!date)return <div key={"blank-"+i} className="min-h-[85px] rounded-md bg-muted/20 sm:min-h-[105px]"/>;
      const count=countCalendarDay(events,date.day);
      const active=selectedDay===date.day;
      return <button type="button" key={date.day}
       aria-label={dateText(date.day)+": "+count.fittings+" provas, "+count.pickups+" retiradas, "+count.returns+" devoluções"}
       aria-pressed={active} onClick={()=>setSelectedDay(date.day)}
       className={"min-h-[85px] rounded-lg border p-1.5 text-left transition sm:min-h-[105px] sm:p-2 "+
        (active?"border-marsala-600 bg-marsala-50 ring-1 ring-marsala-500":
        date.day===today?"border-marsala-300 bg-background":"border-border hover:border-marsala-300")}>
       <span className={"inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold "+
        (active?"bg-marsala text-white":"text-foreground")}>{date.n}</span>
       <div className="mt-1 space-y-0.5 text-[10px] leading-tight sm:text-xs">
        {count.fittings>0&&<div className="rounded bg-purple-100 px-1 py-0.5 text-purple-900">{count.fittings} prova(s)</div>}
        {count.pickups>0&&<div className="rounded bg-amber-100 px-1 py-0.5 text-amber-900">{count.pickups} retirada(s)</div>}
        {count.returns>0&&<div className="rounded bg-emerald-100 px-1 py-0.5 text-emerald-900">{count.returns} devolução(ões)</div>}
        {count.other>0&&<div className="rounded bg-muted px-1 py-0.5">{count.other} outro(s)</div>}
       </div>
      </button>;
     })}
    </div>
   </CardContent>
  </Card>
  <Card>
   <CardHeader className="border-b pb-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div>
      <CardTitle className="flex items-center gap-2 text-base">
       <Users className="h-4 w-4 text-marsala-800"/>Atendimentos de {dateText(selectedDay)}
      </CardTitle>
      <p className="mt-1 text-xs text-muted-foreground">
       {summary.fittings} prova(s) · {summary.pickups} retirada(s) ·
       {" "}{summary.returns} devolução(ões) · {summary.other} outro(s)
      </p>
     </div>
     <div className="flex flex-wrap gap-2">
      <Input aria-label="Consultar outro dia" type="date" value={selectedDay}
       onChange={e=>chooseDate(e.target.value)} className="h-9 w-[155px] text-xs"/>
      <select aria-label="Filtrar tipo de atendimento" value={filter} onChange={e=>setFilter(e.target.value)}
       className="h-9 rounded-md border border-input bg-background px-2 text-xs">
       <option value="Todos">Todos</option>
       {["Prova","Retirada","Devolução","Atendimento","Evento"].map(k=><option key={k}>{k}</option>)}
      </select>
     </div>
    </div>
   </CardHeader>
   <CardContent className="space-y-3 p-4">
    {query.isSuccess&&selected.length===0&&
      <p className="py-6 text-center text-sm text-muted-foreground">
       Nenhum atendimento desse tipo agendado para o dia selecionado.
      </p>}
    {selected.map(visit=><div key={visit.id}
      className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3">
     <div className="flex min-w-0 flex-1 items-start gap-3">
      <div className={"min-w-[76px] rounded-md px-2 py-2 text-center text-sm font-semibold "+
       (visit.time?"bg-marsala-50 text-marsala-800":"bg-muted text-muted-foreground")}>
       <Clock3 className="mx-auto mb-1 h-4 w-4"/>{visit.time||"A definir"}
      </div>
      <div className="min-w-0 space-y-1">
       <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{visit.client_name}</span>
        <Badge variant="outline" className={
         kinds.find(t=>t.kind===visit.kind)?.pill||""
        }>{visit.kind}</Badge>
       </div>
       {visit.contract_id&&<Link to={"/pdv/pedidos/"+visit.contract_id}
        className="text-xs font-medium text-marsala-800 hover:underline">
        Contrato ALU-{String(visit.contract_number).padStart(6,"0")}
       </Link>}
       {!visit.time&&<p className="text-xs text-amber-800">
        Data definida no contrato, mas horário ainda não marcado.
       </p>}
       {visit.description&&<p className="text-xs text-muted-foreground">{visit.description}</p>}
      </div>
     </div>
     {canWrite&&visit.contract_id&&(visit.kind==="Prova"||visit.kind==="Retirada")&&
       <Button size="sm" variant="outline" className="border-marsala-200 text-marsala-800"
        onClick={()=>openVisit(visit)}>{visit.time?"Remarcar":"Definir horário"}</Button>}
    </div>)}
    {selected.length>0&&<p className="text-xs text-muted-foreground">
     Cada cliente/contrato é contado uma vez por tipo e dia, mesmo com vários trajes.
     Horários não definidos ainda precisam ser confirmados pela equipe.
    </p>}
   </CardContent>
  </Card>
  <Dialog open={Boolean(editing)} onOpenChange={open=>{if(!open&&!saving)setEditing(null);}}>
   <DialogContent className="max-w-md">
    <DialogHeader>
     <DialogTitle>Definir horário de {editing?.kind.toLowerCase()}</DialogTitle>
     <DialogDescription>
      {editing?.client_name} · {editing?.day?dateText(editing.day):""}.
      O limite de vagas será verificado novamente ao salvar.
     </DialogDescription>
    </DialogHeader>
    <form onSubmit={event=>void save(event)} className="space-y-4">
     {editing&&(editing.kind==="Prova"||editing.kind==="Retirada")&&
      <VisitSlotInput id="agenda-visit-time" kind={editing.kind}
       day={editing.day} time={editTime} onChange={setEditTime} disabled={saving}/>}
     {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
     <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" disabled={saving} onClick={()=>setEditing(null)}>Cancelar</Button>
      <Button type="submit" disabled={!editTime||saving} className="bg-marsala hover:bg-marsala-700">
       {saving?"Salvando...":"Confirmar horário"}
      </Button>
     </div>
    </form>
   </DialogContent>
  </Dialog>
 </div>;
}
