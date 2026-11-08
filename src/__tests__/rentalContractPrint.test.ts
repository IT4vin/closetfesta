import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { rentalContractHtml, escapeContractHtml } from "@/lib/rentalContractPrint";
import type { OrderDetail } from "@/lib/rentalOrderDetails";
describe("contrato com dados reais",()=>{
  it("escapa conteúdo do cliente, impedindo HTML inserido no contrato",()=>{
    expect(escapeContractHtml("<script>alert('x')</script>")).toBe("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;");
  });
  it("não inclui dados bancários nem saldos de pagamentos em minuta canônica",()=>{
    const detail = {
      order:{
        id:"a", order_number:"ALU-000123", items:[{
          id:"item", product:{name:"Vestido real",sku:"F-123"},
          unit_price:450,discount:30,try_on_date:"2026-11-10",
          pickup_date:"2026-11-15",event_date:"2026-11-16",return_date:"2026-11-18"
        }],subtotal:450,total_discount:30,total:420,observations:null
      },
      customer:{full_name:"Cliente exemplo",document:null,phone:null,email:null,address:null},
      itemProgress:[{id:"item",status:"confirmed"}],payments:null
    } as unknown as OrderDetail;
    const html=rentalContractHtml(detail,{issuedAt:"2026-10-01T13:00:00Z"});
    expect(html).toContain("01/10/2026");
    expect(html).toContain("ALU-000123");
    expect(html).toContain("Vestido real");
    expect(html).toMatch(/R\\$\\s+420,00/);
    expect(html).toContain("saldos e estornos são consultados separadamente");
    expect(html).not.toContain("Recebido no sistema");
    expect(html).not.toContain("Saldo registrado");
  });
  it("usa o número verdadeiro do contrato e não inventa CNPJ, multas ou pagamentos",()=>{
    const detail:OrderDetail={
      order:{id:"uuid",order_number:"ALU-000042",customer_id:"c",customer_name:"Cliente",
        order_type:"rental",status:"confirmed",created_by:"u",created_at:"2026-11-07T10:00:00Z",
        updated_at:"2026-11-07T10:00:00Z",items:[],subtotal:300,total_discount:50,total:250,
        total_sales:0,total_rentals:250} as any,
      customer:{id:"c",full_name:"Pessoa <teste>",phone:"(21) 99999-9999",email:null,
        document:null,address:null,notes:null},
      payments:null,itemProgress:[],attendant:null,images:[],imagesError:null,
    };
    const html=rentalContractHtml(detail);
    expect(html).toContain("ALU-000042");
    expect(html).toContain("Pessoa &lt;teste&gt;");
    expect(html).toContain("MINUTA DE CONTRATO");
    expect(html).toContain("Razão social/CNPJ: __________________________");
    expect(html).not.toContain("10% por dia");
    expect(html).not.toContain("São Paulo/SP");
    expect(html).not.toContain("R$ 0,00</p><p>Saldo");
  });
});
