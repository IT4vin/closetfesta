import { describe, it, beforeEach, expect, vi } from "vitest";

const { from, findRentalOrder, records }=vi.hoisted(()=>{
  const records:Record<string,{data:any,error:any}>={};
  const findRentalOrder=vi.fn();
  const from=vi.fn((table:string)=>{
    const result=()=>Promise.resolve(records[table]??{data:[],error:null});
    const chain:any={
      select:()=>chain,
      eq:()=>chain,
      in:()=>chain,
      order:()=>chain,
      single:()=>result(),
      maybeSingle:()=>result(),
      then:(resolve:(value:any)=>void,reject:(cause:any)=>void)=>result().then(resolve,reject),
    };
    return chain;
  });
  return {from,findRentalOrder,records};
});
vi.mock("@/integrations/supabase/client",()=>({supabase:{from}}));
vi.mock("@/lib/rentalOrders",()=>({findRentalOrder}));

import { contactLinks, loadRentalOrderDetail, paymentTotals, readableAddress } from "@/lib/rentalOrderDetails";
const id="00000000-0000-4000-8000-000000000001";
const order={
  id, customer_id:"customer-1", customer_name:"Cliente real", created_by:"staff-1",
  items:[{id:"item-1",product_id:"product-1",status:"pending"}],
  total:280,
};

describe("detalhes do pedido de locação",()=>{
  beforeEach(()=>{
    from.mockClear();findRentalOrder.mockReset();
    for(const key of Object.keys(records))delete records[key];
    findRentalOrder.mockResolvedValue(order);
    records.clients={data:{id:"customer-1",full_name:"Cliente real",phone:"(21) 99876-5432",
      email:"cliente@example.com",document:null,address:{street:"Rua A",number:"10",city:"Rio de Janeiro"},notes:null},error:null};
    records.product_images={data:[{id:"photo",product_id:"product-1",url:"https://example.com/foto.jpg",is_primary:true,position:0}],error:null};
    records.rental_items={data:[{id:"item-1",status:"confirmed",picked_up_at:null,actual_return_at:null,return_notes:null}],error:null};
    records.rental_payments={data:[{id:"payment-1",amount:100,method:"pix",status:"operator_recorded",installments:1,recorded_at:"2026-11-07T14:00:00Z"}],error:null};
    records.profiles={data:{id:"staff-1",full_name:"Consultora"},error:null};
  });
  it("busca detalhes por id real e não mistura dados de outros contratos",async()=>{
    const detail=await loadRentalOrderDetail(id,true);
    expect(findRentalOrder).toHaveBeenCalledWith(id);
    expect(detail?.customer.full_name).toBe("Cliente real");
    expect(detail?.images).toHaveLength(1);
    expect(detail?.itemProgress[0].status).toBe("confirmed");
    expect(detail?.payments).toHaveLength(1);
    expect(detail?.attendant).toBe("Consultora");
    expect(from).toHaveBeenCalledWith("rental_payments");
  });
  it("não consulta pagamentos quando o papel não tem permissão",async()=>{
    const detail=await loadRentalOrderDetail(id,false);
    expect(detail?.payments).toBeNull();
    expect(from).not.toHaveBeenCalledWith("rental_payments");
  });
  it("não consulta o banco se o identificador for inválido",async()=>{
    await expect(loadRentalOrderDetail("ALU-000001",true)).resolves.toBeNull();
    expect(from).not.toHaveBeenCalled();
    expect(findRentalOrder).not.toHaveBeenCalled();
  });
  it("recusa apresentar dados incompletos como se fossem reais",async()=>{
    records.clients={data:null,error:{message:"Acesso negado"}};
    await expect(loadRentalOrderDetail(id,true)).rejects.toThrow("Acesso negado");
  });
  it("calcula saldo descontando estornos e identifica excesso",()=>{
    const paid=paymentTotals(280,[
      {id:"a",amount:100,method:"pix",status:"operator_recorded",installments:1,recorded_at:""},
      {id:"b",amount:50,method:"cash",status:"reversed",installments:1,recorded_at:""},
    ]);
    expect(paid).toEqual({received:100,remaining:180,exceeded:false});
    expect(paymentTotals(280,[
      {id:"c",amount:290,method:"pix",status:"reconciled",installments:1,recorded_at:""},
    ])).toEqual({received:290,remaining:0,exceeded:true});
  });
  it("só cria link WhatsApp a partir de telefone brasileiro válido",()=>{
    expect(contactLinks("(21) 99876-5432").whatsapp).toBe("https://wa.me/5521998765432");
    expect(contactLinks("5521998765432").whatsapp).toBe("https://wa.me/5521998765432");
    expect(contactLinks("123").whatsapp).toBeNull();
    expect(contactLinks(null).tel).toBeNull();
    expect(readableAddress({street:"Rua A",number:"10",city:"Rio de Janeiro"})).toBe("Rua A, 10, Rio de Janeiro");
  });
});
