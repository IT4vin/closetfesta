import { supabase } from "@/integrations/supabase/client";
import type { Order, OrderItem, Product } from "@/lib/api";

// A migration de locações deve ser aplicada em homologação antes de habilitar o PDV.
// A API do Supabase é tipada para o schema atual, por isso as tabelas novas só
// entrarão nos tipos gerados após a migration ser executada.
const db = supabase as any;

function mapRentalRow(row: any): Order {
  const items: OrderItem[] = (row.rental_items ?? []).map((item: any) => {
    const product = {
      id: item.product_id,
      name: item.products?.name ?? "Traje",
      sku: item.products?.sku ?? undefined,
    } as Product;
    return {
      id: item.id,
      product_id: item.product_id,
      product,
      quantity: 1,
      unit_price: Number(item.unit_price),
      discount: Number(item.discount),
      subtotal: Number(item.unit_price) - Number(item.discount),
      item_type: "rental" as const,
      try_on_date: item.try_on_date ?? undefined,
      pickup_date: item.pickup_date,
      event_date: item.event_date,
      return_date: item.return_date,
      actual_return_date: item.actual_return_at ?? undefined,
      conflict_override: item.conflict_override === true,
      status: item.status === "returned" ? "returned" : item.status === "picked_up" ? "picked_up" : "pending",
    };
  });

  return {
    id: row.id,
    order_number: `ALU-${String(row.contract_number).padStart(6, "0")}`,
    customer_id: row.client_id,
    customer_name: row.clients?.full_name ?? "",
    customer_document: row.clients?.document ?? undefined,
    customer_phone: row.clients?.phone ?? undefined,
    order_type: "rental",
    status: row.status === "cancelled" ? "cancelled"
      : row.status === "completed" ? "completed" : "confirmed",
    items,
    subtotal: Number(row.subtotal),
    total_discount: Number(row.total_discount),
    total: Number(row.total),
    total_sales: 0,
    total_rentals: Number(row.total),
    observations: row.notes ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by,
  };
}

const RENTAL_SELECT = "*, clients(full_name, document, phone), rental_items(*, products(name, sku))";

export async function findRentalOrder(id: string): Promise<Order | null> {
  const { data, error } = await db.from("rental_contracts")
    .select(RENTAL_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRentalRow(data) : null;
}

export async function listRentalOrders(params: {
  status?: string;
  customer_name?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ rows: Order[]; total: number }> {
  let query = db.from("rental_contracts")
    .select(RENTAL_SELECT, { count: "exact" })
    .order("created_at", { ascending: false });
  if (params.status) query = query.eq("status", params.status);
  if (params.date_from) query = query.gte("created_at", params.date_from);
  if (params.date_to) query = query.lte("created_at", params.date_to);
  if (params.limit) {
    const offset = params.offset ?? 0;
    query = query.range(offset, offset + params.limit - 1);
  }
  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  let rows = (data ?? []).map(mapRentalRow);
  if (params.customer_name) {
    const term = params.customer_name.toLocaleLowerCase("pt-BR");
    rows = rows.filter((row: Order) => row.customer_name.toLocaleLowerCase("pt-BR").includes(term));
  }
  return { rows, total: params.customer_name ? rows.length : count ?? rows.length };
}

export async function createRentalOrder(input: {
  request_id?: string;
  client_id?: string;
  customer_name: string;
  customer_document?: string;
  customer_phone?: string;
  items: Array<Record<string, unknown>>;
  total_discount: number;
  total: number;
  observations?: string;
  payment_details?: { payments?: Array<{ method: string; value: number; installments?: number }> };
}): Promise<Order> {
  if (!input.request_id) throw new Error("Chave de confirmação ausente. Reabra a operação.");
  const request = {
    request_id: input.request_id,
    client_id: input.client_id ?? null,
    customer_name: input.customer_name,
    customer_document: input.customer_document ?? null,
    customer_phone: input.customer_phone ?? null,
    items: input.items,
    total_discount: input.total_discount,
    total: input.total,
    observations: input.observations ?? null,
    payments: input.payment_details?.payments ?? [],
  };
  const { data, error } = await db.rpc("create_rental_contract", { p_request: request });
  if (error) {
    if (error.code === "42883" || error.code === "PGRST202") {
      throw new Error("O banco de contratos ainda não foi configurado. Solicite a instalação validada da migration.");
    }
    throw new Error(error.message);
  }
  if (!data?.id) throw new Error("O banco não confirmou o registro do contrato.");
  const saved = await findRentalOrder(data.id);
  if (!saved) throw new Error("Contrato registrado, mas não foi possível consultar o resultado. Verifique antes de tentar novamente.");
  return saved;
}
