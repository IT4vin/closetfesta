import {describe,it,expect} from "vitest";
import {allocatedUnitIdsToday, freeUnitsToday, holdsUnitToday} from "@/lib/inventoryAvailability";
import type { LiveItem,LiveUnit,LiveProduct } from "@/hooks/useLiveClosetData";
const base={status:"confirmed",pickup_date:"2026-11-12",return_date:"2026-11-16",actual_return_at:null};
const item=(overrides:Partial<LiveItem>={}):LiveItem=>({
  id:"i1",contract_id:"c1",product_id:"p1",unit_id:"u1",
  unit_price:200,discount:0,try_on_date:"2026-11-10",event_date:"2026-11-14",
  ...base,...overrides,
});
describe("disponibilidade física por data",()=>{
  it("não bloqueia o estoque atual por uma locação confirmada apenas no futuro",()=>{
    expect(holdsUnitToday(base,"2026-11-07")).toBe(false);
    expect(holdsUnitToday(base,"2026-11-12")).toBe(true);
    expect(holdsUnitToday(base,"2026-11-16")).toBe(true);
    expect(holdsUnitToday(base,"2026-11-17")).toBe(false);
  });
  it("mantém indisponível o traje retirado mesmo após o prazo até devolução",()=>{
    expect(holdsUnitToday({...base,status:"picked_up"},"2026-12-01")).toBe(true);
    expect(holdsUnitToday({...base,status:"picked_up",actual_return_at:"2026-11-17T19:00:00Z"},"2026-12-01")).toBe(false);
  });
  it("não bloqueia devoluções nem contratos cancelados",()=>{
    expect(holdsUnitToday({...base,status:"returned"},"2026-11-14")).toBe(false);
    expect(holdsUnitToday({...base,status:"cancelled"},"2026-11-14")).toBe(false);
  });
  it("respeita estado físico e não conta produtos inativos",()=>{
    const products=[{id:"p1",name:"Vestido",sku:null,price:200,category_id:null,
      stock_quantity:2,active:true,deleted_at:null}] as LiveProduct[];
    const units=[{id:"u1",product_id:"p1",unit_number:1,status:"available"},
      {id:"u2",product_id:"p1",unit_number:2,status:"laundry"}] as LiveUnit[];
    expect(allocatedUnitIdsToday([item()],"2026-11-07").size).toBe(0);
    expect(freeUnitsToday(units,products,[item()],"2026-11-07").map(u=>u.id)).toEqual(["u1"]);
    expect(freeUnitsToday(units,products,[item()],"2026-11-14")).toEqual([]);
    expect(freeUnitsToday(units,[{...products[0],active:false}],[item()],"2026-11-07")).toEqual([]);
  });
});
