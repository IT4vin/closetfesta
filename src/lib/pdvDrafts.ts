import { supabase } from "@/integrations/supabase/client";

const db=supabase as any;
export interface PDVDraftPayload {
  version:1;
  items:Array<{product_id:string;quantity:number;discount:number}>;
  customer_id:string|null;
  dates:{tryOnDate:string;pickupDate:string;eventDate:string;returnDate:string};
  observations:string;
  global_discount:number;
  global_discount_type:"amount"|"percentage";
}
export interface PDVDraftRecord { payload:PDVDraftPayload; updated_at:string; }
async function operatorId(){
  const {data,error}=await supabase.auth.getUser();
  if(error||!data.user)throw new Error("Sua sessão expirou. Entre novamente para salvar o atendimento.");
  return data.user.id;
}
export function validDraftPayload(source:unknown):source is PDVDraftPayload {
  if(!source||typeof source!=="object")return false;
  const v=source as PDVDraftPayload;
  const dates=v.dates as any;
  return v.version===1 && Array.isArray(v.items) && v.items.length<=60
    && v.items.every(i=>typeof i.product_id==="string" && /^[0-9a-f-]{36}$/i.test(i.product_id)
      && Number.isInteger(i.quantity) && i.quantity>=1 && i.quantity<=1000
      && Number.isFinite(i.discount) && i.discount>=0)
    && (v.customer_id===null||typeof v.customer_id==="string")
    && dates && ["tryOnDate","pickupDate","eventDate","returnDate"].every(k=>
      typeof dates[k]==="string" && (dates[k]===""||/^\d{4}-\d{2}-\d{2}$/.test(dates[k])))
    && typeof v.observations==="string" && v.observations.length<=3000
    && Number.isFinite(v.global_discount) && v.global_discount>=0
    && ["amount","percentage"].includes(v.global_discount_type);
}
export async function savePDVDraft(payload:PDVDraftPayload):Promise<void>{
  if(!validDraftPayload(payload))throw new Error("Dados do rascunho inválidos.");
  const owner_id=await operatorId();
  const {data,error}=await db.from("pdv_drafts").upsert({
    owner_id,payload,updated_at:new Date().toISOString(),
  },{onConflict:"owner_id"}).select("id").single();
  if(error||!data?.id)throw new Error(error?.message??"O banco não confirmou o rascunho.");
}
export async function loadPDVDraft():Promise<PDVDraftRecord|null>{
  const owner=await operatorId();
  const {data,error}=await db.from("pdv_drafts")
    .select("payload,updated_at").eq("owner_id",owner).maybeSingle();
  if(error)throw new Error(error.message);
  if(!data)return null;
  if(!validDraftPayload(data.payload))throw new Error("Rascunho incompatível: não foi restaurado.");
  return data as PDVDraftRecord;
}
export async function deletePDVDraft():Promise<void>{
  const owner=await operatorId();
  const {error}=await db.from("pdv_drafts").delete().eq("owner_id",owner);
  if(error)throw new Error(error.message);
}
