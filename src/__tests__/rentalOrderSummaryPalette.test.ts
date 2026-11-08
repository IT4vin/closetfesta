import {describe,expect,it} from "vitest";
import {rentalOrderSummaryPalette} from "@/lib/rentalOrderSummaryPalette";

describe("cores da ficha lateral do pedido por status",()=>{
  it.each(["confirmed","pending","picked_up","reserved",""])(
    "usa bege claro para pedido ativo (%s)",status=>{
      const palette=rentalOrderSummaryPalette(status);
      expect(palette.container).toContain("bg-[#FAF2E7]");
      expect(palette.container).toContain("text-[#48382F]");
      expect(palette.badge).toContain("text-[#714B3A]");
    }
  );
  it("usa off-white em contrato cancelado, mantendo alertas vermelhos",()=>{
    const palette=rentalOrderSummaryPalette("cancelled");
    expect(palette.container).toContain("bg-[#FAF7F2]");
    expect(palette.badge).toContain("bg-[#FAF7F2]");
    expect(palette.muted).toContain("text-red-800");
    expect(palette.editButton).toContain("text-red-900");
  });
  it.each(["returned","completed"])(
    "usa verde claro somente depois de devolvido/concluído (%s)",status=>{
      const palette=rentalOrderSummaryPalette(status);
      expect(palette.container).toContain("bg-emerald-50");
      expect(palette.badge).toContain("bg-emerald-100");
      expect(palette.link).toContain("text-emerald-900");
    }
  );
  it("normaliza estados e nunca considera a retirada como conclusão",()=>{
    expect(rentalOrderSummaryPalette(" CANCELLED ").container).toContain("bg-[#FAF7F2]");
    expect(rentalOrderSummaryPalette("COMPLETED").container).toContain("bg-emerald-50");
    expect(rentalOrderSummaryPalette("picked_up").container).toContain("bg-[#FAF2E7]");
  });
});
