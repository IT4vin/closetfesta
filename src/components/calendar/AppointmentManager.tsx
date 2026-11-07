import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, RefreshCw, Plus, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLiveClosetData, dateTimeBR } from "@/hooks/useLiveClosetData";
import PermissionManager from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const types = ["Prova", "Retirada", "Devolução", "Atendimento", "Evento"];
export default function AppointmentManager() {
  const query = useLiveClosetData();
  const cache = useQueryClient();
  const [showForm,setShowForm] = useState(false);
  const [clientId,setClientId] = useState("");
  const [productId,setProductId] = useState("");
  const [title,setTitle] = useState(types[0]);
  const [start,setStart] = useState("");
  const [end,setEnd] = useState("");
  const [description,setDescription] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [success,setSuccess] = useState("");
  const canWrite = PermissionManager.hasPermission("schedule","create");

  async function refresh() {
    await cache.invalidateQueries({queryKey:["closet-live-operations"]});
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !canWrite) return;
    setError(""); setSuccess("");
    if (!query.data?.clients.some(c=>c.id===clientId)) {
      setError("Selecione um cliente realmente cadastrado."); return;
    }
    const from = new Date(start), to = new Date(end);
    if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || to<=from) {
      setError("Informe datas válidas, com término posterior ao início."); return;
    }
    if (query.data.appointments.some(a=>a.client_id===clientId && a.status!=="cancelled" &&
        new Date(a.start_at)<to && new Date(a.end_at)>from)) {
      setError("Já existe um agendamento desse cliente neste período."); return;
    }
    if (productId && !query.data.products.some(p=>p.id===productId)) {
      setError("Selecione um produto ativo."); return;
    }
    setBusy(true);
    try {
      const auth = await supabase.auth.getUser();
      if (auth.error || !auth.data.user) throw new Error("Entre novamente no sistema.");
      const result = await supabase.from("appointments").insert({
        client_id: clientId, title, description: description.trim() || null,
        start_at: from.toISOString(), end_at: to.toISOString(),
        status: "scheduled", created_by: auth.data.user.id,
        metadata: productId ? {product_id:productId} : {},
      }).select("id").single();
      if (result.error || !result.data?.id) throw new Error(result.error?.message || "O banco não confirmou o agendamento.");
      setShowForm(false); setClientId(""); setProductId(""); setStart(""); setEnd(""); setDescription("");
      await refresh();
      setSuccess("Agendamento salvo e confirmado pelo Supabase.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no cadastro.");
    } finally { setBusy(false); }
  }

  async function cancel(id: string) {
    if (busy || !canWrite || !window.confirm("Cancelar este agendamento? O registro será preservado no histórico.")) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      const result = await supabase.from("appointments").update({status:"cancelled",updated_at:new Date().toISOString()})
        .eq("id",id).select("id").single();
      if (result.error || !result.data?.id) throw new Error(result.error?.message || "Cancelamento não confirmado.");
      await refresh(); setSuccess("Agendamento cancelado, com histórico preservado.");
    } catch (err) { setError(err instanceof Error ? err.message : "Falha ao cancelar."); }
    finally { setBusy(false); }
  }

  const data = query.data;
  const names = new Map((data?.clients ?? []).map(c=>[c.id,c.full_name]));
  const list = [...(data?.appointments ?? [])].sort((a,b)=>a.start_at.localeCompare(b.start_at));
  return <div className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="flex items-center gap-2 text-2xl font-semibold"><CalendarDays className="h-6 w-6 text-rose-900"/>Agenda</h2>
        <p className="text-sm text-muted-foreground">Agendamentos reais vinculados aos clientes do Supabase.</p></div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => void query.refetch()}><RefreshCw className="mr-2 h-4 w-4"/>Atualizar</Button>
        {canWrite && <Button onClick={() => setShowForm(!showForm)} className="bg-rose-900 text-white hover:bg-rose-800">
          <Plus className="mr-2 h-4 w-4"/>Novo agendamento
        </Button>}
      </div>
    </header>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {success && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}
    {showForm && <Card><CardHeader><CardTitle>Agendar atendimento</CardTitle></CardHeader><CardContent>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="client-id">Cliente cadastrado *</Label>
          <select id="client-id" required value={clientId} onChange={e=>setClientId(e.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Selecione um cliente</option>
            {(data?.clients ?? []).map(c=><option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select></div>
        <div className="space-y-2"><Label htmlFor="appointment-type">Tipo *</Label>
          <select id="appointment-type" value={title} onChange={e=>setTitle(e.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            {types.map(t=><option key={t} value={t}>{t}</option>)}
          </select></div>
        <div className="space-y-2"><Label htmlFor="appointment-start">Início *</Label>
          <Input id="appointment-start" required type="datetime-local" value={start} onChange={e=>setStart(e.target.value)}/></div>
        <div className="space-y-2"><Label htmlFor="appointment-end">Término *</Label>
          <Input id="appointment-end" required type="datetime-local" value={end} onChange={e=>setEnd(e.target.value)}/></div>
        <div className="space-y-2"><Label htmlFor="appointment-product">Traje (opcional)</Label>
          <select id="appointment-product" value={productId} onChange={e=>setProductId(e.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Sem traje associado</option>
            {(data?.products ?? []).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select></div>
        <div className="space-y-2"><Label htmlFor="appointment-notes">Observações</Label>
          <Input id="appointment-notes" value={description} maxLength={500}
            onChange={e=>setDescription(e.target.value)}/></div>
        <div className="flex gap-2 md:col-span-2">
          <Button disabled={busy||!clientId||!start||!end} type="submit">Salvar no Supabase</Button>
          <Button variant="outline" type="button" onClick={()=>setShowForm(false)}>Cancelar</Button>
        </div>
      </form>
    </CardContent></Card>}
    {query.isPending && <p>Carregando agendamentos...</p>}
    {query.error && <p role="alert" className="text-sm text-red-700">
      Erro de leitura: {query.error instanceof Error?query.error.message:"indisponível"}</p>}
    {data && <Card><CardHeader><CardTitle>Registros ({list.length})</CardTitle></CardHeader>
      <CardContent className="divide-y">
        {list.length===0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhum agendamento cadastrado.</p>}
        {list.map(item=><div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
          <div><p className="font-semibold">{item.title}</p>
            <p className="text-muted-foreground">{item.client_id ? (names.get(item.client_id) ?? "Cliente indisponível") : "Sem cliente"}</p>
            <p className="text-muted-foreground">{dateTimeBR(item.start_at)} até {dateTimeBR(item.end_at)}</p>
            {item.description && <p className="mt-1">{item.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border px-3 py-1">{item.status==="cancelled"?"Cancelado":item.status==="scheduled"?"Agendado":item.status}</span>
            {canWrite && item.status!=="cancelled" && <Button size="sm" variant="outline" disabled={busy}
              onClick={()=>void cancel(item.id)}><XCircle className="mr-1 h-4 w-4"/>Cancelar</Button>}
          </div>
        </div>)}
      </CardContent></Card>}
  </div>;
}
