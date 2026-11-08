import { supabase } from "@/integrations/supabase/client";
import type { OrderDates } from "@/components/pdv/PDVSale";

export type RentalHistoryEntry = {
  id: string;
  contract_id: string;
  contract_number: number;
  contract_status: string;
  unit_number: number;
  try_on_date: string | null;
  pickup_date: string;
  event_date: string;
  return_date: string;
  actual_return_at: string | null;
  status: string;
  override: boolean;
};
export type ProductCartAvailability = {
  product_id: string;
  pickup_date: string;
  return_date: string;
  requested_quantity: number;
  free_units: number;
  physical_available_units: number;
  available: boolean;
  conflicts: RentalHistoryEntry[];
  history: RentalHistoryEntry[];
};
export type CartConflictApproval = { key: string; reason: string };

export function availabilityKey(productId: string, quantity: number, dates: OrderDates): string {
  return [productId, quantity, dates.pickupDate, dates.eventDate, dates.returnDate, dates.tryOnDate].join("|");
}
export function datesForAvailability(dates: OrderDates): boolean {
  return Boolean(dates.pickupDate && dates.eventDate && dates.returnDate &&
    dates.pickupDate < dates.eventDate && dates.eventDate < dates.returnDate &&
    (!dates.tryOnDate || dates.tryOnDate < dates.pickupDate));
}
export function conflictApproved(
  approval: CartConflictApproval | undefined,
  productId: string,
  quantity: number,
  dates: OrderDates,
): boolean {
  return Boolean(approval &&
    approval.key === availabilityKey(productId, quantity, dates) &&
    approval.reason.trim().length >= 10 &&
    approval.reason.trim().length <= 500);
}
export async function checkCartProductAvailability(
  productId: string,
  quantity: number,
  dates: OrderDates,
): Promise<ProductCartAvailability> {
  if (!datesForAvailability(dates)) throw new Error("Informe datas válidas para consultar a disponibilidade.");
  const { data, error } = await (supabase as any).rpc("rental_check_product_availability", {
    p_product_id: productId,
    p_pickup: dates.pickupDate,
    p_return: dates.returnDate,
    p_quantity: quantity,
  });
  if (error) throw new Error(error.message);
  if (!data || data.product_id !== productId || typeof data.available !== "boolean" ||
      !Array.isArray(data.history) || !Array.isArray(data.conflicts)) {
    throw new Error("O Supabase não confirmou a disponibilidade do produto.");
  }
  return data as ProductCartAvailability;
}
