import type { LiveItem, LiveUnit, LiveProduct } from "@/hooks/useLiveClosetData";

/** Disponibilidade física de HOJE, não promessa de disponibilidade em outra data. */
export function holdsUnitToday(
  item: Pick<LiveItem, "status" | "pickup_date" | "return_date" | "actual_return_at">,
  day: string,
): boolean {
  if (item.status === "cancelled" || item.status === "returned" || item.actual_return_at) return false;
  // Uma retirada aberta bloqueia o exemplar mesmo quando a devolução está atrasada.
  if (item.status === "picked_up") return true;
  // Reserva futura não significa que o vestido já saiu da loja.
  return item.status === "confirmed" && item.pickup_date <= day && day <= item.return_date;
}

export function allocatedUnitIdsToday(items: readonly LiveItem[], day: string): Set<string> {
  return new Set(items.filter((item) => holdsUnitToday(item, day)).map((item) => item.unit_id));
}

export function freeUnitsToday(
  units: readonly LiveUnit[],
  activeProducts: readonly LiveProduct[],
  items: readonly LiveItem[],
  day: string,
): LiveUnit[] {
  const allowedProducts = new Set(activeProducts.filter((product) => product.active && !product.deleted_at)
    .map((product) => product.id));
  const occupied = allocatedUnitIdsToday(items, day);
  return units.filter((unit) => unit.status === "available" &&
    allowedProducts.has(unit.product_id) && !occupied.has(unit.id));
}
