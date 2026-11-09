import React,{useEffect,useState} from "react";
import {supabase} from "@/integrations/supabase/client";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card,CardContent,CardHeader,CardTitle} from "@/components/ui/card";

export default function AcceptEmployeeInvite(){
 const [email,setEmail]=useState("");
 const [newSecret,setNewSecret]=useState("");
 const [confirmSecret,setConfirmSecret]=useState("");
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [done,setDone]=useState(false);
 useEffect(()=>{
   let active=true;
   const load=async()=>{
     const {data}=await supabase.auth.getUser();
     if(!active)return;
     setEmail(data.user?.email||"");
     setLoading(false);
   };
   void load();
   const {data:{subscription}}=supabase.auth.onAuthStateChange(()=>{
     setTimeout(()=>{void load();},0);
   });
   return()=>{active=false;subscription.unsubscribe();};
 },[]);
 const handleSubmit=async(e:React.FormEvent)=>{
   e.preventDefault();
   if(newSecret.length<10){setError("Use pelo menos 10 caracteres.");return;}
   if(newSecret!==confirmSecret){setError("As senhas não coincidem.");return;}
   setSaving(true);setError("");
   const {error:failure}=await supabase.auth.updateUser({password:newSecret});
   setSaving(false);
   if(failure){setError(failure.message);return;}
   setNewSecret("");setConfirmSecret("");setDone(true);
 };
 return <main className="flex min-h-screen items-center justify-center bg-[#FDFCFB] p-4">
  <Card className="w-full max-w-lg shadow-lg">
   <CardHeader className="bg-marsala-800 text-white">
    <CardTitle className="text-white">Closet Festa · Primeiro acesso</CardTitle>
   </CardHeader>
   <CardContent className="space-y-4 p-6">
    {loading&&<p role="status">Verificando convite...</p>}
    {!loading&&!email&&<p role="alert">
      Abra o link recebido no e-mail para ativar o seu acesso. Se expirou, solicite um novo convite.
    </p>}
    {email&&!done&&<form onSubmit={e=>void handleSubmit(e)} className="space-y-4">
      <p className="break-words text-sm">Conta: {email}</p>
      <p className="text-sm text-muted-foreground">Defina sua senha individual para entrar no sistema.</p>
      <div className="space-y-1">
       <Label htmlFor="first-secret">Nova senha (mínimo 10 caracteres)</Label>
       <Input id="first-secret" type="password" autoComplete="new-password"
        value={newSecret} onChange={e=>setNewSecret(e.target.value)} required minLength={10}/>
      </div>
      <div className="space-y-1">
       <Label htmlFor="first-confirm">Confirmar senha</Label>
       <Input id="first-confirm" type="password" autoComplete="new-password"
        value={confirmSecret} onChange={e=>setConfirmSecret(e.target.value)} required minLength={10}/>
      </div>
      <Button disabled={saving} type="submit" className="w-full bg-marsala hover:bg-marsala-700">
       {saving?"Salvando...":"Ativar meu acesso"}
      </Button>
    </form>}
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    {done&&<div className="space-y-3">
     <p role="status" className="font-semibold text-emerald-800">Senha definida com sucesso.</p>
     <a href="/" className="text-sm font-semibold text-marsala-800 underline">Entrar no sistema</a>
    </div>}
   </CardContent>
  </Card>
 </main>;
}
