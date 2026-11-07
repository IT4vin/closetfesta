import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { rentalContractHtml, escapeContractHtml } from "@/lib/rentalContractPrint";
import type { OrderDetail } from "@/lib/rentalOrderDetails";
describe("contrato com dados reais",()=>{
  it("escapa conteúdo do cliente, impedindo HTML inserido no contrato",()=>{
    expect(escapeContractHtml("<script>alert('x')</script>")).toBe("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;");
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
