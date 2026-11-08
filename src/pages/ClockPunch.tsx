import React,{useState} from "react";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import {BadgeCheck,Clock3,MapPin,ScanLine,ShieldCheck,UserRound} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Card,CardContent,CardHeader,CardTitle} from "@/components/ui/card";
import {Checkbox} from "@/components/ui/checkbox";
import {useAuth} from "@/stores/authStore";
import ClockQrScanner from "@/components/time-clock/ClockQrScanner";
import {clockKindLabels,clockState,clockTime,dateLabel,
  recordClockPoint,type ClockKind} from "@/lib/timeClock";

function optionalLocation():Promise<{latitude:number;longitude:number;accuracy_m:number}|undefined>{
 if(!("geolocation" in navigator))return Promise.resolve(undefined);
 return new Promise(resolve=>{
  navigator.geolocation.getCurrentPosition(
   p=>resolve({latitude:p.coords.latitude,longitude:p.coords.longitude,
    accuracy_m:Math.round(p.coords.accuracy)}),
   ()=>resolve(undefined),
   {enableHighAccuracy:false,timeout:5500,maximumAge:60000},
  );
 });
}
export default function ClockPunchPage(){
 const {user}=useAuth();
 const cache=useQueryClient();
 const [scanning,setScanning]=useState(false);
 const [busy,setBusy]=useState(false);
 const [shareLocation,setShareLocation]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState<{kind:ClockKind;server_time:string}|null>(null);
 const state=useQuery({
  queryKey:["time-clock-state",user?.id],
  enabled:Boolean(user?.id),queryFn:clockState,refetchInterval:60000,
  refetchOnWindowFocus:true,staleTime:0,
 });
 const submit=async(code:string)=>{
  if(busy)return;
  setBusy(true);setScanning(false);setError("");setSuccess(null);
  try{
   const location=shareLocation?await optionalLocation():undefined;
   const result=await recordClockPoint(code,location);
   setSuccess({kind:result.kind,server_time:result.server_time});
   await cache.invalidateQueries({queryKey:["time-clock-state"]});
   await cache.invalidateQueries({queryKey:["time-clock-report"]});
   await cache.invalidateQueries({queryKey:["time-clock-admin"]});
  }catch(e){setError(e instanceof Error?e.message:"O servidor não conseguiu confirmar a marcação.");}
  finally{setBusy(false);}
 };
 const next=state.data?.next_kind;
 return <div className="mx-auto max-w-3xl space-y-5 pb-10">
  <header className="rounded-2xl border border-marsala-100 bg-gradient-to-r from-marsala-50 to-white px-5 py-6">
   <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-marsala-800">
    <Clock3 className="h-4 w-4"/>Controle de ponto
   </div>
   <h1 className="mt-2 text-2xl font-bold tracking-tight text-marsala-950">Bater Ponto</h1>
   <p className="mt-2 text-sm text-muted-foreground">
    Seu login identifica a marcação. A hora oficial é registrada pelo servidor da loja.
   </p>
  </header>
  <Card className="border-marsala-100 shadow-sm">
   <CardContent className="space-y-5 p-5 sm:p-7">
    <div className="flex items-center gap-3 rounded-xl bg-marsala-50 p-4">
     <UserRound className="h-5 w-5 shrink-0 text-marsala-800"/>
     <div className="min-w-0">
      <p className="text-xs text-muted-foreground">Funcionário autenticado</p>
      <p className="break-words font-semibold text-marsala-950">{user?.full_name||user?.email||"Carregando usuário..."}</p>
      <p className="text-xs text-muted-foreground">{state.data?.store_name??"Loja principal"}</p>
     </div>
    </div>
    {state.isPending&&<p role="status" className="text-sm text-muted-foreground">Consultando sequência no servidor...</p>}
    {state.isError&&<p role="alert" className="rounded-lg border border-red-200 p-3 text-sm text-red-800">
     {state.error instanceof Error?state.error.message:"Não foi possível consultar seu ponto."}
     <Button variant="outline" size="sm" className="ml-2" onClick={()=>void state.refetch()}>Tentar novamente</Button>
    </p>}
    {state.data&&<div className="rounded-2xl border border-[#E8E5E1] bg-[#FDFCFB] p-5 text-center">
     <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {dateLabel(state.data.work_date)} · Próximo registro
     </p>
     <h2 className="mt-2 text-2xl font-bold text-marsala-950">
      {next?clockKindLabels[next]:"Jornada completa"}
     </h2>
     <p className="mt-2 text-xs text-muted-foreground">
      Horário oficial: {clockTime(state.data.server_time)} · {state.data.timezone}
     </p>
    </div>}
    {success&&<div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
     <BadgeCheck className="mx-auto h-9 w-9 text-emerald-700"/>
     <p className="mt-2 font-bold text-emerald-900">{clockKindLabels[success.kind]} registrada com sucesso!</p>
     <p className="mt-1 text-lg font-semibold text-emerald-900">{clockTime(success.server_time)}</p>
     <p className="mt-1 text-xs text-emerald-800">Horário confirmado pelo servidor e vinculado ao seu login.</p>
    </div>}
    {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
     {error}
    </p>}
    {!scanning&&!busy&&state.isSuccess&&next&&<>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm">
       <Checkbox checked={shareLocation} onCheckedChange={v=>setShareLocation(v===true)}/>
       <span>
        <span className="flex items-center gap-1 font-medium"><MapPin className="h-4 w-4"/>Compartilhar localização aproximada (opcional)</span>
        <span className="mt-1 block text-xs text-muted-foreground">
         O navegador solicitará sua autorização. A recusa não impede o registro.
         A localização informada não é uma prova de presença física.
        </span>
       </span>
      </label>
      <Button type="button" size="lg" className="h-16 w-full bg-marsala text-lg font-semibold hover:bg-marsala-700"
       onClick={()=>{setError("");setSuccess(null);setScanning(true);}}>
       <ScanLine className="mr-3 h-6 w-6"/>Registrar Ponto · {clockKindLabels[next]}
      </Button>
    </>}
    {busy&&<p role="status" className="py-4 text-center text-sm font-medium text-marsala-800">
      Registrando e validando com o servidor...
    </p>}
    <ClockQrScanner enabled={scanning} disabled={busy} onRead={code=>void submit(code)}
      onCancel={()=>setScanning(false)}/>
    <p className="flex items-start gap-2 text-xs text-muted-foreground">
      <ShieldCheck className="h-4 w-4 shrink-0 text-marsala-800"/>
      O mesmo QR da loja vale para toda a equipe; o horário vem do servidor.
      O sistema não coleta nem armazena imagens dos funcionários.
    </p>
   </CardContent>
  </Card>
  <Card className="shadow-sm">
   <CardHeader><CardTitle className="text-base">Registros da jornada</CardTitle></CardHeader>
   <CardContent className="space-y-2">
    {state.data?.events?.length?state.data.events.map(e=><div key={e.id}
      className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
      <span className="font-medium">{clockKindLabels[e.kind]}</span>
      <strong className="tabular-nums text-marsala-900">{clockTime(e.effective_at)}</strong>
    </div>):<p className="text-sm text-muted-foreground">
      Nenhuma marcação registrada na jornada atual.
    </p>}
   </CardContent>
  </Card>
 </div>;
}
