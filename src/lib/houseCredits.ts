import { supabase } from "@/integrations/supabase/client";

const db=supabase as any;
export type CreditKind="adjustment"|"transfer_in"|"transfer_out"|"cancellation_credit"|"redemption";
export interface CreditEntry {
  id:string;delta:number;kind:CreditKind;related_client_id:string|null;
  related_client_name:string|null;source_contract_id:string|null;
  contract_number:number|null;note:string;created_by:string;created_at:string;
}
export interface CreditStatement {
  client_id:string;client_name:string;balance:number;total_entries:number;entries:CreditEntry[];
}
export interface CreditUsage {
  contract_id:string;client_id:string;status:string;
  total:number;cash_paid:number;credit_applied:number;remaining:number;
}
export const moneyCredit=(value:number)=>new Intl.NumberFormat("pt-BR",{
  style:"currency",currency:"BRL",
}).format(Number(value)||0);
const uuid=/^[a-f0-9]{8}-[a-f0-9-]{27,}$/i;
export const positiveMoney=(n:number)=>Number.isFinite(n)&&n>0&&n<=1000000&&
  Math.abs(n*100-Math.round(n*100))<0.0001;

export async function getCreditStatement(clientId:string,page=0):Promise<CreditStatement>{
  if(!uuid.test(clientId)||!Number.isInteger(page)||page<0)throw new Error("Cliente inválido.");
  const {data,error}=await db.rpc("credit_client_statement",{
    p_client:clientId,p_limit:30,p_offset:page*30,
  });
  if(error)throw new Error(error.message);
  if(!data||!Array.isArray(data.entries)||data.client_id!==clientId||
     !Number.isFinite(Number(data.balance)))throw new Error("O saldo não foi confirmado pelo banco.");
  return data as CreditStatement;
}
export async function getCreditUsage(contractId:string):Promise<CreditUsage>{
  if(!uuid.test(contractId))throw new Error("Pedido inválido.");
  const {data,error}=await db.rpc("credit_contract_usage",{p_contract:contractId});
  if(error)throw new Error(error.message);
  if(!data||data.contract_id!==contractId||
    !Number.isFinite(Number(data.remaining)))throw new Error("Saldo do contrato não confirmado.");
  return data as CreditUsage;
}
export async function transferHouseCredit(args:{
  from:string;to:string;amount:number;reason:string;
  authorizationReference:string;operationId:string;
}):Promise<string>{
  if(!uuid.test(args.from)||!uuid.test(args.to)||args.from===args.to||
    !uuid.test(args.operationId)||!positiveMoney(args.amount)||
    args.reason.trim().length<3||args.authorizationReference.trim().length<10){
    throw new Error("Cliente de destino, valor e autorização devem ser informados.");
  }
  const {data,error}=await db.rpc("credit_transfer_authorized",{
    p_from:args.from,p_to:args.to,p_amount:args.amount,
    p_reason:args.reason.trim(),
    p_authorization_reference:args.authorizationReference.trim(),
    p_confirmed:true,p_operation:args.operationId,
  });
  if(error)throw new Error(error.message);
  if(data!==args.operationId)throw new Error("O banco não confirmou a transferência.");
  return data;
}
export async function redeemHouseCredit(args:{
  contractId:string;amount:number;reason:string;operationId:string;
}):Promise<{id:string;amount:number;remaining:number;already_exists:boolean}>{
  if(!uuid.test(args.contractId)||!uuid.test(args.operationId)||
    !positiveMoney(args.amount)||args.reason.trim().length<3)
    throw new Error("Pedido, valor ou justificativa inválidos.");
  const {data,error}=await db.rpc("credit_redeem_for_contract",{
    p_contract:args.contractId,p_amount:args.amount,
    p_reason:args.reason.trim(),p_operation:args.operationId,
  });
  if(error)throw new Error(error.message);
  if(!data?.id||Number(data.amount)!==args.amount)
    throw new Error("O banco não confirmou o uso do crédito.");
  return data;
}
