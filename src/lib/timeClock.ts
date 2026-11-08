import {supabase} from "@/integrations/supabase/client";

const api=supabase as any;
export type ClockKind="entry"|"lunch_out"|"lunch_in"|"exit";
export const clockKindLabels:Record<ClockKind,string>={
  entry:"Entrada",lunch_out:"Saída para almoço",
  lunch_in:"Retorno do almoço",exit:"Saída final",
};
export type ClockPunch={
 id:string;kind:ClockKind;effective_at:string;recorded_at:string;source:"qr"|"admin";
};
export type ClockState={
 store_name:string;timezone:string;server_time:string;
 today:string;work_date:string;next_kind:ClockKind|null;events:ClockPunch[];
};
export type ClockDay={
 work_date:string;minutes:number;expected_minutes:number|null;
 extra_minutes:number|null;late_minutes:number|null;
 balance_minutes:number|null;complete:boolean;punches:ClockPunch[];
};
export type ClockSchedule={
 start_time:string;expected_minutes:number;weekdays:number[];grace_minutes:number;
};
export type ClockReport={
 user_id:string;name:string;from:string;to:string;server_time:string;timezone:string;
 schedule:ClockSchedule|null;days:ClockDay[];
 totals:{worked_minutes:number;extra_minutes:number|null;late_minutes:number|null;
 balance_minutes:number|null;recorded_days:number;incomplete_days:number;
 days_without_schedule:number};
};
export type ClockEmployee={
 id:string;name:string;email:string|null;role:string;has_schedule:boolean;
};
export type ClockAdminRow=ClockPunch&{
 user_id:string;name:string;work_date:string;corrected:boolean;correction_count:number;
};
export type ClockAdminRecords={rows:ClockAdminRow[];total:number;limit:number;offset:number};
export type ClockAudit={
 id:string;punch_id:string;work_date:string;kind:ClockKind;action:string;
 previous_at:string|null;new_at:string;reason:string;changed_by:string;
 changed_by_name:string;changed_at:string;
};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const dateAtStore=(date:Date=new Date())=>
  new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Sao_Paulo",year:"numeric",
    month:"2-digit",day:"2-digit"}).format(date);
export const dateLabel=(day:string)=>day?.match(/^\d{4}-\d{2}-\d{2}$/)
  ?day.split("-").reverse().join("/"):"—";
export const clockDateTime=(iso:string)=>new Intl.DateTimeFormat("pt-BR",{
  timeZone:"America/Sao_Paulo",day:"2-digit",month:"2-digit",year:"numeric",
  hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false,
}).format(new Date(iso));
export const clockTime=(iso:string)=>new Intl.DateTimeFormat("pt-BR",{
 timeZone:"America/Sao_Paulo",hour:"2-digit",minute:"2-digit",second:"2-digit",
 hour12:false,
}).format(new Date(iso));
export function minutesToClock(value:number|null|undefined):string{
 if(value===null||value===undefined||!Number.isFinite(Number(value)))return "Não apurado";
 const n=Math.round(value),abs=Math.abs(n),sign=n<0?"−":n>0?"+":"";
 return `${sign}${Math.floor(abs/60)}h ${String(abs%60).padStart(2,"0")}min`;
}
export function workedHours(value:number|null|undefined):string{
 if(value===null||value===undefined)return "Não apurado";
 const n=Math.max(0,Math.round(value));
 return `${Math.floor(n/60)}h ${String(n%60).padStart(2,"0")}min`;
}
export function monthBounds(month:string){
 if(!/^\d{4}-\d{2}$/.test(month))throw new Error("Mês inválido");
 const [year,mm]=month.split("-").map(Number);
 if(mm<1||mm>12||year<2000||year>2100)throw new Error("Mês inválido");
 const first=month+"-01";
 const last=`${year}-${String(mm).padStart(2,"0")}-${String(new Date(Date.UTC(year,mm,0)).getUTCDate()).padStart(2,"0")}`;
 return {from:first,to:last};
}
export function workWeekBounds(today:string){
 const date=new Date(today+"T12:00:00Z");
 const weekday=date.getUTCDay();
 date.setUTCDate(date.getUTCDate()-((weekday+6)%7));
 return {from:date.toISOString().slice(0,10),to:today};
}
async function rpc<T>(name:string,args:Record<string,unknown>={}):Promise<T>{
 const {data,error}=await api.rpc(name,args);
 if(error)throw new Error(error.message);
 if(data===null||data===undefined)throw new Error("O banco não confirmou a solicitação.");
 return data as T;
}
export const clockState=()=>rpc<ClockState>("time_clock_state");
export const clockAdminQr=()=>rpc<{store_id:string;store_name:string;timezone:string;qr_payload:string}>("time_clock_admin_qr");
export function recordClockPoint(code:string,location?:{latitude:number;longitude:number;accuracy_m:number}){
 if(!/^CF-PONTO:V1:[0-9a-f]{64}$/.test(code))throw new Error("QR Code inválido.");
 return rpc<{id:string;kind:ClockKind;server_time:string;work_date:string;next_kind:ClockKind|null}>(
  "time_clock_record",{p_qr:code,p_location:location??null});
}
export function clockReport(from:string,to:string,userId?:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)
 ||(userId&&!uuid.test(userId)))throw new Error("Período ou usuário inválido");
 return rpc<ClockReport>("time_clock_report",{p_from:from,p_to:to,p_user:userId??null});
}
export const clockEmployees=()=>rpc<ClockEmployee[]>("time_clock_admin_users");
export function clockAdminRecords(args:{
 employeeId?:string;from:string;to:string;limit?:number;offset?:number;
}){
 return rpc<ClockAdminRecords>("time_clock_admin_records",{
  p_user:args.employeeId??null,p_from:args.from,p_to:args.to,
  p_limit:args.limit??50,p_offset:args.offset??0,
 });
}
export function clockAudit(from:string,to:string,userId?:string){
 return rpc<ClockAudit[]>("time_clock_audit_history",{
  p_user:userId??null,p_from:from,p_to:to,p_limit:500,
 });
}
export function saveClockSchedule(args:{
 userId:string;startTime:string;expectedMinutes:number;weekdays:number[];
 graceMinutes:number;reason:string;
}){
 if(!uuid.test(args.userId)||args.reason.trim().length<10)
  throw new Error("Informe o funcionário e a justificativa.");
 return rpc<{user_id:string;saved:boolean}>("time_clock_set_schedule",{
  p_user:args.userId,p_start:args.startTime,p_expected:args.expectedMinutes,
  p_weekdays:args.weekdays,p_grace:args.graceMinutes,p_reason:args.reason.trim(),
 });
}
export function adjustClockPoint(args:{
 punchId?:string;userId?:string;day?:string;kind?:ClockKind;
 effectiveAt:string;reason:string;
}){
 if(args.reason.trim().length<10||!Number.isFinite(Date.parse(args.effectiveAt)))
  throw new Error("Informe horário e justificativa detalhada.");
 return rpc<{id:string;action:string;effective_at:string}>("time_clock_admin_adjust",{
  p_punch:args.punchId??null,p_user:args.userId??null,p_day:args.day??null,
  p_kind:args.kind??null,p_effective_at:args.effectiveAt,
  p_reason:args.reason.trim(),
 });
}
