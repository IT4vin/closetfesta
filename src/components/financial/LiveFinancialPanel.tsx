import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLiveClosetData, useLiveFinanceData, moneyBRL, dateTimeBR } from "@/hooks/useLiveClosetData";
import PermissionManager from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, RefreshCw, AlertTriangle } from "lucide-react";

export default function LiveFinancialPanel() {
  const finance = useLiveFinanceData();
  const ops = useLiveClosetData();
  const cache = useQueryClient();
  const [open,setOpen] = useState(false);
  const [kind,setKind] = useState<"expense"|"income">("expense");
  const [description,setDescription] = useState("");
  const [amount,setAmount] = useState("");
  const [due,setDue] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [success,setSuccess] = useState("");
  const canWrite = PermissionManager.hasPermission("financial","create");
  const d = finance.data;
  const validPayments = (d?.payments ?? []).filter(p => p.status!=="reversed");
  const recordedTotal = validPayments.reduce((sum,p)=>sum+Number(p.amount),0);
  const toPay = (d?.transactions ?? []).filter(t=>t.type==="expense" && !t.paid_at)
    .reduce((sum,t)=>sum+Number(t.amount),0);
  const paidExpenses = (d?.transactions ?? []).filter(t=>t.type==="expense" && Boolean(t.paid_at))
    .reduce((sum,t)=>sum+Number(t.amount),0);
  const contractTotal = (ops.data?.contracts ?? []).filter(c=>c.status!=="cancelled").reduce((sum,c)=>sum+Number(c.total),0);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if(busy || !canWrite) return;
    setError("");setSuccess("");
    const value = Number(amount.replace(",","."));
    if (!description.trim() || !Number.isFinite(value) || value<=0 || !due) {
      setError("Informe descrição, valor positivo e vencimento.");return;
    }
    setBusy(true);
    try {
      const auth = await supabase.auth.getUser();
      if(auth.error || !auth.data.user) throw new Error("Sessão expirada.");
      const result = await supabase.from("financial_transactions").insert({
        type:kind, category:"manual", description:description.trim(),
        amount:value, due_date:due, status:"pending",
        created_by:auth.data.user.id,
      }).select("id").single();
      if(result.error || !result.data?.id) throw new Error(result.error?.message || "Gravação não confirmada.");
      await cache.invalidateQueries({queryKey:["closet-live-finance"]});
      setOpen(false);setDescription("");setAmount("");setDue("");
      setSuccess("Lançamento pendente registrado no Supabase. Não foi contado como pagamento.");
    }catch(err){setError(err instanceof Error?err.message:"Erro ao salvar lançamento.");}
    finally{setBusy(false);}
  }

  async function markPaid(id:string) {
    if(!canWrite || busy || !window.confirm("Confirmar que este lançamento foi efetivamente pago?")) return;
    setBusy(true);setError("");setSuccess("");
    try {
      const result=await supabase.from("financial_transactions").update({status:"paid",paid_at:new Date().toISOString(),updated_at:new Date().toISOString()})
        .eq("id",id).is("paid_at",null).select("id").single();
      if(result.error||!result.data?.id)throw new Error(result.error?.message||"Pagamento não confirmado.");
      await cache.invalidateQueries({queryKey:["closet-live-finance"]});
      setSuccess("Pagamento confirmado no controle interno. Confira também no extrato bancário.");
    }catch(err){setError(err instanceof Error?err.message:"Erro ao registrar pagamento.");}
    finally{setBusy(false);}
  }

  if(!finance.canRead)return <p className="rounded-xl border p-6">Seu perfil não tem permissão para consultar informações financeiras.</p>;
  if(finance.isPending||ops.isPending)return <p className="p-6">Consultando financeiro no Supabase...</p>;
  if(finance.error||ops.error||!d||!ops.data)return <div role="alert" className="space-y-3 rounded-xl border border-red-200 p-5">
    <p>O financeiro não pôde ser consultado. Não exibiremos valores aproximados.</p>
    <p className="text-sm text-red-700">{finance.error instanceof Error ? finance.error.message :
      ops.error instanceof Error ? ops.error.message : "Consulta indisponível"}</p>
    <Button variant="outline" onClick={()=>{void finance.refetch();void ops.refetch();}}>Tentar novamente</Button>
  </div>;

  return <div className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-2xl font-semibold">Financeiro real</h2>
        <p className="text-sm text-muted-foreground">Somente dados persistidos; recebimentos não representam conciliação bancária.</p></div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={()=>{void finance.refetch();void ops.refetch();}}><RefreshCw className="mr-2 h-4 w-4"/>Atualizar</Button>
        {canWrite&&<Button onClick={()=>setOpen(!open)}><Plus className="mr-2 h-4 w-4"/>Novo lançamento</Button>}
      </div>
    </header>
    {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {success&&<p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {[
        ["Contratos registrados",moneyBRL(contractTotal),"Valor contratado; não confundir com recebimento"],
        ["Pagamentos de aluguel registrados",moneyBRL(recordedTotal),"Inclui Pix/cartão/dinheiro; conciliação externa pendente"],
        ["Contas a pagar",moneyBRL(toPay),"Despesas manuais ainda não quitadas"],
        ["Despesas marcadas como pagas",moneyBRL(paidExpenses),"Controle interno, não extrato bancário"],
      ].map(([title,value,note])=><Card key={title}><CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{title}</p><p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
        <p className="mt-2 text-xs text-muted-foreground">{note}</p></CardContent></Card>)}
    </div>
    <p className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <AlertTriangle size={18} className="shrink-0"/> Caixa físico tem saldo próprio.
      O sistema não deve somar Pix e cartões às notas em dinheiro do caixa.
    </p>
    {open&&<Card><CardHeader><CardTitle>Registrar conta a pagar/receber</CardTitle></CardHeader><CardContent>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="finance-kind">Tipo</Label><select id="finance-kind" value={kind} onChange={e=>setKind(e.target.value as "expense"|"income")}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm">
          <option value="expense">Despesa a pagar</option><option value="income">Receita a receber (manual)</option>
        </select></div>
        <div className="space-y-2"><Label htmlFor="finance-description">Descrição *</Label>
          <Input id="finance-description" required maxLength={220} value={description} onChange={e=>setDescription(e.target.value)}/></div>
        <div className="space-y-2"><Label htmlFor="finance-amount">Valor em reais *</Label>
          <Input id="finance-amount" type="text" inputMode="decimal" required value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0,00"/></div>
        <div className="space-y-2"><Label htmlFor="finance-due">Vencimento *</Label>
          <Input id="finance-due" type="date" required value={due} onChange={e=>setDue(e.target.value)}/></div>
        <div className="md:col-span-2 flex gap-2"><Button disabled={busy} type="submit">Salvar lançamento pendente</Button>
          <Button type="button" variant="outline" onClick={()=>setOpen(false)}>Cancelar</Button></div>
      </form>
    </CardContent></Card>}
    <Card><CardHeader><CardTitle>Contas cadastradas ({d.transactions.length})</CardTitle></CardHeader>
      <CardContent className="divide-y">
        {d.transactions.length===0&&<p className="py-4 text-sm text-muted-foreground">Nenhuma conta manual registrada.</p>}
        {[...d.transactions].sort((a,b)=>b.created_at.localeCompare(a.created_at)).map(t=>
          <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <div><strong>{t.description}</strong>
              <p className="text-muted-foreground">{t.type==="expense"?"Despesa":"Receita manual"} • Vence {t.due_date??"sem data"} • {t.paid_at?"Marcado como pago":"Pendente"}</p></div>
            <div className="flex items-center gap-3"><span className="font-semibold">{moneyBRL(Number(t.amount))}</span>
              {canWrite&&!t.paid_at&&<Button variant="outline" size="sm" disabled={busy} onClick={()=>void markPaid(t.id)}>Registrar pagamento</Button>}
            </div>
          </div>)}
      </CardContent></Card>
    <Card><CardHeader><CardTitle>Recebimentos de aluguéis ({validPayments.length})</CardTitle></CardHeader>
      <CardContent className="divide-y">
        {validPayments.length===0&&<p className="py-4 text-sm text-muted-foreground">Nenhum recebimento registrado.</p>}
        {[...validPayments].sort((a,b)=>b.recorded_at.localeCompare(a.recorded_at)).map(p=>
          <div key={p.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm">
            <div><p className="font-medium">Contrato #{ops.data.contracts.find(c=>c.id===p.contract_id)?.contract_number??"—"}</p>
              <p className="text-muted-foreground">{dateTimeBR(p.recorded_at)} • {p.method} • {p.status}</p></div>
            <strong>{moneyBRL(Number(p.amount))}</strong>
          </div>)}
      </CardContent></Card>
  </div>;
}
