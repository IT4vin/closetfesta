import { beforeEach, describe, expect, it, vi } from "vitest";
const {rpc,from} = vi.hoisted(()=>({
  rpc:vi.fn(),from:vi.fn(()=>({select:()=>({eq:()=>({order:()=>({limit:()=>Promise.resolve({data:[],error:null})})})})})),
}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{rpc,from}}));
import { editRentalOrder, loadRentalOrderAudit } from "@/lib/rentalOrderEditing";

describe("edição de pedidos e histórico",()=>{
  beforeEach(()=>{rpc.mockReset();from.mockClear();});
  it("exige justificativa, id e tipo, antes de chamar o banco",async()=>{
    await expect(editRentalOrder({contractId:"contract",action:"notes",data:{notes:""},
      reason:"x",requestId:"uuid"})).rejects.toThrow("justificativa");
    expect(rpc).not.toHaveBeenCalled();
  });
  it("repassa chave de idempotência e motivo ao PostgreSQL",async()=>{
    rpc.mockResolvedValue({data:{id:"audit-1",already_exists:false},error:null});
    await expect(editRentalOrder({contractId:"contract-1",action:"order_discount",
      data:{amount:20},reason:" Cliente autorizou ",requestId:"op-1"})).resolves.toMatchObject({id:"audit-1"});
    expect(rpc).toHaveBeenCalledWith("rental_order_edit",{
      p_contract_id:"contract-1",p_action:"order_discount",
      p_data:{amount:20},p_reason:"Cliente autorizou",p_request_id:"op-1",
    });
  });
  it("nunca exibe sucesso quando a transação falha",async()=>{
    rpc.mockResolvedValue({data:null,error:{message:"Total menor que o recebido"}});
    await expect(editRentalOrder({contractId:"c",action:"replace_item",
      data:{item_id:"i",product_id:"p"},reason:"Mudança solicitada",requestId:"id"}))
      .rejects.toThrow("Total menor que o recebido");
  });
  it("não confirma sem número de auditoria retornado",async()=>{
    rpc.mockResolvedValue({data:{},error:null});
    await expect(editRentalOrder({contractId:"c",action:"notes",
      data:{notes:"ok"},reason:"A pedido da cliente",requestId:"id"}))
      .rejects.toThrow("não confirmou");
  });
  it("o histórico é obtido do banco, não de armazenamento local",async()=>{
    await expect(loadRentalOrderAudit("uuid")).resolves.toEqual([]);
    expect(from).toHaveBeenCalledWith("rental_order_audit");
  });
});
