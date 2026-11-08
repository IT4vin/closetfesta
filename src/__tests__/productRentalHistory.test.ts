import { beforeEach, describe, expect, it, vi } from "vitest";
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({supabase: {rpc}}));
import {
  fetchProductRentalHistory, productHistoryDate, productHistoryMoney,
  productHistoryStatus, PRODUCT_HISTORY_PAGE_SIZE,
} from "@/lib/productRentalHistory";

const productId="11111111-1111-4111-8111-111111111111";
const sample = {
  product_id:productId,total_count:52,contract_count:50,cancelled_count:2,
  total_historical_value:8500,total_valid_value:7700,total_out_value:4800,
  items:[{ id:"i1",contract_id:"c1",contract_number:5,
    customer_name:"Cliente Exemplo",status:"cancelled",contract_status:"cancelled",
    unit_number:1,try_on_date:"2026-11-23",pickup_date:"2026-11-27",
    event_date:"2026-11-29",return_date:"2026-11-30",actual_return_at:null,
    picked_up_at:null,unit_price:960,discount:0,conflict_override:false
  }]
};
describe("histórico completo de locações por produto",()=>{
  beforeEach(()=>rpc.mockReset());
  it("consulta um produto por páginas, sem limitar aos últimos 100 registros",async()=>{
    rpc.mockResolvedValueOnce({data:sample,error:null});
    const data=await fetchProductRentalHistory(productId,2);
    expect(data.total_count).toBe(52);
    expect(data.items[0].customer_name).toBe("Cliente Exemplo");
    expect(data.items[0].status).toBe("cancelled");
    expect(rpc).toHaveBeenCalledWith("rental_product_full_history",{
      p_product_id:productId,p_limit:PRODUCT_HISTORY_PAGE_SIZE,p_offset:50,
    });
  });
  it("distingue cancelado, reservado e devolvido",()=>{
    expect(productHistoryStatus(sample.items[0]).label).toBe("Cancelado");
    expect(productHistoryStatus({status:"confirmed",contract_status:"confirmed"}).label).toBe("Reservado");
    expect(productHistoryStatus({status:"returned",contract_status:"completed"}).label).toBe("Devolvido");
    expect(productHistoryStatus({status:"confirmed",contract_status:"cancelled"}).label).toBe("Cancelado");
  });
  it("formata datas PostgreSQL sem trocar o dia pelo fuso horário",()=>{
    expect(productHistoryDate("2026-11-27")).toBe("27/11/2026");
    expect(productHistoryDate("2026-11-27T00:00:00+00:00")).toBe("27/11/2026");
    expect(productHistoryDate(null)).toBe("—");
    expect(productHistoryMoney(960)).toMatch(/R\$\s*960,00/);
  });
  it("não exibe dados inventados em erros de acesso ou resposta incompleta",async()=>{
    rpc.mockResolvedValueOnce({data:null,error:{message:"Sem permissão"}});
    await expect(fetchProductRentalHistory(productId,0)).rejects.toThrow("Sem permissão");
    rpc.mockResolvedValueOnce({data:{product_id:productId,items:[]},error:null});
    await expect(fetchProductRentalHistory(productId,0)).rejects.toThrow("não confirmado");
  });
  it("rejeita paginação inválida",async()=>{
    await expect(fetchProductRentalHistory(productId,-1)).rejects.toThrow("inválidos");
    await expect(fetchProductRentalHistory(productId,0,500)).rejects.toThrow("inválidos");
    expect(rpc).not.toHaveBeenCalled();
  });
});
