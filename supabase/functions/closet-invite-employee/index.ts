// Invites a new employee using the *server-side* Supabase Auth Admin API.
// No secret/service-role key ever reaches the PDV browser.
// Official Supabase Edge auth wrapper validates the caller's JWT.
import { withSupabase } from "npm:@supabase/server@1";

const productionOrigin = "https://closet-festa-administrativo.onrender.com";
const corsHeaders = {
  "Access-Control-Allow-Origin": productionOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};
const respond = (data:unknown,status=200) =>
  new Response(JSON.stringify(data),{status,headers:corsHeaders});

const handler=withSupabase({auth:"user"},async(req,ctx)=>{
  if(req.method!=="POST")return respond({error:"Método não permitido."},405);
  const actor=ctx.userClaims?.id;
  if(!actor)return respond({error:"Sessão não autenticada."},401);

  // Check permission against the real table and the *authenticated* caller;
  // never trust body fields, user_metadata or any app-side role claim.
  const {data:roles,error:roleError}=await ctx.supabase
    .from("user_roles").select("role").eq("user_id",actor)
    .eq("role","admin").limit(1);
  if(roleError||!roles?.length)
    return respond({error:"Somente administradores podem convidar funcionários."},403);

  let body:Record<string,unknown>;
  try {
    const raw=await req.text();
    if(raw.length>6000)return respond({error:"Dados excedem o limite permitido."},400);
    body=JSON.parse(raw);
  } catch {return respond({error:"Dados inválidos."},400);}
  if(!body||Array.isArray(body)||typeof body!=="object")
    return respond({error:"Dados inválidos."},400);

  const name=String(body.full_name??"").trim();
  const email=String(body.email??"").trim().toLowerCase();
  const phone=String(body.phone??"").replace(/\D/g,"");
  const role=String(body.role??"");
  const department=String(body.department??"").trim();
  const jobTitle=String(body.job_title??"").trim();
  const hiredOn=body.hired_on?String(body.hired_on):null;

  if(name.length<2||name.length>140||
     email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||
     !["staff","cashier","manager"].includes(role)||
     (phone.length>0&&!([10,11].includes(phone.length)))||
     department.length>100||jobTitle.length>100||
     (hiredOn!==null&&!/^\d{4}-\d{2}-\d{2}$/.test(hiredOn)))
   return respond({error:"Confira nome, e-mail, contato, cargo e perfil de acesso."},400);

  const invited=await ctx.supabaseAdmin.auth.admin.inviteUserByEmail(email,{
    data:{full_name:name},
    redirectTo:productionOrigin+"/accept-invite",
  });
  if(invited.error||!invited.data?.user?.id){
    const detail=invited.error?.message??"Convite não confirmado pelo Supabase Auth.";
    return respond({error:detail},409);
  }
  const userId=invited.data.user.id;

  // Each RPC validates that the *caller* is admin and creates a durable audit.
  // A failed step leaves an invited user with no access (fail closed),
  // and the administrator can finish configuration from the employee list.
  const assigned=await ctx.supabase.rpc("closet_assign_user_role",{
    p_target:userId,p_role:role,
  });
  if(assigned.error){
    return respond({error:"Convite enviado, mas o perfil não foi liberado. Abra o funcionário em Configurações para concluir: "+assigned.error.message,
      user_id:userId,partial:true},500);
  }
  const profile=await ctx.supabase.rpc("closet_employee_update",{
    p_target:userId,p_full_name:name,p_phone:phone||null,
    p_department:department||null,p_job_title:jobTitle||null,
    p_hired_on:hiredOn,
  });
  if(profile.error){
    return respond({error:"Convite enviado e perfil definido; complete os dados do funcionário no cadastro: "+profile.error.message,
      user_id:userId,partial:true},500);
  }
  return respond({invited:true,user_id:userId,email,
    message:"Convite enviado ao e-mail. O funcionário deverá definir sua própria senha."});
});

export default {
  fetch:(req:Request)=>{
    if(req.method==="OPTIONS"){
      return new Response(null,{status:204,headers:corsHeaders});
    }
    return handler(req);
  },
};
