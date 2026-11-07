import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/stores/authStore";
import PermissionManager from "@/lib/permissions";

// Uma única fonte da verdade: nenhum dado de demonstração ou localStorage.
export interface LiveProduct {
  id: string; sku: string | null; name: string; price: number; category_id: string | null;
  stock_quantity: number; active: boolean; deleted_at: string | null;
}
export interface LiveClient { id: string; full_name: string; acquisition_source?: string | null; }
export interface LiveAppointment {
  id: string; client_id: string | null; title: string; description: string | null;
  start_at: string; end_at: string; status: string;
}
export interface LiveContract {
  id: string; contract_number: number; client_id: string; created_by: string; status: string;
  total: number; created_at: string;
}
export interface LiveItem {
  id: string; contract_id: string; product_id: string; unit_id: string;
  unit_price: number; discount: number; status: string;
  try_on_date: string | null; pickup_date: string; event_date: string; return_date: string;
  actual_return_at: string | null;
}
export interface LiveUnit { id: string; product_id: string; status: string; }
export interface LivePayment {
  id: string; contract_id: string; amount: number; method: string;
  status: string; recorded_at: string;
}
export interface LiveTransaction {
  id: string; type: string; category: string | null; description: string;
  amount: number; paid_at: string | null; due_date: string | null;
  status: string; created_at: string;
}
export interface LiveCashRegister {
  id: string; opened_by: string; status: string; opening_amount: number;
  closing_amount: number | null; expected_amount: number | null;
  difference: number | null; opened_at: string;
}
export interface LiveCashMovement {
  id: string; cash_register_id: string; type: string; amount: number;
  created_at: string; reference_id: string | null;
}
export interface LiveClosetData {
  products: LiveProduct[]; clients: LiveClient[]; appointments: LiveAppointment[];
  contracts: LiveContract[]; items: LiveItem[]; units: LiveUnit[];
}
export interface LiveFinanceData {
  payments: LivePayment[]; transactions: LiveTransaction[];
  registers: LiveCashRegister[]; movements: LiveCashMovement[];
}

const db = supabase as any;
const PAGE_SIZE = 500;
const MAX_ROWS = 20000;

// Paginação explícita: não tratar resposta truncada do PostgREST como total real.
export async function fetchAllRows<T>(table: string, fields: string): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; offset < MAX_ROWS; offset += PAGE_SIZE) {
    const result = await db.from(table).select(fields)
      .range(offset, offset + PAGE_SIZE - 1);
    if (result.error) throw new Error("Erro na consulta " + table + ": " + result.error.message);
    const batch = (result.data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) return rows;
  }
  throw new Error("Limite de paginação atingido em " + table + ". Nenhum total foi presumido.");
}

export async function loadLiveClosetData(): Promise<LiveClosetData> {
  const [products, clients, appointments, contracts, items, units] = await Promise.all([
    fetchAllRows<LiveProduct>("products", "id,sku,name,price,category_id,stock_quantity,active,deleted_at"),
    fetchAllRows<LiveClient>("clients", "id,full_name,acquisition_source"),
    fetchAllRows<LiveAppointment>("appointments", "id,client_id,title,description,start_at,end_at,status"),
    fetchAllRows<LiveContract>("rental_contracts", "id,contract_number,client_id,created_by,status,total,created_at"),
    fetchAllRows<LiveItem>("rental_items", "id,contract_id,product_id,unit_id,unit_price,discount,status,try_on_date,pickup_date,event_date,return_date,actual_return_at"),
    fetchAllRows<LiveUnit>("product_units", "id,product_id,status"),
  ]);
  return {
    products: products.filter(product => product.active && !product.deleted_at),
    clients, appointments, contracts, items, units,
  };
}

export async function loadLiveFinanceData(): Promise<LiveFinanceData> {
  const [payments, transactions, registers, movements] = await Promise.all([
    fetchAllRows<LivePayment>("rental_payments", "id,contract_id,amount,method,status,recorded_at"),
    fetchAllRows<LiveTransaction>("financial_transactions", "id,type,category,description,amount,paid_at,due_date,status,created_at"),
    fetchAllRows<LiveCashRegister>("cash_registers", "id,opened_by,status,opening_amount,closing_amount,expected_amount,difference,opened_at"),
    fetchAllRows<LiveCashMovement>("cash_movements", "id,cash_register_id,type,amount,created_at,reference_id"),
  ]);
  return { payments, transactions, registers, movements };
}

export function useLiveClosetData() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["closet-live-operations", user?.id],
    queryFn: loadLiveClosetData,
    enabled: Boolean(user?.id),
    staleTime: 15000,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

export function useLiveFinanceData() {
  const { user } = useAuth();
  const canRead = PermissionManager.hasPermission("financial", "read");
  const query = useQuery({
    queryKey: ["closet-live-finance", user?.id],
    queryFn: loadLiveFinanceData,
    enabled: Boolean(user?.id) && canRead,
    staleTime: 15000,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
  return { ...query, canRead };
}

export const moneyBRL = (amount: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
export const dayBR = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");
export const dateTimeBR = (iso: string) => new Date(iso).toLocaleString("pt-BR");
