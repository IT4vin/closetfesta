import { supabase } from "@/integrations/supabase/client";

export interface ClientRegistration {
  full_name:string;
  phone:string;
  secondary_phone:string;
  email:string;
  document:string;
  birth_date:string;
  acquisition_source:string;
  notes:string;
  cep:string;
  street:string;
  number:string;
  complement:string;
  neighborhood:string;
  city:string;
  state:string;
  bust:string;
  waist:string;
  hips:string;
  height:string;
}
export const blankClientRegistration=():ClientRegistration=>({
  full_name:"",phone:"",secondary_phone:"",email:"",document:"",
  birth_date:"",acquisition_source:"",notes:"",cep:"",street:"",number:"",
  complement:"",neighborhood:"",city:"",state:"",
  bust:"",waist:"",hips:"",height:"",
});
export const clientDigits=(value:string)=>value.replace(/\D/g,"");
export function validateClientRegistration(data:ClientRegistration):string|null {
  if(data.full_name.trim().length<2||data.full_name.trim().length>160)
    return "Informe o nome completo do cliente (2 a 160 caracteres).";
  if(data.phone&&![10,11].includes(clientDigits(data.phone).length))
    return "O telefone principal deve ter DDD e 10 ou 11 dígitos.";
  if(data.secondary_phone&&![10,11].includes(clientDigits(data.secondary_phone).length))
    return "O telefone alternativo deve ter DDD e 10 ou 11 dígitos.";
  if(data.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
    return "E-mail inválido.";
  if(data.document&&![11,14].includes(clientDigits(data.document).length))
    return "Informe um CPF com 11 dígitos ou CNPJ com 14 dígitos.";
  if(data.birth_date){
    const d=new Date(data.birth_date+"T12:00:00");
    if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==data.birth_date||
      d.getTime()>Date.now()||d.getFullYear()<1900)
      return "Data de nascimento inválida.";
  }
  if(data.cep&&clientDigits(data.cep).length!==8)return "O CEP deve ter 8 dígitos.";
  if(data.state&&data.state.trim().length!==2)return "Use a sigla da UF com 2 letras.";
  if(data.notes.length>3000)return "As observações devem ter até 3.000 caracteres.";
  for(const key of ["bust","waist","hips","height"] as const){
    const raw=data[key].trim().replace(",",".");
    if(raw&&!/^[0-9]+(?:\.[0-9]{1,2})?$/.test(raw))
      return "Informe as medidas em centímetros, apenas números positivos.";
    if(raw&&(Number(raw)<=0||Number(raw)>300))
      return "Medida fora da faixa de 0 a 300 cm.";
  }
  return null;
}
export function clientInsertPayload(data:ClientRegistration){
  const address={
    cep:clientDigits(data.cep),street:data.street.trim(),number:data.number.trim(),
    complement:data.complement.trim(),neighborhood:data.neighborhood.trim(),
    city:data.city.trim(),state:data.state.trim().toUpperCase(),
  };
  const measurements=Object.fromEntries(
    (["bust","waist","hips","height"] as const)
      .filter(key=>data[key].trim())
      .map(key=>[key,Number(data[key].replace(",","."))])
  );
  return {
    full_name:data.full_name.trim(),
    phone:clientDigits(data.phone)||null,
    secondary_phone:clientDigits(data.secondary_phone)||null,
    email:data.email.trim().toLowerCase()||null,
    document:clientDigits(data.document)||null,
    birth_date:data.birth_date||null,
    acquisition_source:data.acquisition_source.trim()||null,
    notes:data.notes.trim()||null,
    address:Object.values(address).some(Boolean)?address:null,
    measurements,
  };
}
export async function createRegisteredClient(data:ClientRegistration){
  const reason=validateClientRegistration(data);
  if(reason)throw new Error(reason);
  const payload=clientInsertPayload(data);
  if(payload.document){
    // Evita confundir um cadastro existente com novo titular de contrato.
    const db=supabase as any;
    const {data:existing,error:lookupError}=await db.from("clients")
      .select("id,document").eq("document",payload.document).limit(1);
    if(lookupError)throw new Error(lookupError.message);
    if(existing?.length)throw new Error("Já existe cliente cadastrado com este CPF/CNPJ. Pesquise antes de criar outro.");
  }
  const {data:saved,error}=await (supabase as any).from("clients")
    .insert(payload).select("id,full_name,document,phone").single();
  if(error||!saved?.id)throw new Error(error?.message||"O Supabase não confirmou o cadastro.");
  return {id:String(saved.id),name:String(saved.full_name),
    document:String(saved.document||""),phone:String(saved.phone||"")};
}
