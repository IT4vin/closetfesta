import { supabase } from "@/integrations/supabase/client";
import { findRentalOrder } from "@/lib/rentalOrders";
import type { Order } from "@/lib/api";

const db = supabase as any;

export type OrderCustomer = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  document: string | null;
  address: Record<string, unknown> | string | null;
  notes: string | null;
};
export type OrderImage = {
  id: string;
  product_id: string;
  url: string;
  is_primary: boolean;
  position: number;
};
export type OrderPayment = {
  id: string;
  amount: number;
  method: string;
  status: string;
  installments: number;
  recorded_at: string;
};
export type ItemProgress = {
  id: string;
  status: string;
  picked_up_at: string | null;
  actual_return_at: string | null;
  return_notes: string | null;
  unit_id: string;
  product_units: { status: string } | null;
};
export type OrderDetail = {
  order: Order;
  customer: OrderCustomer;
  images: OrderImage[];
  itemProgress: ItemProgress[];
  payments: OrderPayment[] | null;
  attendant: string | null;
  imagesError: string | null;
};

export function paymentTotals(total: number, payments: OrderPayment[]) {
  const received = Math.round(payments.filter(payment => payment.status !== "reversed")
    .reduce((sum, payment) => sum + Number(payment.amount), 0) * 100) / 100;
  const remaining = Math.max(0, Math.round((total - received) * 100) / 100);
  return { received, remaining, exceeded: received > total + 0.009 };
}

/** Números brasileiros com DDD, ou E.164 com código 55 já informado. */
export function contactLinks(phone: string | null) {
  if (!phone) return { tel: null, whatsapp: null };
  const digits = phone.replace(/\D/g, "");
  const national = digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
    ? digits.slice(2) : digits;
  const valid = (national.length === 10 || national.length === 11)
    && /^[1-9][0-9]/.test(national);
  return {
    tel: digits ? "tel:+" + (valid ? "55" + national : digits) : null,
    whatsapp: valid ? "https://wa.me/55" + national : null,
  };
}

export function readableAddress(address: OrderCustomer["address"]) {
  if (!address) return null;
  if (typeof address === "string") return address.trim() || null;
  const fields = ["street", "number", "complement", "neighborhood", "city", "state", "cep"];
  const parts = fields.map(key => address[key]).filter(value => typeof value === "string" || typeof value === "number");
  return parts.length ? parts.map(String).join(", ") : null;
}

/** Consultas específicas por id; respeita RLS (não usa service role nem cache local). */
export async function loadRentalOrderDetail(id: string, canReadPayments: boolean): Promise<OrderDetail | null> {
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)) {
    return null;
  }
  const order = await findRentalOrder(id);
  if (!order?.customer_id) return null;

  const ids = [...new Set(order.items.map(item => item.product_id).filter(Boolean))];
  const itemIds = order.items.map(item => item.id);
  const [clientResult, imagesResult, itemsResult, paymentsResult, profileResult] = await Promise.all([
    db.from("clients").select("id,full_name,phone,email,document,address,notes")
      .eq("id", order.customer_id).single(),
    ids.length
      ? db.from("product_images").select("id,product_id,url,is_primary,position")
        .in("product_id", ids).order("position",{ascending:true})
      : Promise.resolve({ data:[], error:null }),
    itemIds.length
      ? db.from("rental_items").select("id,status,picked_up_at,actual_return_at,return_notes,unit_id,product_units(status)")
        .in("id",itemIds)
      : Promise.resolve({ data:[], error:null }),
    canReadPayments
      ? db.from("rental_payments").select("id,amount,method,status,installments,recorded_at")
        .eq("contract_id",id).order("recorded_at",{ascending:false})
      : Promise.resolve({ data:null, error:null }),
    db.from("profiles").select("id,full_name").eq("id",order.created_by).maybeSingle(),
  ]);

  if (clientResult.error) throw new Error("Erro ao consultar contato do cliente: " + clientResult.error.message);
  if (!clientResult.data) throw new Error("Cliente relacionado ao contrato não está disponível.");
  if (itemsResult.error) throw new Error("Erro ao consultar os estados dos trajes: " + itemsResult.error.message);
  if (paymentsResult.error) throw new Error("Erro ao consultar pagamentos: " + paymentsResult.error.message);

  return {
    order,
    customer: clientResult.data as OrderCustomer,
    images: (imagesResult.data ?? []) as OrderImage[],
    itemProgress: (itemsResult.data ?? []) as ItemProgress[],
    payments: canReadPayments ? (paymentsResult.data ?? []) as OrderPayment[] : null,
    attendant: profileResult.error ? null : (profileResult.data?.full_name ?? null),
    imagesError: imagesResult.error ? String(imagesResult.error.message) : null,
  };
}
