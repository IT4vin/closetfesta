import { describe, expect, it, beforeEach, vi } from "vitest";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));

import {
  confirmRentalPickup,
  confirmRentalReturn,
  recordRentalPayment,
  releaseRentalItemFromLaundry,
} from "@/lib/rentalLifecycle";

describe("operações de locação — confirmação real do banco", () => {
  beforeEach(() => { rpc.mockReset(); });

  it("não confirma retirada nem devolução se o banco devolver erro", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "Banco indisponível", code: "08006" } });
    await expect(confirmRentalPickup("item-123")).rejects.toThrow("Banco indisponível");
    await expect(confirmRentalReturn("item-123", "Sem avarias")).rejects.toThrow("Banco indisponível");
  });

  it("nega sucesso sem identificador retornado pela operação", async () => {
    rpc.mockResolvedValue({ data: {}, error: null });
    await expect(confirmRentalPickup("item-123")).rejects.toThrow("não confirmou");
  });

  it("faz a devolução com observação sem confiar em datas do navegador", async () => {
    rpc.mockResolvedValue({ data: { id: "item-123", status: "returned" }, error: null });
    await expect(confirmRentalReturn("item-123", "Pequeno reparo")).resolves.toBe("item-123");
    expect(rpc).toHaveBeenCalledWith("rental_confirm_return", {
      p_item_id: "item-123",
      p_notes: "Pequeno reparo",
    });
  });

  it("exige identificação e bloqueia observações excessivas", async () => {
    await expect(confirmRentalPickup("")).rejects.toThrow("Identifique");
    await expect(confirmRentalReturn("item-123", "x".repeat(2001))).rejects.toThrow("2.000");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("impede valores inválidos no pagamento complementar antes de chamar o banco", async () => {
    const base = { contractId: "contrato", requestId: "uuid-idempotente", method: "pix" as const };
    await expect(recordRentalPayment({ ...base, amount: -12 })).rejects.toThrow("positivo");
    await expect(recordRentalPayment({ ...base, amount: NaN })).rejects.toThrow("positivo");
    await expect(recordRentalPayment({ ...base, amount: 20, installments: 0 })).rejects.toThrow("Parcelamento");
    await expect(recordRentalPayment({ ...base, amount: 20, installments: 25 })).rejects.toThrow("Parcelamento");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("encaminha chave de idempotência e depende de confirmação do Supabase", async () => {
    rpc.mockResolvedValue({ data: { id: "pagamento-1" }, error: null });
    await expect(recordRentalPayment({
      contractId: "contrato-1", requestId: "chave-1", method: "pix", amount: 100,
    })).resolves.toBe("pagamento-1");
    expect(rpc).toHaveBeenCalledWith("rental_record_payment", {
      p_contract_id: "contrato-1", p_request_id: "chave-1",
      p_method: "pix", p_amount: 100, p_installments: 1,
    });
  });

  it("a liberação da lavanderia também depende de confirmação do banco", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "Sem autorização", code: "42501" } });
    await expect(releaseRentalItemFromLaundry("item-123")).rejects.toThrow("Sem autorização");
    expect(rpc).toHaveBeenCalledWith("rental_release_laundry", { p_item_id: "item-123" });
  });

  it("orienta sobre migração ausente em vez de confirmar uma operação fictícia", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "RPC missing", code: "PGRST202" } });
    await expect(confirmRentalPickup("item-123")).rejects.toThrow("migration");
  });
});
