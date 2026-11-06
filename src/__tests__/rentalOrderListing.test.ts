import { describe, expect, it, vi, beforeEach } from "vitest";

const listRentalOrders = vi.fn();
const from = vi.fn(() => {
  throw new Error("A listagem de locações não deve consultar sales.");
});

vi.mock("@/lib/rentalOrders", () => ({
  listRentalOrders,
  findRentalOrder: vi.fn(),
  createRentalOrder: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from, rpc: vi.fn() },
}));
vi.mock("@/lib/rentalLifecycle", () => ({
  confirmRentalPickup: vi.fn(),
  confirmRentalReturn: vi.fn(),
  recordRentalPayment: vi.fn(),
}));

import { ordersApi } from "@/lib/api";

describe("listagem de pedidos de aluguel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lista os contratos de aluguel quando nenhum tipo é selecionado", async () => {
    const saved = { id: "contrato-real", order_number: "ALU-000001", order_type: "rental" };
    listRentalOrders.mockResolvedValueOnce({ rows: [saved], total: 1 });
    const result = await ordersApi.findAll({});
    expect(result.success).toBe(true);
    expect(result.data).toEqual([saved]);
    expect(result.total).toBe(1);
    expect(listRentalOrders).toHaveBeenCalledTimes(1);
    expect(from).not.toHaveBeenCalled();
  });

  it("não consulta a tabela sales nem oculta os aluguéis no filtro rental", async () => {
    listRentalOrders.mockResolvedValueOnce({ rows: [{ id: "r1" }], total: 1 });
    const result = await ordersApi.findAll({ order_type: "rental" });
    expect(result.total).toBe(1);
    expect(from).not.toHaveBeenCalled();
  });

  it("não mostra pedidos inexistentes no filtro de vendas desabilitadas", async () => {
    const result = await ordersApi.findAll({ order_type: "sale" });
    expect(result.data).toEqual([]);
    expect(listRentalOrders).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });
});
