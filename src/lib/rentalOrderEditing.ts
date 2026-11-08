import { supabase } from "@/integrations/supabase/client";

export type OrderEditAction =
  | "client" | "client_reassign" | "notes" | "item_dates"
  | "add_item" | "replace_item" | "remove_item" | "item_discount"
  | "item_price" | "order_discount" | "reverse_payment" | "cancel_contract";

export async function editRentalOrder(args:{
  contractId:string;
  action:OrderEditAction;
  data:Record<string,unknown>;
  reason:string;
  requestId:string;
}) {
  if(!args.contractId||!args.requestId||!args.action||args.reason.trim().length<3) {
    throw new Error("Informe a justificativa e os dados da alteração.");
  }
  const {data,error}=await (supabase as any).rpc("rental_order_edit",{
    p_contract_id:args.contractId,
    p_action:args.action,
    p_data:args.data,
    p_reason:args.reason.trim(),
    p_request_id:args.requestId,
  });
  if(error)throw new Error(error.message);
  if(!data?.id)throw new Error("O banco não confirmou a alteração. Consulte o histórico antes de tentar novamente.");
  return data as {id:string;already_exists:boolean;action?:string;result?:unknown};
}
export interface AuditEntry {
  id:string;action:OrderEditAction;reason:string;created_at:string;
  actor_id:string;
}
export async function loadRentalOrderAudit(id:string):Promise<AuditEntry[]> {
  const {data,error}=await (supabase as any).from("rental_order_audit")
    .select("id,action,reason,actor_id,created_at")
    .eq("contract_id",id).order("created_at",{ascending:false}).limit(100);
  if(error)throw new Error(error.message);
  return (data??[]) as AuditEntry[];
}
