import { supabase } from "@/integrations/supabase/client";
export type VisitKind = "Prova"|"Retirada"|"Devolução"|"Atendimento"|"Evento";
export interface CalendarVisit {
 id:string;contract_id:string|null;contract_number:number|null;
 client_name:string;kind:VisitKind;day:string;time:string|null;
 status:string;source:string;description:string|null;
}
export interface CalendarMonth { events:CalendarVisit[];start:string;end:string; }
export interface SlotAvailability {
 kind:string;day:string;time:string;occupied:number;capacity:number;
 available:boolean;reason:string|null;duration_minutes:number;
}
const db=supabase as any;
const iso=/^\d{4}-\d{2}-\d{2}$/;
const clock=/^([01]\d|2[0-3]):[0-5]\d$/;
export function dateKey(d:Date):string {
 return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}
export function dateText(value:string):string {
 const [y,m,d]=value.split("-");
 return `${d}/${m}/${y}`;
}
export function monthRange(year:number,month:number):{from:string;to:string}{
 return {from:dateKey(new Date(year,month,1)),to:dateKey(new Date(year,month+1,0))};
}
export function countCalendarDay(visits:readonly CalendarVisit[],day:string){
 const subset=visits.filter(v=>v.day===day);
 return {fittings:subset.filter(v=>v.kind==="Prova").length,
  pickups:subset.filter(v=>v.kind==="Retirada").length,
  returns:subset.filter(v=>v.kind==="Devolução").length,
  other:subset.filter(v=>!["Prova","Retirada","Devolução"].includes(v.kind)).length,
  total:subset.length};
}
export async function fetchCalendarMonth(from:string,to:string):Promise<CalendarMonth>{
 if(!iso.test(from)||!iso.test(to))throw new Error("Datas do calendário inválidas");
 const {data,error}=await db.rpc("closet_calendar_month",{p_start:from,p_end:to});
 if(error)throw new Error(error.message);
 if(!data||!Array.isArray(data.events))throw new Error("Supabase não confirmou a agenda.");
 return data as CalendarMonth;
}
export async function getVisitSlot(kind:"Prova"|"Retirada",day:string,time:string):Promise<SlotAvailability>{
 if(!iso.test(day)||!clock.test(time))throw new Error("Informe data e horário válidos.");
 const {data,error}=await db.rpc("closet_visit_slot_capacity",{
  p_kind:kind,p_day:day,p_time:time,
 });
 if(error)throw new Error(error.message);
 if(!data||typeof data.available!=="boolean"||
   !Number.isFinite(Number(data.occupied))||!Number.isFinite(Number(data.capacity)))
  throw new Error("Não foi possível validar a capacidade deste horário.");
 return data as SlotAvailability;
}
export async function scheduleContractVisit(contractId:string,kind:"Prova"|"Retirada",day:string,time:string){
 if(!contractId||!iso.test(day)||!clock.test(time))throw new Error("Informe dia e horário válidos.");
 const {data,error}=await db.rpc("closet_schedule_contract_visit",{
  p_contract_id:contractId,p_kind:kind,p_day:day,p_time:time,
 });
 if(error)throw new Error(error.message);
 if(!data?.id||data.status!=="scheduled")throw new Error("Banco não confirmou o agendamento.");
 return data;
}
