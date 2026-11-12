import {supabase} from "@/integrations/supabase/client";
import {ROLE_LABELS,type AppRole} from "@/lib/accessControl";

export type EmployeeRole=Exclude<AppRole,"viewer">|"inactive";
export interface EmployeeRow {
 id:string;full_name:string;email:string;login_email?:string|null;username?:string|null;phone:string|null;
 role:EmployeeRole;email_confirmed:boolean;created_at:string;
 department:string|null;job_title:string|null;hired_on:string|null;
}
export type EmployeeDraft={
 full_name:string;email:string;phone:string;role:EmployeeRole;
 department:string;job_title:string;hired_on:string;
};
export const newEmployeeDraft=():EmployeeDraft=>({
 full_name:"",email:"",phone:"",role:"staff",
 department:"",job_title:"",hired_on:"",
});
export const employeeRoleLabels:Record<EmployeeRole,string>={
 admin:ROLE_LABELS.admin,manager:ROLE_LABELS.manager,
 staff:ROLE_LABELS.staff,cashier:ROLE_LABELS.cashier,
 inactive:"Sem acesso",
};
export const employeeRoleDetails:Record<EmployeeRole,string>={
 admin:"Administra a loja, usuários, permissões, financeiro e controle de ponto.",
 manager:"Gerencia operação, pagamentos e controle de ponto, sem criar administradores.",
 staff:"Atendimento e locações, consulta de clientes, agenda e marcação de ponto.",
 cashier:"Frente de caixa, recebimentos e marcação de ponto.",
 inactive:"O login não recebe permissão para acessar o sistema. O histórico permanece.",
};
export function validateEmployeeDraft(data:EmployeeDraft,invite:boolean){
 if(data.full_name.trim().length<2||data.full_name.trim().length>140)
   return "Informe o nome completo (2 a 140 caracteres).";
 if(invite&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
   return "Informe um e-mail de acesso válido.";
 if(invite&&data.role==="inactive")
   return "Selecione um perfil para convidar o funcionário.";
 if(invite&&data.role==="admin")
   return "Por segurança, novos administradores são promovidos após convite e conferência do cadastro.";
 if(data.phone&&![10,11].includes(data.phone.replace(/\D/g,"").length))
   return "O telefone deve conter DDD e 10 ou 11 dígitos.";
 if(data.job_title.trim().length>100||data.department.trim().length>100)
   return "Cargo e setor devem ter até 100 caracteres.";
 if(data.hired_on){
   const date=new Date(data.hired_on+"T12:00:00Z");
   if(!/^\d{4}-\d{2}-\d{2}$/.test(data.hired_on)||
       Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==data.hired_on)
     return "Informe uma data de admissão válida.";
 }
 return null;
}
function reason(error:unknown,defaultMessage:string){
 return error instanceof Error?error.message:defaultMessage;
}
export async function listEmployees():Promise<EmployeeRow[]>{
 const {data,error}=await (supabase as any).rpc("closet_employee_directory");
 if(error)throw new Error(error.message);
 if(!Array.isArray(data))throw new Error("O servidor retornou uma lista de funcionários inválida.");
 return data as EmployeeRow[];
}
export async function updateEmployee(target:string,draft:EmployeeDraft){
 const issue=validateEmployeeDraft(draft,false);
 if(issue)throw new Error(issue);
 const {data,error}=await (supabase as any).rpc("closet_employee_update",{
  p_target:target,p_full_name:draft.full_name.trim(),p_phone:draft.phone.trim(),
  p_department:draft.department.trim(),p_job_title:draft.job_title.trim(),
  p_hired_on:draft.hired_on||null,
 });
 if(error||!data?.saved)throw new Error(error?.message||"O servidor não confirmou a alteração.");
 return data;
}
export async function changeEmployeeRole(target:string,newRole:EmployeeRole){
 const {error}=await (supabase as any).rpc("closet_assign_user_role",{
  p_target:target,p_role:newRole==="inactive"?null:newRole,
 });
 if(error)throw new Error(error.message);
}
export async function inviteEmployee(draft:EmployeeDraft){
 const issue=validateEmployeeDraft(draft,true);
 if(issue)throw new Error(issue);
 const {data,error}=await supabase.functions.invoke("closet-invite-employee",{
  body:{
    full_name:draft.full_name.trim(),email:draft.email.trim().toLowerCase(),
    phone:draft.phone.trim(),role:draft.role,
    department:draft.department.trim(),job_title:draft.job_title.trim(),
    hired_on:draft.hired_on||null,
  },
 });
 if(error){
  // FunctionsHttpError includes a Response containing the safe error message
  // emitted by the server. No token or personal data is logged.
  let detail="";
  const ctx=(error as any).context;
  if(ctx&&typeof ctx.json==="function"){
    try{const body=await ctx.json();detail=String(body?.error||"");}catch{}
  }
  throw new Error(detail||reason(error,"Falha ao convidar funcionário."));
 }
 if(!data?.invited||!data?.user_id)
   throw new Error(data?.error||"O convite não foi confirmado pelo Supabase.");
 return data as {invited:true;user_id:string;email:string;message:string};
}


/**
 * Senha de acesso individual: validacao apenas de UX. A Edge Function
 * revalida a mesma regra e confere papel admin no banco.
 */
export function validateEmployeePassword(password:string):string|null{
 if(password.length<12||password.length>72||
    new TextEncoder().encode(password).byteLength>72)
   return "A senha deve ter de 12 a 72 caracteres.";
 if(!/\p{L}/u.test(password)||!/\d/u.test(password))
   return "Combine letras e números na nova senha.";
 return null;
}

/**
 * Verificacao somente-leitura: a funcao deve devolver HTTP 405 para GET
 * quando estiver implantada (nao ha alteracao de senha neste teste).
 * 404 => endpoint ausente; outros erros => nao habilitar a interface.
 */
export async function checkEmployeePasswordService():Promise<boolean>{
 try{
  const {error}=await supabase.functions.invoke("closet-admin-set-employee-password",{
   method:"GET",
  });
  // GET nunca e considerado sucesso pelo endpoint: exigir o 405 esperado.
  return (error as any)?.context?.status===405;
 }catch{
  return false;
 }
}

export async function setEmployeePassword(target:string,password:string):Promise<{
 updated:true;user_id:string;audit_confirmed:boolean;message:string;
}>{
 const issue=validateEmployeePassword(password);
 if(issue)throw new Error(issue);
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target))
   throw new Error("Funcionário inválido.");
 const {data,error}=await supabase.functions.invoke(
   "closet-admin-set-employee-password",{
     body:{target_id:target,password},
   });
 if(error){
   const ctx=(error as any).context;
   let detail="";
   if(ctx&&typeof ctx.json==="function"){
     try{
       const body=await ctx.json();
       detail=typeof body?.error==="string"?body.error:"";
     }catch{}
   }
   throw new Error(detail||"Não foi possível definir a senha no servidor.");
 }
 if(data?.updated!==true||data?.user_id!==target)
   throw new Error("O servidor não confirmou a alteração da senha.");
 return data as {updated:true;user_id:string;audit_confirmed:boolean;message:string};
}


/** Login interno e credenciais são criados exclusivamente na Edge Function autorizada. */
export function validateEmployeeUsername(username:string):string|null {
 return /^[a-z0-9][a-z0-9._-]{2,31}$/.test(username.trim().toLowerCase())
   ? null : "O usuário deve ter de 3 a 32 caracteres: letras, números, ponto, hífen ou underline.";
}
async function invokeEmployeeCredentials(body:Record<string,unknown>){
 const {data,error}=await supabase.functions.invoke("closet-admin-manage-employee",{body});
 if(error){
  let detail="";
  const ctx=(error as any).context;
  if(ctx&&typeof ctx.json==="function"){
   try{const result=await ctx.json();detail=String(result?.error||"");}catch{}
  }
  throw new Error(detail||reason(error,"Falha na operação de credenciais."));
 }
 if(data?.error)throw new Error(String(data.error));
 return data;
}
export async function createEmployeeWithCredentials(draft:EmployeeDraft,username:string,password:string){
 const problem=validateEmployeeDraft(draft,false)||
   validateEmployeeUsername(username)||validateEmployeePassword(password);
 if(problem)throw new Error(problem);
 const contactEmail=draft.email.trim().toLowerCase();
 if(contactEmail&&!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(contactEmail)){
  throw new Error("Informe um e-mail de contato válido ou deixe em branco.");
 }
 if(draft.role==="admin"||draft.role==="inactive"){
  throw new Error("Selecione um perfil operacional para o novo funcionário.");
 }
 const data=await invokeEmployeeCredentials({
  action:"create",full_name:draft.full_name.trim(),
  username:username.trim().toLowerCase(),password,
  contact_email:contactEmail,role:draft.role,phone:draft.phone.trim(),
  department:draft.department.trim(),job_title:draft.job_title.trim(),
  hired_on:draft.hired_on||null,
 });
 if(data?.created!==true||typeof data?.user_id!=="string")
  throw new Error("O Supabase não confirmou a criação do usuário.");
 return data as {created:true;user_id:string;username:string;message:string};
}
export async function setEmployeeUsername(target:string,username:string){
 const problem=validateEmployeeUsername(username);
 if(problem)throw new Error(problem);
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target))
  throw new Error("Funcionário inválido.");
 const data=await invokeEmployeeCredentials({
  action:"set_username",target_id:target,username:username.trim().toLowerCase(),
 });
 if(data?.updated!==true)throw new Error("O Supabase não confirmou a alteração do usuário.");
 return data as {updated:true;username:string;audit_confirmed:boolean;message:string};
}
