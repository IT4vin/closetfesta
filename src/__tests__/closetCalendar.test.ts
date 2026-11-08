import {beforeEach,describe,expect,it,vi} from "vitest";
const {rpc}=vi.hoisted(()=>({rpc:vi.fn()}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{rpc}}));
import {dateKey,monthRange,countCalendarDay,fetchCalendarMonth,getVisitSlot,scheduleContractVisit,type CalendarVisit} from "@/lib/closetCalendar";
const event=(kind:CalendarVisit["kind"],day:string,time:string|null=null,contract="c1"):CalendarVisit=>({
 id:kind+day+String(time),contract_id:contract,contract_number:8,
 client_name:"Cliente Teste",kind,day,time,status:time?"scheduled":"unscheduled",
 source:time?"appointment":"contract_date",description:null,
});
describe("calendário operacional unificado",()=>{
 beforeEach(()=>rpc.mockReset());
 it("gera meses corretos mesmo em fevereiro bissexto",()=>{
  expect(monthRange(2028,1)).toEqual({from:"2028-02-01",to:"2028-02-29"});
  expect(monthRange(2026,10)).toEqual({from:"2026-11-01",to:"2026-11-30"});
  expect(dateKey(new Date(2026,10,8))).toBe("2026-11-08");
 });
 it("conta provas retiradas devoluções e mantém clientes de cada dia",()=>{
  const e=[event("Prova","2026-11-08","11:00"),event("Retirada","2026-11-08"),
   event("Devolução","2026-11-08"),event("Prova","2026-11-09"),event("Atendimento","2026-11-08")];
  expect(countCalendarDay(e,"2026-11-08")).toEqual({
   fittings:1,pickups:1,returns:1,other:1,total:4,
  });
  expect(countCalendarDay(e,"2026-11-10").total).toBe(0);
 });
 it("consulta eventos reais em um intervalo do mês",async()=>{
  rpc.mockResolvedValueOnce({data:{events:[event("Prova","2026-11-08")],start:"2026-11-01",end:"2026-11-30"},error:null});
  const result=await fetchCalendarMonth("2026-11-01","2026-11-30");
  expect(result.events).toHaveLength(1);
  expect(rpc).toHaveBeenCalledWith("closet_calendar_month",{
   p_start:"2026-11-01",p_end:"2026-11-30",
  });
 });
 it("consulta capacidade por tipo, dia e horário e identifica lotação",async()=>{
  rpc.mockResolvedValueOnce({data:{kind:"Prova",day:"2026-11-08",time:"11:00",
   occupied:3,capacity:3,available:false,reason:"Limite atingido",duration_minutes:30},error:null});
  const slot=await getVisitSlot("Prova","2026-11-08","11:00");
  expect(slot.available).toBe(false);
  expect(slot.occupied).toBe(3);
  expect(rpc).toHaveBeenCalledWith("closet_visit_slot_capacity",{
   p_kind:"Prova",p_day:"2026-11-08",p_time:"11:00",
  });
 });
 it("salva agendamento de contrato pelo RPC e propaga erros",async()=>{
  rpc.mockResolvedValueOnce({data:{id:"a1",status:"scheduled"},error:null});
  expect((await scheduleContractVisit("contract-1","Retirada","2026-11-08","11:30")).id).toBe("a1");
  expect(rpc).toHaveBeenCalledWith("closet_schedule_contract_visit",{
   p_contract_id:"contract-1",p_kind:"Retirada",p_day:"2026-11-08",p_time:"11:30",
  });
  rpc.mockResolvedValueOnce({data:null,error:{message:"Limite atingido"}});
  await expect(scheduleContractVisit("contract-1","Retirada","2026-11-08","11:30")).rejects.toThrow("Limite atingido");
 });
 it("bloqueia consultas inválidas ou banco sem resposta confirmada",async()=>{
  await expect(getVisitSlot("Retirada","2026-11-08","99:00")).rejects.toThrow("válidos");
  rpc.mockResolvedValueOnce({data:{},error:null});
  await expect(fetchCalendarMonth("2026-11-01","2026-11-30")).rejects.toThrow("não confirmou");
 });
});
