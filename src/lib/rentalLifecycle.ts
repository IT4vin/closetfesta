import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

// A operação exige migration aplicada e RLS devidamente revisada.
async function executeRentalRpc(name: string, params: Record<string, unknown>): Promise<string> {
  const { data, error } = await db.rpc(name, params);
  if (error) {
    if (error.code === "42883" || error.code === "PGRST202") {
      throw new Error("Operação indisponível: a migration do banco ainda não foi aplicada.");
    }
    throw new Error(error.message);
  }
  if (!data?.id) throw new Error("O banco não confirmou a operação solicitada.");
  return data.id as string;
}

export async function confirmRentalPickup(itemId: string): Promise<string> {
  if (!itemId) throw new Error("Identifique o traje antes de registrar a retirada.");
  return executeRentalRpc("rental_confirm_pickup", { p_item_id: itemId });
}

export async function confirmRentalReturn(itemId: string, notes?: string): Promise<string> {
  if (!itemId) throw new Error("Identifique o traje antes de registrar a devolução.");
  if ((notes ?? "").length > 2000) throw new Error("Observações excedem 2.000 caracteres.");
  return executeRentalRpc("rental_confirm_return", { p_item_id: itemId, p_notes: notes?.trim() || null });
}

export async function recordRentalPayment(input: {
  contractId: string;
  requestId: string;
  method: "cash" | "credit" | "debit" | "pix" | "transfer";
  amount: number;
  installments?: number;
}): Promise<string> {
  if (!input.contractId || !input.requestId) throw new Error("Identificador de contrato e chave de confirmação obrigatórios.");
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("O pagamento deve ser positivo.");
  const installments = input.installments ?? 1;
  if (!Number.isInteger(installments) || installments < 1 || installments > 24) {
    throw new Error("Parcelamento inválido.");
  }
  return executeRentalRpc("rental_record_payment", {
    p_contract_id: input.contractId,
    p_request_id: input.requestId,
    p_method: input.method,
    p_amount: input.amount,
    p_installments: installments,
  });
}
