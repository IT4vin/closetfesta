import { beforeEach, describe, expect, it, vi } from "vitest";
const { rpc } = vi.hoisted(() => ({rpc:vi.fn()}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{rpc}}));
import { availabilityKey, checkCartProductAvailability, conflictApproved, datesForAvailability } from "@/lib/cartAvailability";
const dates={tryOnDate:"2026-12-01",pickupDate:"2026-12-10",eventDate:"2026-12-11",returnDate:"2026-12-13"};
const productId="11111111-1111-4111-8111-111111111111";
describe("disponibilidade antecipada do carrinho",()=>{
 beforeEach(()=>rpc.mockReset());
 it("repassa unidade e intervalo ao Supabase antes de gerar contrato",async()=>{
   rpc.mockResolvedValueOnce({data:{
     product_id:productId,pickup_date:"2026-12-10",return_date:"2026-12-13",
     requested_quantity:1,free_units:0,physical_available_units:1,available:false,
     conflicts:[{id:"i1",pickup_date:"2026-12-10",return_date:"2026-12-13"}],
     history:[{id:"i1",pickup_date:"2026-12-10",return_date:"2026-12-13"}]
   },error:null});
   const result=await checkCartProductAvailability(productId,1,dates);
   expect(result.available).toBe(false);
   expect(result.history).toHaveLength(1);
   expect(rpc).toHaveBeenCalledWith("rental_check_product_availability",{
     p_product_id:productId,p_pickup:"2026-12-10",
     p_return:"2026-12-13",p_quantity:1,
   });
 });
 it("não inventa disponibilidade quando consulta falha",async()=>{
   rpc.mockResolvedValue({data:null,error:{message:"Sem acesso"}});
   await expect(checkCartProductAvailability(productId,1,dates)).rejects.toThrow("Sem acesso");
 });
 it("exige dados confirmados pelo banco",async()=>{
   rpc.mockResolvedValue({data:{available:false},error:null});
   await expect(checkCartProductAvailability(productId,1,dates)).rejects.toThrow("não confirmou");
 });
 it("desbloqueio expira quando quantidade ou datas mudam",()=>{
   const approval={key:availabilityKey(productId,1,dates),reason:"Gerente providenciará outra unidade"};
   expect(conflictApproved(approval,productId,1,dates)).toBe(true);
   expect(conflictApproved(approval,productId,2,dates)).toBe(false);
   expect(conflictApproved(approval,productId,1,{...dates,pickupDate:"2026-12-09"})).toBe(false);
   expect(conflictApproved({key:approval.key,reason:"curto"},productId,1,dates)).toBe(false);
 });
 it("só pesquisa quando todas as datas são coerentes",()=>{
   expect(datesForAvailability(dates)).toBe(true);
   expect(datesForAvailability({...dates,returnDate:""})).toBe(false);
   expect(datesForAvailability({...dates,returnDate:"2026-12-09"})).toBe(false);
 });
});
