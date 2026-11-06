import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ClipboardList, Package, Users, Wallet, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLiveClosetData, useLiveFinanceData, moneyBRL, dateTimeBR } from "@/hooks/useLiveClosetData";

const card = (title: string, value: string | number, icon: React.ReactNode, sub: string) => (
  <Card className="border-stone-200 shadow-sm">
    <CardContent className="p-5">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{title}</span>{icon}
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-stone-900">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </CardContent>
  </Card>
);

export default function LiveOperationsDashboard() {
  const live = useLiveClosetData();
  const finance = useLiveFinanceData();
  const data = live.data;
  const today = new Date().toISOString().slice(0, 10);
  const clients = useMemo(() => new Map((data?.clients ?? []).map(c => [c.id, c.full_name])), [data]);
  const products = useMemo(() => new Map((data?.products ?? []).map(p => [p.id, p.name])), [data]);

  if (live.isPending) return <p className="rounded-xl border p-6">Consultando dados reais do Supabase...</p>;
  if (live.error || !data) return (
    <Card className="border-red-200"><CardContent className="space-y-3 p-6">
      <p role="alert">Não foi possível consultar o banco. Nenhum valor fictício será exibido.</p>
      <p className="text-sm text-red-700">{live.error instanceof Error ? live.error.message : "Falha de consulta"}</p>
      <Button variant="outline" onClick={() => void live.refetch()}>Tentar novamente</Button>
    </CardContent></Card>
  );

  const active = data.items.filter(i => i.status === "confirmed" || i.status === "picked_up");
  const late = active.filter(i => i.return_date < today);
  const returnsToday = active.filter(i => i.return_date === today);
  const nextReturns = active.filter(i => i.return_date > today).sort((a,b) => a.return_date.localeCompare(b.return_date)).slice(0, 10);
  const upcoming = data.appointments.filter(a => a.status !== "cancelled" && a.end_at >= new Date().toISOString())
    .sort((a,b) => a.start_at.localeCompare(b.start_at)).slice(0, 6);
  const catalog = data.products.filter(p => p.active && !p.deleted_at);
  const paid = (finance.data?.payments ?? []).filter(p => p.status !== "reversed").reduce((sum,p) => sum + Number(p.amount), 0);
  const topMap = new Map<string, number>();
  for (const item of data.items) {
    if (item.status === "cancelled" || !products.has(item.product_id)) continue;
    topMap.set(item.product_id, (topMap.get(item.product_id) ?? 0) + 1);
  }
  const top = Array.from(topMap).sort((a,b) => b[1]-a[1]).slice(0, 5);

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-2xl font-semibold text-stone-900">Visão geral da loja</h2>
        <p className="text-sm text-muted-foreground">Informações reais do Supabase. Dados demonstrativos desativados.</p></div>
      <Button variant="outline" onClick={() => { void live.refetch(); if (finance.canRead) void finance.refetch(); }}>
        <RefreshCw className="mr-2 h-4 w-4"/> Atualizar dados
      </Button>
    </header>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {card("Contratos cadastrados", data.contracts.length, <ClipboardList size={18}/>, "Inclui contratos concluídos e cancelados")}
      {card("Clientes reais", data.clients.length, <Users size={18}/>, "Cadastros persistidos")}
      {card("Produtos ativos", catalog.length, <Package size={18}/>, "Arquivados e excluídos ocultos")}
      {card("Trajes com devolução atrasada", late.length, <AlertCircle size={18}/>, "Itens ainda não devolvidos")}
      {card("Devoluções previstas hoje", returnsToday.length, <CalendarDays size={18}/>, "Itens aguardando devolução")}
      {card("Agendamentos futuros", upcoming.length, <CalendarDays size={18}/>, "Próximos seis exibidos abaixo")}
      {finance.canRead ? card("Recebimentos registrados", finance.isPending ? "..." : finance.error ? "Indisponível" : moneyBRL(paid),
        <Wallet size={18}/>, "Registro interno; não é conciliação bancária") : card("Recebimentos", "Restrito", <Wallet size={18}/>, "Sem permissão financeira")}
      {card("Caixas abertos", finance.canRead && finance.data ? finance.data.registers.filter(r=>r.status==="open").length : "—",
        <Wallet size={18}/>, "Saldo em dinheiro exige conciliação própria")}
    </div>
    {finance.canRead && finance.error && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
      Falha na consulta financeira: {finance.error instanceof Error ? finance.error.message : "indisponível"}. Nenhum valor estimado foi exibido.
    </p>}
    <div className="grid gap-5 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Próximos agendamentos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {upcoming.length===0 ? <p className="text-sm text-muted-foreground">Nenhum agendamento futuro registrado.</p> :
            upcoming.map(a=><div key={a.id} className="flex justify-between gap-3 border-b pb-2 text-sm">
              <div><p className="font-medium">{a.title}</p>
                <p className="text-muted-foreground">{a.client_id ? (clients.get(a.client_id) ?? "Cliente não disponível") : "Sem cliente associado"}</p></div>
              <span className="shrink-0 text-muted-foreground">{dateTimeBR(a.start_at)}</span>
            </div>)}
          <Link className="text-sm text-rose-800 underline" to="/calendar">Abrir agenda</Link>
        </CardContent></Card>
      <Card><CardHeader><CardTitle>Devoluções e atrasos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[...late, ...returnsToday, ...nextReturns].slice(0,10).map(item=><div key={item.id} className="flex justify-between gap-2 border-b pb-2 text-sm">
            <div><p className="font-medium">{products.get(item.product_id) ?? "Traje arquivado"}</p>
              <p className="text-muted-foreground">{clients.get(data.contracts.find(c=>c.id===item.contract_id)?.client_id ?? "") ?? "Cliente não disponível"}</p></div>
            <span className={item.return_date<today?"font-medium text-red-700":"text-muted-foreground"}>{item.return_date.split("-").reverse().join("/")}</span>
          </div>)}
          {active.length===0 && <p className="text-sm text-muted-foreground">Nenhuma devolução pendente.</p>}
          <Link className="text-sm text-rose-800 underline" to="/pdv">Acompanhar no PDV</Link>
        </CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle>Trajes mais alugados</CardTitle></CardHeader><CardContent className="space-y-2">
      {top.length === 0 ? <p className="text-sm text-muted-foreground">Ainda não há histórico de aluguéis de produtos ativos.</p> :
        top.map(([id,qty])=><div className="flex justify-between border-b pb-2 text-sm" key={id}>
          <span>{products.get(id)}</span><strong>{qty} {qty===1?"aluguel":"aluguéis"}</strong>
        </div>)}
    </CardContent></Card>
  </div>;
}
