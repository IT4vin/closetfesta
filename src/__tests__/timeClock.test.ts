import {beforeEach,describe,expect,it,vi} from "vitest";
const {rpc}=vi.hoisted(()=>({rpc:vi.fn()}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{rpc}}));
import {clockReport,recordClockPoint,clockAdminQr,
 monthBounds,workWeekBounds,minutesToClock,workedHours,clockKindLabels,
 clockAdminRecords,saveClockSchedule,adjustClockPoint} from "@/lib/timeClock";
const uid="11111111-1111-4111-8111-111111111111";
const payload="CF-PONTO:V1:"+"a".repeat(64);
beforeEach(()=>rpc.mockReset());
describe("Ponto: cliente do Supabase",()=>{
 it("registra apenas QR no RPC do servidor sem enviar hora do dispositivo",async()=>{
  rpc.mockResolvedValue({data:{id:"p1",kind:"entry",server_time:"2026-11-08T20:00:00Z"},error:null});
  const res=await recordClockPoint(payload);
  expect(res.kind).toBe("entry");
  expect(rpc).toHaveBeenCalledWith("time_clock_record",{p_qr:payload,p_location:null});
 });
 it("valida formato do QR antes de realizar chamadas",async()=>{
  expect(()=>recordClockPoint("CF-PONTO:V1:invalido")).toThrow("QR Code inválido");
  expect(rpc).not.toHaveBeenCalled();
 });
 it("usa sempre autorização no banco para leitura de QR secreto",async()=>{
  rpc.mockResolvedValue({data:{store_name:"Loja principal",qr_payload:payload},error:null});
  await clockAdminQr();
  expect(rpc).toHaveBeenCalledWith("time_clock_admin_qr",{});
 });
 it("consulta ponto individual, sem permitir falsificação de dados no frontend",async()=>{
  rpc.mockResolvedValue({data:{user_id:uid,days:[]},error:null});
  await clockReport("2026-11-01","2026-11-30");
  expect(rpc).toHaveBeenCalledWith("time_clock_report",{
    p_from:"2026-11-01",p_to:"2026-11-30",p_user:null,
  });
 });
 it("permite filtros e paginação de marcações para servidor validar permissão",async()=>{
  rpc.mockResolvedValue({data:{rows:[],total:0},error:null});
  await clockAdminRecords({employeeId:uid,from:"2026-11-01",to:"2026-11-30",offset:50});
  expect(rpc).toHaveBeenCalledWith("time_clock_admin_records",{
    p_user:uid,p_from:"2026-11-01",p_to:"2026-11-30",p_limit:50,p_offset:50,
  });
 });
 it("envia escala e correção com justificativa explícita ao servidor",async()=>{
  rpc.mockResolvedValue({data:{saved:true},error:null});
  await saveClockSchedule({userId:uid,startTime:"10:00",expectedMinutes:480,
   weekdays:[1,2,3,4,5,6],graceMinutes:5,
   reason:"Escala de trabalho acordada"});
  expect(rpc).toHaveBeenCalledWith("time_clock_set_schedule",expect.objectContaining({
   p_user:uid,p_expected:480,p_weekdays:[1,2,3,4,5,6],p_grace:5,
  }));
  await adjustClockPoint({punchId:uid,effectiveAt:"2026-11-08T13:00:00Z",
   reason:"Falha no registro original"});
  expect(rpc).toHaveBeenCalledWith("time_clock_admin_adjust",expect.objectContaining({
   p_punch:uid,p_reason:"Falha no registro original",
  }));
 });
 it("formata horas e saldos negativos sem estimar escala ausente",()=>{
  expect(minutesToClock(-125)).toBe("−2h 05min");
  expect(minutesToClock(75)).toBe("+1h 15min");
  expect(minutesToClock(null)).toBe("Não apurado");
  expect(workedHours(145)).toBe("2h 25min");
  expect(workedHours(null)).toBe("Não apurado");
  expect(clockKindLabels.lunch_out).toBe("Saída para almoço");
 });
 it("calcula períodos de semana na virada do mês e meses bissextos",()=>{
  expect(workWeekBounds("2026-11-01")).toEqual({from:"2026-10-26",to:"2026-11-01"});
  expect(monthBounds("2028-02")).toEqual({from:"2028-02-01",to:"2028-02-29"});
 });
});
