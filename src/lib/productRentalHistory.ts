import { supabase } from "@/integrations/supabase/client";

export interface ProductRentalHistoryEntry {
  id: string;
  contract_id: string;
  contract_number: number;
  contract_status: string;
  customer_name: string;
  unit_number: number;
  try_on_date: string | null;
  pickup_date: string;
  event_date: string;
  return_date: string;
  actual_return_at: string | null;
  picked_up_at: string | null;
  status: string;
  unit_price: number;
  discount: number;
  conflict_override: boolean;
}

export interface ProductRentalHistoryResult {
  product_id: string;
  total_count: number;
  contract_count: number;
  cancelled_count: number;
  total_historical_value: number;
  total_valid_value: number;
  total_out_value: number;
  items: ProductRentalHistoryEntry[];
}

export const PRODUCT_HISTORY_PAGE_SIZE = 25;

export function productHistoryStatus(entry: Pick<
  ProductRentalHistoryEntry,"status"|"contract_status"
>): {label:string; variant:"destructive"|"outline"|"secondary"; warning:boolean} {
  if (entry.status === "cancelled" || entry.contract_status === "cancelled")
    return {label:"Cancelado",variant:"destructive",warning:true};
  if (entry.status === "returned")
    return {label:"Devolvido",variant:"outline",warning:false};
  if (entry.status === "picked_up")
    return {label:"Retirado",variant:"secondary",warning:false};
  if (entry.contract_status === "completed")
    return {label:"Concluído",variant:"outline",warning:false};
  if (entry.status === "confirmed")
    return {label:"Reservado",variant:"outline",warning:false};
  return {label:entry.status || "Indefinido",variant:"outline",warning:false};
}

export function productHistoryDate(value:string|null|undefined):string {
  if (!value) return "—";
  // Dates from PostgreSQL must not shift across time zones at midnight.
  const iso=value.slice(0,10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "—";
  const [year,month,day]=iso.split("-");
  return day+"/"+month+"/"+year;
}

export function productHistoryMoney(value:number):string {
  return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"})
    .format(Number(value)||0);
}

export async function fetchProductRentalHistory(
  productId:string,page:number,limit=PRODUCT_HISTORY_PAGE_SIZE
):Promise<ProductRentalHistoryResult> {
  if (!productId || !Number.isInteger(page) || page<0 ||
      !Number.isInteger(limit) || limit<1 || limit>100) {
    throw new Error("Produto ou paginação inválidos.");
  }
  const {data,error}=await (supabase as any).rpc("rental_product_full_history",{
    p_product_id:productId,
    p_limit:limit,
    p_offset:page*limit,
  });
  if (error) throw new Error(error.message);
  if (!data || data.product_id!==productId ||
      !Array.isArray(data.items) || !Number.isFinite(Number(data.total_count))) {
    throw new Error("Histórico do produto não confirmado pelo banco.");
  }
  return data as ProductRentalHistoryResult;
}
