import { describe, expect, it } from "vitest";
import { canReleaseCare, canStartCareMaintenance, pendingBookingsForMaintenance } from "@/lib/careTasks";
import type { LiveItem } from "@/hooks/useLiveClosetData";

const item = (status: string, unitId = "u1", returnDate = "2026-12-12"): LiveItem => ({
  id: status, contract_id: "order1", product_id: "p1", unit_id: unitId,
  unit_price: 250, discount: 0, status,
  try_on_date: null, pickup_date: "2026-12-10",
  event_date: "2026-12-11", return_date: returnDate,
  actual_return_at: null,
});

describe("fluxo de lavanderia e manutenção", () => {
  it("não inicia manutenção de exemplar retirado, consignado ou já em reparo", () => {
    expect(canStartCareMaintenance("available")).toBe(true);
    expect(canStartCareMaintenance("laundry")).toBe(true);
    for (const status of ["maintenance", "inactive", "consigned"]) {
      expect(canStartCareMaintenance(status)).toBe(false);
    }
  });
  it("alerta reservas confirmadas futuras e ignora devoluções/cancelamentos", () => {
    const list = [
      item("confirmed"),
      item("picked_up"),
      item("cancelled"),
      item("returned"),
      item("confirmed", "u2"),
      item("confirmed", "u1", "2026-12-01"),
    ];
    expect(pendingBookingsForMaintenance(list, "u1", "2026-12-07").map((x) => x.id))
      .toEqual(["confirmed"]);
  });
  it("só libera uma tarefa aberta que corresponde ao estado físico", () => {
    expect(canReleaseCare({status:"open",kind:"laundry"},{status:"laundry"})).toBe(true);
    expect(canReleaseCare({status:"open",kind:"maintenance"},{status:"maintenance"})).toBe(true);
    expect(canReleaseCare({status:"completed",kind:"laundry"},{status:"laundry"})).toBe(false);
    expect(canReleaseCare({status:"open",kind:"maintenance"},{status:"laundry"})).toBe(false);
    expect(canReleaseCare(null,{status:"available"})).toBe(false);
  });
});
