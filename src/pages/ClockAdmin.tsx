import React,{useEffect,useMemo,useState} from "react";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import {CalendarClock,ClipboardCheck,FileDown,FileText,History,
  PencilLine,Printer,QrCode,Save,ShieldAlert,Users} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {Card,CardContent,CardHeader,CardTitle} from "@/components/ui/card";
import {Tabs,TabsContent,TabsList,TabsTrigger} from "@/components/ui/tabs";
import {useAuth} from "@/stores/authStore";
import ClockQrAdmin from "@/components/time-clock/ClockQrAdmin";
import {adjustClockPoint,clockAdminRecords,clockAudit,clockDateTime,
 clockEmployees,clockKindLabels,clockReport,dateAtStore,dateLabel,
 minutesToClock,monthBounds,saveClockSchedule,workedHours,
 type ClockAdminRow,type ClockKind,type ClockReport} from "@/lib/timeClock";

const weekdays=[
 {id:0,label:"Dom"},{id:1,label:"Seg"},{id:2,label:"Ter"},
 {id:3,label:"Qua"},{id:4,label:"Qui"},{id:5,label:"Sex"},{id:6,label:"Sáb"},
];
const inputClass="h-10 w-full rounded-md border bg-background px-3 text-sm";
function storeLocalInput(iso:string){
 const parts=new Intl.DateTimeFormat("sv-SE",{
  timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",
  day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23",
 }).format(new Date(iso));
 return parts.replace(" ","T");
}
const currentMonth=dateAtStore().slice(0,7);
function ClockReportPrintable({reports,month}:{
 reports:ClockReport[];month:string;
}){
 return <div id="clock-print-report" className="clock-print-report rounded-xl border bg-white p-4">
  <h3 className="text-base font-bold">Closet Festa · Relatório mensal de ponto</h3>
  <p className="mt-1 text-xs text-muted-foreground">Mês: {month} · Apuração interna (não é espelho REP-P certificado)</p>
  <div className="mt-4 overflow-x-auto">
   <table className="w-full min-w-[680px] text-left text-xs">
    <thead><tr className="border-b bg-marsala-50">
     <th className="p-2">Funcionário</th><th className="p-2">Dias</th>
     <th className="p-2">Trabalhadas</th><th className="p-2">Extras</th>
     <th className="p-2">Atrasos</th><th className="p-2">Saldo</th>
     <th className="p-2">Incompletos</th>
    </tr></thead>
    <tbody>{reports.map(r=><tr className="border-b" key={r.user_id}>
     <td className="p-2 font-medium">{r.name}</td>
     <td className="p-2">{r.totals.recorded_days}</td>
     <td className="p-2">{workedHours(r.totals.worked_minutes)}</td>
     <td className="p-2">{workedHours(r.totals.extra_minutes)}</td>
     <td className="p-2">{workedHours(r.totals.late_minutes)}</td>
     <td className="p-2">{minutesToClock(r.totals.balance_minutes)}</td>
     <td className="p-2">{r.totals.incomplete_days}</td>
    </tr>)}</tbody>
   </table>
  </div>
  {reports.length===1&&<div className="mt-4">
   <h4 className="mb-2 text-sm font-semibold">Marcações por dia</h4>
   <table className="w-full text-left text-xs">
    <thead><tr className="border-b"><th>Data</th><th>Entrada</th><th>Almoço</th><th>Retorno</th><th>Saída</th><th>Horas</th></tr></thead>
    <tbody>{reports[0].days.map(day=><tr className="border-b" key={day.work_date}>
     <td className="py-2">{dateLabel(day.work_date)}</td>
     {(["entry","lunch_out","lunch_in","exit"] as ClockKind[]).map(k=>
       <td key={k}>{day.punches.find(p=>p.kind===k)
        ?clockDateTime(day.punches.find(p=>p.kind===k)!.effective_at).split(", ").slice(-1)[0]
        :"—"}</td>)}
     <td>{workedHours(day.minutes)}</td>
    </tr>)}</tbody>
   </table>
  </div>}
  <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
   O saldo depende da escala configurada e só considera jornadas fechadas.
   Dias sem registros não representam automaticamente faltas; feriados e afastamentos
   não são descontados por esta apuração.
  </p>
 </div>;
}

export default function ClockAdminPage(){
 const {user}=useAuth();
 const manager=user?.role?.id==="admin"||user?.role?.id==="manager";
 const cache=useQueryClient();
 const [tab,setTab]=useState("records");
 const [employee,setEmployee]=useState("");
 const [month,setMonth]=useState(currentMonth);
 const [from,setFrom]=useState(monthBounds(currentMonth).from);
 const [to,setTo]=useState(monthBounds(currentMonth).to);
 const [page,setPage]=useState(0);
 const [mode,setMode]=useState<"correct"|"missing"|null>(null);
 const [selected,setSelected]=useState<ClockAdminRow|null>(null);
 const [editEmployee,setEditEmployee]=useState("");
 const [editDay,setEditDay]=useState(dateAtStore());
 const [editKind,setEditKind]=useState<ClockKind>("entry");
 const [editTime,setEditTime]=useState("");
 const [reason,setReason]=useState("");
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [busy,setBusy]=useState(false);
 const [scheduleUser,setScheduleUser]=useState("");
 const [startTime,setStartTime]=useState("");
 const [expectedHours,setExpectedHours]=useState("");
 const [weekdaysSelected,setWeekdaysSelected]=useState<number[]>([]);
 const [grace,setGrace]=useState("0");
 const [scheduleReason,setScheduleReason]=useState("");
 const bounds=monthBounds(month);
 const people=useQuery({queryKey:["time-clock-admin","users"],enabled:manager,
   queryFn:clockEmployees,staleTime:30000});
 const records=useQuery({
  queryKey:["time-clock-admin","records",employee,from,to,page],
  queryFn:()=>clockAdminRecords({employeeId:employee||undefined,from,to,
    limit:50,offset:page*50}),
  enabled:manager&&tab==="records",staleTime:0,
 });
 const audits=useQuery({
  queryKey:["time-clock-admin","audit",employee,from,to],
  queryFn:()=>clockAudit(from,to,employee),
  enabled:manager&&tab==="records"&&Boolean(employee),
 });
 const monthly=useQuery({
  queryKey:["time-clock-admin","monthly",month,employee,people.data?.map(p=>p.id).join(",")],
  queryFn:async()=>{
    const ids=employee?[employee]:(people.data||[]).map(p=>p.id);
    return Promise.all(ids.map(id=>clockReport(bounds.from,bounds.to,id)));
  },
  enabled:manager&&tab==="reports"&&people.isSuccess,staleTime:0,
 });
 const schedule=useQuery({
  queryKey:["time-clock-admin","schedule",scheduleUser,month],
  queryFn:()=>clockReport(bounds.from,bounds.to,scheduleUser),
  enabled:manager&&tab==="reports"&&Boolean(scheduleUser),
 });
 useEffect(()=>{
  const s=schedule.data?.schedule;
  setStartTime(s?.start_time?.slice(0,5)||"");
  setExpectedHours(s?String(s.expected_minutes/60):"");
  setWeekdaysSelected(s?.weekdays||[]);
  setGrace(String(s?.grace_minutes??0));
  setScheduleReason("");
 },[schedule.data,scheduleUser]);
 const currentReports=monthly.data??[];
 const totalHours=useMemo(()=>currentReports.reduce((t,r)=>t+r.totals.worked_minutes,0),[currentReports]);
 const clearMessages=()=>{setError("");setNotice("");};
 const invalidate=async()=>{
  await Promise.all([
   cache.invalidateQueries({queryKey:["time-clock-state"]}),
   cache.invalidateQueries({queryKey:["time-clock-report"]}),
   cache.invalidateQueries({queryKey:["time-clock-audit"]}),
   cache.invalidateQueries({queryKey:["time-clock-admin"]}),
  ]);
 };
 const openCorrection=(row:ClockAdminRow)=>{
  setSelected(row);setMode("correct");setEditEmployee(row.user_id);
  setEditDay(row.work_date);setEditKind(row.kind);
  setEditTime(storeLocalInput(row.effective_at));setReason("");clearMessages();
 };
 const openMissing=()=>{
  setSelected(null);setMode("missing");setEditEmployee(employee||"");
  setEditDay(dateAtStore());setEditKind("entry");
  setEditTime("");setReason("");clearMessages();
 };
 const submitEdit=async(e:React.FormEvent)=>{
  e.preventDefault();
  if(!manager||busy||!mode)return;
  if(!editTime||!reason.trim()||reason.trim().length<10){
   setError("Informe o horário e uma justificativa de pelo menos 10 caracteres.");return;
  }
  if(!window.confirm("Confirmar ajuste de marcação? A alteração será auditada e o horário original preservado."))return;
  setBusy(true);clearMessages();
  try{
   // DateTime-local representa hora da loja, não o fuso do dispositivo.
   const timestamp=new Date(editTime+"-03:00").toISOString();
   await adjustClockPoint({
    punchId:mode==="correct"?selected?.id:undefined,
    userId:mode==="missing"?editEmployee:undefined,
    day:mode==="missing"?editDay:undefined,
    kind:mode==="missing"?editKind:undefined,
    effectiveAt:timestamp,reason,
   });
   setMode(null);setSelected(null);
   setNotice("Correção salva com responsável, motivo e horário original preservados.");
   await invalidate();
  }catch(cause){setError(cause instanceof Error?cause.message:"Correção não confirmada.");}
  finally{setBusy(false);}
 };
 const saveSchedule=async(e:React.FormEvent)=>{
  e.preventDefault();
  if(!scheduleUser||busy)return;
  const minutes=Math.round(Number(expectedHours)*60);
  if(!startTime||!Number.isFinite(minutes)||minutes<60||
    weekdaysSelected.length===0||scheduleReason.trim().length<10){
    setError("Configure início, duração, dias e motivo com pelo menos 10 caracteres.");return;
  }
  if(!window.confirm("Salvar a jornada para o funcionário selecionado? Os saldos são recalculados com esta configuração."))return;
  setBusy(true);clearMessages();
  try{
   await saveClockSchedule({userId:scheduleUser,startTime,expectedMinutes:minutes,
    weekdays:weekdaysSelected,graceMinutes:Number(grace),reason:scheduleReason});
   setNotice("Jornada e justificativa salvas com histórico de alterações.");
   await invalidate();
  }catch(cause){setError(cause instanceof Error?cause.message:"Não foi possível salvar jornada.");}
  finally{setBusy(false);}
 };
 const exportExcel=async()=>{
  if(!currentReports.length)return;
  clearMessages();
  try{
   const XLSX=await import("xlsx");
   const workbook=XLSX.utils.book_new();
   const summary=currentReports.map(r=>({
    Funcionário:r.name,Mês:month,"Dias com ponto":r.totals.recorded_days,
    "Minutos trabalhados":r.totals.worked_minutes,
    "Minutos extras":r.totals.extra_minutes,
    "Minutos atraso":r.totals.late_minutes,
    "Saldo (min)":r.totals.balance_minutes,
    "Jornadas incompletas":r.totals.incomplete_days,
   }));
   const detail=currentReports.flatMap(r=>r.days.map(day=>({
    Funcionário:r.name,Data:day.work_date,
    Entrada:day.punches.find(p=>p.kind==="entry")?.effective_at||"",
    "Saída almoço":day.punches.find(p=>p.kind==="lunch_out")?.effective_at||"",
    "Retorno almoço":day.punches.find(p=>p.kind==="lunch_in")?.effective_at||"",
    "Saída final":day.punches.find(p=>p.kind==="exit")?.effective_at||"",
    "Horas (min)":day.minutes,"Extras (min)":day.extra_minutes,
    "Atrasos (min)":day.late_minutes,"Saldo (min)":day.balance_minutes,
    "Jornada completa":day.complete?"Sim":"Não",
   })));
   XLSX.utils.book_append_sheet(workbook,XLSX.utils.json_to_sheet(summary),"Resumo");
   XLSX.utils.book_append_sheet(workbook,XLSX.utils.json_to_sheet(detail.length?detail:[{Aviso:"Sem marcações no mês"}]),"Marcações");
   XLSX.writeFile(workbook,`ponto-closet-festa-${month}.xlsx`);
  }catch(cause){setError(cause instanceof Error?cause.message:"Falha ao exportar Excel.");}
 };
 if(!manager)return <p role="alert" className="rounded-lg border p-5 text-sm">
  Acesso à administração do ponto restrito à gerência.
 </p>;
 return <div className="space-y-5 pb-10">
  <header className="rounded-2xl border border-marsala-100 bg-gradient-to-r from-marsala-50 to-white p-5">
   <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-marsala-800">
    <ShieldAlert className="h-4 w-4"/>Acesso administrativo
   </p>
   <h1 className="mt-2 text-2xl font-bold text-marsala-950">Controle de Ponto · Administração</h1>
   <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
    Conferência de marcações, jornadas, correções auditadas e relatórios mensais.
    Todas as consultas utilizam os usuários e perfis já cadastrados no sistema.
   </p>
  </header>
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">
   Este módulo é um controle gerencial interno. Não foi certificado como REP-P nem
   gera AFD/AEJ ou comprovantes com assinatura digital exigidos para uso trabalhista oficial.
   Consulte a legislação e um especialista antes de substituir seu registrador legal de ponto.
  </div>
  <Tabs value={tab} onValueChange={value=>{setTab(value);clearMessages();}} className="space-y-4">
   <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-marsala-50 p-2">
    <TabsTrigger value="records" className="gap-2"><ClipboardCheck className="h-4 w-4"/>Marcações</TabsTrigger>
    <TabsTrigger value="reports" className="gap-2"><CalendarClock className="h-4 w-4"/>Banco de horas e relatórios</TabsTrigger>
    <TabsTrigger value="qr" className="gap-2"><QrCode className="h-4 w-4"/>QR Code da loja</TabsTrigger>
   </TabsList>
   {error&&<div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
   {notice&&<div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
   <TabsContent value="qr"><ClockQrAdmin/></TabsContent>
   <TabsContent value="records" className="space-y-4">
    <Card className="shadow-sm"><CardHeader><CardTitle className="text-base">Consultar registros dos funcionários</CardTitle></CardHeader>
     <CardContent className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
       <label className="space-y-1 text-xs">Funcionário
        <select aria-label="Filtrar funcionário" className={inputClass} value={employee}
          onChange={e=>{setEmployee(e.target.value);setPage(0);}}>
         <option value="">Todos os funcionários</option>
         {people.data?.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}
        </select>
       </label>
       <label className="space-y-1 text-xs">Data inicial
        <Input type="date" value={from} onChange={e=>{setFrom(e.target.value);setPage(0);}}/>
       </label>
       <label className="space-y-1 text-xs">Data final
        <Input type="date" value={to} onChange={e=>{setTo(e.target.value);setPage(0);}}/>
       </label>
       <div className="flex items-end">
        <Button className="w-full bg-marsala hover:bg-marsala-700" onClick={openMissing}>
         <PencilLine className="mr-2 h-4 w-4"/>Inserir marcação ausente
        </Button>
       </div>
      </div>
      {records.isPending&&<p className="text-sm text-muted-foreground">Consultando marcações...</p>}
      {records.isError&&<p role="alert" className="text-sm text-red-700">
       {records.error instanceof Error?records.error.message:"Erro de consulta."}</p>}
      {records.data&&<>
       <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-xs">
         <thead><tr className="border-b bg-marsala-50">
          <th className="p-3">Funcionário</th><th className="p-3">Data</th>
          <th className="p-3">Marcação</th><th className="p-3">Hora</th>
          <th className="p-3">Origem</th><th className="p-3">Histórico</th>
          <th className="p-3">Ação</th>
         </tr></thead>
         <tbody>{records.data.rows.map(row=><tr className="border-b" key={row.id}>
          <td className="p-3 font-medium">{row.name}</td>
          <td className="p-3">{dateLabel(row.work_date)}</td>
          <td className="p-3">{clockKindLabels[row.kind]}</td>
          <td className="p-3 tabular-nums">{clockDateTime(row.effective_at)}</td>
          <td className="p-3">{row.source==="qr"?"QR Code":"Gerência"}</td>
          <td className="p-3">{row.corrected?`${row.correction_count} alteração(ões)`:"Original"}</td>
          <td className="p-3">
           <Button size="sm" variant="outline" onClick={()=>openCorrection(row)}>
            <PencilLine className="mr-1 h-3.5 w-3.5"/>Corrigir
           </Button>
          </td>
         </tr>)}</tbody>
        </table>
       </div>
       {records.data.total===0&&<p className="py-6 text-center text-xs text-muted-foreground">Nenhum registro neste período.</p>}
       <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Total de registros: {records.data.total} · Página {page+1}</p>
        <div className="flex gap-2">
         <Button variant="outline" size="sm" disabled={page===0} onClick={()=>setPage(Math.max(0,page-1))}>Anterior</Button>
         <Button variant="outline" size="sm"
          disabled={(page+1)*50>=records.data.total} onClick={()=>setPage(page+1)}>Próxima</Button>
        </div>
       </div>
      </>}
     </CardContent>
    </Card>
    {mode&&<Card className="border-marsala-200 shadow-sm">
     <CardHeader><CardTitle className="text-base">
      {mode==="correct"?"Corrigir horário existente":"Inserir marcação esquecida"}
     </CardTitle></CardHeader>
     <CardContent>
      <form onSubmit={e=>void submitEdit(e)} className="space-y-3">
       {mode==="correct"&&selected&&<p className="text-sm">
        {selected.name} · {clockKindLabels[selected.kind]} · Horário original preservado: {clockDateTime(selected.recorded_at)}
       </p>}
       {mode==="missing"&&<div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1 text-xs">Funcionário
         <select className={inputClass} value={editEmployee} onChange={e=>setEditEmployee(e.target.value)} required>
          <option value="">Selecione</option>
          {people.data?.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
         </select>
        </label>
        <label className="space-y-1 text-xs">Data da jornada
         <Input type="date" value={editDay} onChange={e=>setEditDay(e.target.value)} required/>
        </label>
        <label className="space-y-1 text-xs">Tipo de registro
         <select className={inputClass} value={editKind} onChange={e=>setEditKind(e.target.value as ClockKind)}>
          {Object.entries(clockKindLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}
         </select>
        </label>
       </div>}
       <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs">Data e horário corretos (horário da loja)
         <Input type="datetime-local" value={editTime} onChange={e=>setEditTime(e.target.value)} required/>
        </label>
        <label className="space-y-1 text-xs">Justificativa obrigatória
         <Textarea value={reason} onChange={e=>setReason(e.target.value)}
           minLength={10} maxLength={1000} required
           placeholder="Por que é necessário este ajuste?"/>
        </label>
       </div>
       <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={()=>setMode(null)} disabled={busy}>Cancelar</Button>
        <Button disabled={busy} className="bg-marsala hover:bg-marsala-700" type="submit">
         <Save className="mr-2 h-4 w-4"/>{busy?"Salvando...":"Salvar ajuste auditado"}
        </Button>
       </div>
      </form>
     </CardContent>
    </Card>}
    {employee&&<Card className="shadow-sm">
     <CardHeader><CardTitle className="flex items-center gap-2 text-base">
      <History className="h-4 w-4"/>Histórico de correções do funcionário
     </CardTitle></CardHeader>
     <CardContent className="space-y-2">
      {audits.isPending&&<p className="text-sm text-muted-foreground">Consultando auditoria...</p>}
      {audits.isError&&<p className="text-sm text-red-700">Não foi possível carregar a auditoria.</p>}
      {audits.data?.length===0&&<p className="text-sm text-muted-foreground">Sem correções neste período.</p>}
      {audits.data?.map(a=><div key={a.id} className="rounded-lg border p-3 text-xs">
       <p className="font-semibold">{dateLabel(a.work_date)} · {clockKindLabels[a.kind]}</p>
       <p>{a.action==="insert_missing"?"Inclusão justificada":"Correção de horário"} · {a.reason}</p>
       <p className="text-muted-foreground">Responsável: {a.changed_by_name} · {clockDateTime(a.changed_at)}</p>
      </div>)}
     </CardContent>
    </Card>}
   </TabsContent>
   <TabsContent value="reports" className="space-y-4">
    <Card className="shadow-sm"><CardHeader><CardTitle className="text-base">
      Relatório mensal e banco de horas
     </CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
       <label className="space-y-1 text-xs">Mês
        <Input type="month" value={month} onChange={e=>setMonth(e.target.value)}/>
       </label>
       <label className="space-y-1 text-xs">Funcionário
        <select className={inputClass} value={employee}
          onChange={e=>setEmployee(e.target.value)}>
         <option value="">Todos</option>
         {people.data?.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
       </label>
       <div className="flex flex-wrap items-end gap-2">
        <Button variant="outline" disabled={!monthly.data?.length}
          onClick={()=>void exportExcel()}><FileDown className="mr-2 h-4 w-4"/>Excel</Button>
        <Button variant="outline" disabled={!monthly.data?.length}
          onClick={()=>window.print()}><FileText className="mr-2 h-4 w-4"/>PDF / Imprimir</Button>
       </div>
      </div>
      {monthly.isPending&&<p role="status" className="text-sm">Calculando banco de horas...</p>}
      {monthly.isError&&<p role="alert" className="text-sm text-red-700">
       {monthly.error instanceof Error?monthly.error.message:"Falha no relatório."}
      </p>}
      {monthly.data&&<>
       <div className="flex flex-wrap gap-3 text-xs">
        <span className="rounded-lg border bg-marsala-50 px-3 py-2">
         {currentReports.length} funcionário(s) · {workedHours(totalHours)} trabalhadas
        </span>
        <span className="rounded-lg border px-3 py-2">
         {currentReports.reduce((t,r)=>t+r.totals.incomplete_days,0)} jornadas incompletas
        </span>
       </div>
       <ClockReportPrintable reports={currentReports} month={month}/>
      </>}
     </CardContent></Card>
    <Card className="shadow-sm"><CardHeader><CardTitle className="text-base">
      Configurar jornada individual
     </CardTitle><p className="text-xs text-muted-foreground">
      A escala é necessária para calcular atrasos, horas extras e saldo.
      Não são atribuídas cargas horárias automáticas aos funcionários.
     </p></CardHeader><CardContent className="space-y-4">
      <label className="block space-y-1 text-sm">Funcionário
       <select className={inputClass} value={scheduleUser} onChange={e=>setScheduleUser(e.target.value)}>
        <option value="">Selecione um funcionário</option>
        {people.data?.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
       </select>
      </label>
      {scheduleUser&&<>
       {schedule.isPending&&<p className="text-sm text-muted-foreground">Carregando jornada...</p>}
       <form onSubmit={e=>void saveSchedule(e)} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
         <label className="space-y-1 text-xs">Início previsto
          <Input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} required/>
         </label>
         <label className="space-y-1 text-xs">Horas esperadas por dia
          <Input type="number" value={expectedHours} min="1" max="14" step="0.25"
           onChange={e=>setExpectedHours(e.target.value)} placeholder="Ex.: 8" required/>
         </label>
         <label className="space-y-1 text-xs">Tolerância em minutos
          <Input type="number" value={grace} min="0" max="60" step="1"
           onChange={e=>setGrace(e.target.value)} required/>
         </label>
        </div>
        <div>
         <p className="mb-2 text-xs font-medium">Dias da jornada</p>
         <div className="flex flex-wrap gap-2">
          {weekdays.map(w=><label key={w.id} className="flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs">
           <input type="checkbox" checked={weekdaysSelected.includes(w.id)}
            onChange={e=>setWeekdaysSelected(curr=>e.target.checked
             ?[...curr,w.id]:curr.filter(v=>v!==w.id))}/>
           {w.label}
          </label>)}
         </div>
        </div>
        <label className="block space-y-1 text-xs">Justificativa da criação/alteração da escala
         <Textarea value={scheduleReason} minLength={10} maxLength={300} required
          onChange={e=>setScheduleReason(e.target.value)}
          placeholder="Ex.: escala contratual definida pela administração"/>
        </label>
        <Button disabled={busy||schedule.isPending} type="submit" className="bg-marsala hover:bg-marsala-700">
         <Save className="mr-2 h-4 w-4"/>{busy?"Salvando...":"Salvar escala"}
        </Button>
       </form>
      </>}
     </CardContent></Card>
    <p className="text-xs leading-relaxed text-muted-foreground">
     A apuração utiliza somente marcações existentes, horário do servidor e escala.
     Não infere faltas, afastamentos ou feriados. O histórico de ajustes permanece auditável.
    </p>
   </TabsContent>
  </Tabs>
  <style>{`@media print {
    body * {visibility:hidden !important;}
    #clock-print-report,#clock-print-report * {visibility:visible !important;}
    #clock-print-report {position:absolute;top:0;left:0;width:100%;
      border:none;box-shadow:none;padding:0;background:white;}
    @page {size:A4 landscape;margin:12mm;}
   }`}</style>
 </div>;
}
