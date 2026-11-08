import { describe, expect, it, beforeEach, vi } from "vitest";

const { rowsByTable, from } = vi.hoisted(() => {
  const rowsByTable: Record<string, Array<Record<string, unknown>>> = {};
  const from = vi.fn((table: string) => ({
    select: (_fields: string) => ({
      range: async (fromIndex: number, toIndex: number) => ({
        data: (rowsByTable[table] ?? []).slice(fromIndex, toIndex + 1),
        error: null,
      }),
    }),
  }));
  return { rowsByTable, from };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from },
}));
vi.mock("@/stores/authStore", () => ({
  useAuth: () => ({ user: { id: "staff-1" } }),
}));
vi.mock("@/lib/permissions", () => ({
  default: { hasPermission: () => true },
}));

import { fetchAllRows, loadLiveClosetData, loadLiveFinanceData } from "@/hooks/useLiveClosetData";

describe("consultas reais e proteção contra dados fantasmas", () => {
  beforeEach(() => {
    for (const key of Object.keys(rowsByTable)) delete rowsByTable[key];
    from.mockClear();
  });

  it("exibe somente produtos ativos e não excluídos", async () => {
    rowsByTable.products = [
      { id:"real",name:"Vestido real",active:true,deleted_at:null },
      { id:"arquivado",name:"Vestido antigo",active:false,deleted_at:null },
      { id:"excluido",name:"Vestido excluído",active:true,deleted_at:"2026-11-01T00:00:00Z" },
    ];
    const result = await loadLiveClosetData();
    expect(result.products.map(item => item.id)).toEqual(["real"]);
    expect(result.appointments).toEqual([]);
    expect(result.contracts).toEqual([]);
    expect(from).toHaveBeenCalledWith("products");
    expect(from).toHaveBeenCalledWith("appointments");
  });

  it("pagina todos os registros em vez de presumir total da primeira página", async () => {
    rowsByTable.clients = Array.from({length:501}, (_,i) => ({id:"client-"+i,full_name:"Cliente "+i}));
    const clients = await fetchAllRows<{id:string}>("clients","id,full_name");
    expect(clients).toHaveLength(501);
    expect(clients[500].id).toBe("client-500");
  });

  it("não inventa dados financeiros em um banco sem movimentações", async () => {
    const finance = await loadLiveFinanceData();
    expect(finance).toEqual({payments:[],transactions:[],registers:[],movements:[],creditApplications:[]});
    expect(from).toHaveBeenCalledWith("rental_payments");
    expect(from).toHaveBeenCalledWith("cash_movements");
  });
});
