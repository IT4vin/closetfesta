import React,{useEffect,useState} from "react";
import {Button} from "@/components/ui/button";
import {Card,CardContent,CardDescription,CardHeader,CardTitle} from "@/components/ui/card";
import {useAuth} from "@/stores/authStore";
import {supabase} from "@/integrations/supabase/client";
type Member={id:string;full_name:string|null;email:string|null;role:string};
type RoleHistory={id:string;actor_id:string;target_id:string;previous_roles:string[];new_role:string|null;changed_at:string};
const roleLabels:Record<string,string>={
  admin:"Administrador",manager:"Gerente",staff:"Atendimento",cashier:"Caixa",inactive:"Sem acesso",
};
export default function UserAccessSettings(){
  const {user}=useAuth();
  const admin=user?.role.id==="admin";
  const [members,setMembers]=useState<Member[]>([]);
  const [history,setHistory]=useState<RoleHistory[]>([]);
  const [loading,setLoading]=useState(Boolean(admin));
  const [busy,setBusy]=useState("");
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const load=async()=>{
    if(!admin)return;
    setLoading(true);setError("");
    try{
      const [profilesResult,rolesResult,auditResult]=await Promise.all([
        supabase.from("profiles").select("id,full_name,email").order("full_name"),
        supabase.from("user_roles").select("user_id,role"),
        (supabase as any).from("closet_role_audit")
          .select("id,actor_id,target_id,previous_roles,new_role,changed_at")
          .order("changed_at",{ascending:false}).limit(30),
      ]);
      if(profilesResult.error||rolesResult.error||auditResult.error)
        throw new Error(profilesResult.error?.message||rolesResult.error?.message||auditResult.error?.message);
      const byId=new Map((rolesResult.data??[]).map(r=>[r.user_id,r.role]));
      setMembers((profilesResult.data??[]).map(p=>({...p,role:byId.get(p.id)??"inactive"})));
      setHistory(auditResult.data??[]);
    }catch(cause){setError(cause instanceof Error?cause.message:"Falha ao carregar usuários");}
    finally{setLoading(false);}
  };
  useEffect(()=>{void load();},[admin]);
  const setRole=async(target:Member,nextRole:string)=>{
    if(!admin||target.id===user?.id||busy)return;
    if(!window.confirm("Alterar o perfil de "+(target.full_name||target.email||"este usuário")+
      " para "+roleLabels[nextRole]+"? Essa mudança afeta o acesso ao sistema."))return;
    setBusy(target.id);setError("");setMessage("");
    try{
      const result=await (supabase as any).rpc("closet_assign_user_role",{
        p_target:target.id,p_role:nextRole==="inactive"?null:nextRole,
      });
      if(result.error)throw new Error(result.error.message);
      setMessage("Perfil alterado e registrado no histórico de auditoria.");
      await load();
    }catch(cause){setError(cause instanceof Error?cause.message:"Não foi possível alterar permissão.");}
    finally{setBusy("");}
  };
  return <div className="space-y-4">
    <Card><CardHeader><CardTitle>Perfil de acesso</CardTitle>
      <CardDescription>Dados da sessão autenticada e perfis cadastrados no Supabase.</CardDescription>
    </CardHeader><CardContent className="space-y-2 text-sm">
      <p><strong>Usuário:</strong> {user?.full_name??"Não identificado"}</p>
      <p><strong>E-mail:</strong> {user?.email??"Não informado"}</p>
      <p><strong>Perfil:</strong> {user?.role.name??"Não identificado"}</p>
      <p className="text-xs text-muted-foreground">Alterações de perfil são aplicadas no servidor. O próprio administrador não pode remover seu próprio acesso.</p>
    </CardContent></Card>
    {admin&&<Card><CardHeader><CardTitle>Gerenciar usuários existentes</CardTitle>
      <CardDescription>Altere funções de usuários já cadastrados. Novos usuários devem ser convidados pelo fluxo seguro de autenticação do Supabase.</CardDescription>
    </CardHeader><CardContent className="space-y-3">
      {loading&&<p className="text-sm">Carregando usuários reais...</p>}
      {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
      {message&&<p role="status" className="text-sm text-green-700">{message}</p>}
      {members.map(member=><div key={member.id} className="flex flex-col justify-between gap-3 rounded-lg border p-3 sm:flex-row sm:items-center">
        <div><strong className="text-sm">{member.full_name||"Sem nome informado"}</strong>
          <p className="text-xs text-muted-foreground">{member.email||"Sem e-mail"}</p>
        </div>
        <select aria-label={"Perfil de "+(member.full_name||member.email)}
          value={member.role} disabled={Boolean(busy)||member.id===user?.id}
          onChange={e=>void setRole(member,e.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm">
          {Object.entries(roleLabels).map(([value,label])=>
            <option key={value} value={value}>{label}</option>)}
        </select>
      </div>)}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Funções disponíveis: administrador, gerente, atendimento e caixa.</span>
        <Button variant="outline" size="sm" disabled={Boolean(busy)||loading}
          onClick={()=>void load()}>Atualizar</Button>
      </div>
      <p className="text-xs text-muted-foreground">Permissões individuais por ação e convites automáticos exigem ampliação do controle de acesso em todos os módulos. Não há alterações simuladas.</p>
    </CardContent></Card>}
    {admin&&history.length>0&&<Card><CardHeader><CardTitle className="text-base">Histórico de alterações de perfil</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {history.map(record=><div className="rounded-md border p-3 text-xs" key={record.id}>
          <span>{new Date(record.changed_at).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"})}</span>
          <p className="mt-1">Usuário: {members.find(m=>m.id===record.target_id)?.full_name||record.target_id}</p>
          <p>{record.previous_roles.join(", ")||"Sem acesso"} → {record.new_role||"Sem acesso"}</p>
        </div>)}
      </CardContent></Card>}
  </div>;
}
