import React,{useEffect,useState} from "react";
import {supabase} from "@/integrations/supabase/client";
import {useAuth} from "@/stores/authStore";
import {Button} from "@/components/ui/button";
import {Card,CardContent,CardHeader,CardTitle,CardDescription} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";

export default function CurrentUserProfileEditor(){
  const {user}=useAuth();
  const [name,setName]=useState("");
  const [phone,setPhone]=useState("");
  const [email,setEmail]=useState("");
  const [currentPassword,setCurrentPassword]=useState("");
  const [newPassword,setNewPassword]=useState("");
  const [confirmPassword,setConfirmPassword]=useState("");
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  useEffect(()=>{
    if(!user?.id)return;
    let active=true;
    setEmail(user.email);
    void supabase.from("profiles").select("full_name,phone").eq("id",user.id).maybeSingle()
      .then(result=>{
        if(!active)return;
        if(result.error)setError("Erro ao carregar perfil: "+result.error.message);
        else {setName(result.data?.full_name||user.full_name||"");setPhone(result.data?.phone||"");}
        setLoading(false);
      });
    return()=>{active=false;};
  },[user?.id]);

  const saveProfile=async()=>{
    if(!user?.id||busy)return;
    if(name.trim().length<2){setError("Informe um nome com pelo menos duas letras.");return;}
    setBusy(true);setError("");setSuccess("");
    try{
      const {data,error:updateError}=await supabase.from("profiles")
        .update({full_name:name.trim(),phone:phone.trim()||null,updated_at:new Date().toISOString()})
        .eq("id",user.id).select("id").single();
      if(updateError||!data)throw new Error(updateError?.message||"O banco não confirmou a alteração.");
      setSuccess("Dados pessoais salvos no Supabase. O nome exibido no menu será atualizado após recarregar a sessão.");
    }catch(cause){setError(cause instanceof Error?cause.message:"Falha ao salvar perfil.");}
    finally{setBusy(false);}
  };

  const updateEmail=async()=>{
    if(!user?.id||busy||email.trim().toLowerCase()===user.email.toLowerCase())return;
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setError("Informe um e-mail válido.");return;}
    if(!window.confirm("Solicitar alteração do e-mail de acesso? Poderá ser necessário confirmar o novo endereço."))return;
    setBusy(true);setError("");setSuccess("");
    try{
      const {error:changeError}=await supabase.auth.updateUser({email:email.trim().toLowerCase()});
      if(changeError)throw new Error(changeError.message);
      setSuccess("Solicitação registrada. Siga as instruções de confirmação enviadas pelo Supabase.");
    }catch(cause){setError(cause instanceof Error?cause.message:"Falha ao solicitar mudança de e-mail.");}
    finally{setBusy(false);}
  };

  const changePassword=async()=>{
    if(!user?.email||busy)return;
    if(newPassword.length<8){setError("A nova senha precisa ter pelo menos 8 caracteres.");return;}
    if(newPassword!==confirmPassword){setError("A confirmação da nova senha não coincide.");return;}
    if(!currentPassword){setError("Informe sua senha atual.");return;}
    setBusy(true);setError("");setSuccess("");
    try{
      const {error:loginError}=await supabase.auth.signInWithPassword({email:user.email,password:currentPassword});
      if(loginError)throw new Error("Senha atual incorreta ou sessão não autorizada.");
      const {error:passError}=await supabase.auth.updateUser({password:newPassword});
      if(passError)throw new Error(passError.message);
      setCurrentPassword("");setNewPassword("");setConfirmPassword("");
      setSuccess("Senha alterada pelo Supabase Auth. Use a nova senha no próximo acesso.");
    }catch(cause){setError(cause instanceof Error?cause.message:"Não foi possível alterar a senha.");}
    finally{setBusy(false);}
  };

  if(!user)return <Card><CardContent className="p-5 text-sm">Entre no sistema para editar seus dados.</CardContent></Card>;
  return <div className="space-y-4">
    <Card><CardHeader><CardTitle className="text-base">Meu perfil</CardTitle>
      <CardDescription>Dados reais do usuário autenticado, independentemente do perfil de acesso.</CardDescription>
    </CardHeader><CardContent className="space-y-4">
      {loading&&<p className="text-sm text-muted-foreground">Buscando seus dados...</p>}
      {error&&<p className="text-sm text-red-700" role="alert">{error}</p>}
      {success&&<p className="text-sm text-green-700" role="status">{success}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="profile-name">Nome completo</Label>
          <Input id="profile-name" value={name} onChange={e=>setName(e.target.value)} disabled={busy||loading}/></div>
        <div className="space-y-2"><Label htmlFor="profile-phone">Telefone</Label>
          <Input id="profile-phone" value={phone} onChange={e=>setPhone(e.target.value)} disabled={busy||loading}/></div>
      </div>
      <div className="flex justify-end"><Button disabled={busy||loading} className="bg-marsala-600 hover:bg-marsala-700"
        onClick={()=>void saveProfile()}>Salvar meus dados</Button></div>
      <div className="space-y-2 border-t pt-4"><Label htmlFor="profile-email">E-mail de acesso</Label>
        <div className="flex flex-wrap gap-2"><Input id="profile-email" type="email" className="min-w-56 flex-1"
          value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/>
          <Button variant="outline" disabled={busy||email.trim().toLowerCase()===user.email.toLowerCase()}
            onClick={()=>void updateEmail()}>Solicitar alteração</Button></div>
        <p className="text-xs text-muted-foreground">Alterações de e-mail podem exigir confirmação antes de entrar em vigor.</p>
      </div>
    </CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Alterar senha</CardTitle>
      <CardDescription>Alteração segura utilizando a sessão e a autenticação do Supabase.</CardDescription>
    </CardHeader><CardContent className="space-y-3">
      <div className="space-y-2"><Label htmlFor="profile-current-password">Senha atual</Label>
        <Input id="profile-current-password" type="password" autoComplete="current-password" value={currentPassword}
          onChange={e=>setCurrentPassword(e.target.value)} disabled={busy}/></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="profile-new-password">Nova senha</Label>
          <Input id="profile-new-password" type="password" autoComplete="new-password" value={newPassword}
            onChange={e=>setNewPassword(e.target.value)} disabled={busy}/></div>
        <div className="space-y-2"><Label htmlFor="profile-confirm-password">Confirmar nova senha</Label>
          <Input id="profile-confirm-password" type="password" autoComplete="new-password" value={confirmPassword}
            onChange={e=>setConfirmPassword(e.target.value)} disabled={busy}/></div>
      </div>
      <div className="flex justify-end"><Button disabled={busy||!newPassword||!currentPassword}
        onClick={()=>void changePassword()} className="bg-marsala-600 hover:bg-marsala-700">Alterar senha</Button></div>
    </CardContent></Card>
  </div>;
}
