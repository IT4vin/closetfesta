import { beforeEach,describe,expect,it,vi } from "vitest";
const {rpc}=vi.hoisted(()=>({rpc:vi.fn()}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{rpc}}));
import { createRentalOrder } from "@/lib/rentalOrders";

const request={
 request_id:"11111111-1111-4111-8111-111111111111",
 client_id:"22222222-2222-4222-8222-222222222222",
 customer_name:"Cliente Teste",
 items:[{product_id:"33333333-3333-4333-8333-333333333333",quantity:1,
  unit_price:300,discount:0,try_on_date:"2026-12-01",
  pickup_date:"2026-12-05",event_date:"2026-12-06",return_date:"2026-12-08"}],
 total_discount:0,total:300,observations:"Teste de horários",
};
describe("horários obrigatórios chegam da venda ao Supabase",()=>{
 beforeEach(()=>rpc.mockReset());
 it("inclui horários de prova e retirada no RPC do contrato",async()=>{
  rpc.mockResolvedValueOnce({data:null,error:{message:"Falha simulada no checkout",code:"22023"}});
  await expect(createRentalOrder({...request,try_on_time:"11:30",pickup_time:"12:00"}))
   .rejects.toThrow("Falha simulada");
  expect(rpc).toHaveBeenCalledWith("create_rental_contract",{
   p_request:expect.objectContaining({try_on_time:"11:30",pickup_time:"12:00",
    items:expect.arrayContaining([expect.objectContaining({product_id:request.items[0].product_id})])})
  });
 });
 it("preserva compatibilidade com contratos legados que ainda não possuem hora",async()=>{
  rpc.mockResolvedValueOnce({data:null,error:{message:"Falha simulada",code:"22023"}});
  await expect(createRentalOrder(request)).rejects.toThrow("Falha simulada");
  const payload=rpc.mock.calls[0][1].p_request;
  expect(payload).not.toHaveProperty("try_on_time");
  expect(payload).not.toHaveProperty("pickup_time");
 });
});
