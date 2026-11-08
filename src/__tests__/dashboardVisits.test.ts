import { beforeEach, describe, expect, it, vi } from "vitest";
const { rpc }=vi.hoisted(()=>({rpc:vi.fn()}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{rpc}}));
import {
 fetchDashboardVisitList,confirmDashboardVisits,visitCount,visitDateBR,
} from "@/lib/dashboardVisits";
const result={
 period:"today",kind:"prova",today:"2026-11-08",
 counts:{prova:{total:2,confirmed:1,pending:1}},
 rows:[{contract_id:"c1",contract_number:8,client_name:"Cliente Teste",
  kind:"prova",day:"2026-11-08",time:"13:00",items_total:2,
  confirmed:false,confirmed_at:null,confirmed_by:null,physical_complete:false}],
 total:1,offset:0,limit:30,
};
describe("dashboard e confirmação de visitas no Supabase",()=>{
 beforeEach(()=>rpc.mockReset());
 it("consulta lista por tipo e período e mantém um contrato com vários trajes",async()=>{
  rpc.mockResolvedValueOnce({data:result,error:null});
  const data=await fetchDashboardVisitList("today","prova",0,30);
  expect(data.rows).toHaveLength(1);
  expect(data.rows[0].items_total).toBe(2);
  expect(data.counts.prova?.confirmed).toBe(1);
  expect(rpc).toHaveBeenCalledWith("closet_dashboard_visits",{
   p_period:"today",p_kind:"prova",p_offset:0,p_limit:30,
  });
  expect(visitCount(data,"retirada")).toEqual({total:0,confirmed:0,pending:0});
 });
 it("confirma vários pedidos do mesmo dia com a RPC auditada",async()=>{
  rpc.mockResolvedValueOnce({data:{confirmed:2,new_confirmations:2},error:null});
  await expect(confirmDashboardVisits(["c1","c2"],"retirada","2026-11-08"))
    .resolves.toMatchObject({confirmed:2});
  expect(rpc).toHaveBeenCalledWith("closet_confirm_visit_attendance",{
   p_contract_ids:["c1","c2"],p_kind:"retirada",p_day:"2026-11-08",
  });
 });
 it("não trata erro como presença confirmada",async()=>{
  rpc.mockResolvedValueOnce({data:null,error:{message:"Sem permissão"}});
  await expect(confirmDashboardVisits(["c1"],"prova","2026-11-08"))
    .rejects.toThrow("Sem permissão");
  rpc.mockResolvedValueOnce({data:{confirmed:0},error:null});
  await expect(confirmDashboardVisits(["c1"],"prova","2026-11-08"))
    .rejects.toThrow("não confirmou");
 });
 it("impede seleções inválidas e valida a data local sem conversão de fuso",async()=>{
  expect(visitDateBR("2026-11-08")).toBe("08/11/2026");
  await expect(confirmDashboardVisits(["c1","c1"],"prova","2026-11-08"))
    .rejects.toThrow("mesmo tipo");
  await expect(fetchDashboardVisitList("today","prova",-1))
    .rejects.toThrow("inválidos");
  expect(rpc).not.toHaveBeenCalled();
 });
 it("rejeita resposta incompleta, sem presumir quantidade",async()=>{
  rpc.mockResolvedValueOnce({data:{period:"today",rows:null},error:null});
  await expect(fetchDashboardVisitList("today"))
    .rejects.toThrow("não confirmou");
 });
});
