import React from "react";
import { Link } from "react-router-dom";
import {
  Activity, CalendarClock, ClipboardList, Database, ExternalLink,
  FileBarChart2, Package, RefreshCw, Settings2, ShieldCheck,
  Shirt, Users, Wallet, ArrowUpRight, HardDriveDownload,
} from "lucide-react";
import { useLiveClosetData,useLiveFinanceData } from "@/hooks/useLiveClosetData";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const actions=[
  {path:"/clients",name:"Clientes",description:"Cadastros, contatos e crédito na loja",icon:Users},
  {path:"/products",name:"Produtos",description:"Catálogo, exemplares e históricos",icon:Package},
  {path:"/calendar",name:"Agendamentos",description:"Agenda de provas, retiradas e devoluções",icon:CalendarClock},
  {path:"/reports",name:"Relatórios",description:"Indicadores e acompanhamento da operação",icon:FileBarChart2},
  {path:"/settings",name:"Configurações",description:"Empresa, pagamentos, regras e permissões",icon:Settings2},
] as const;

export default function SystemManagement(){
  const ops=useLiveClosetData();
  const finance=useLiveFinanceData();
  const refresh=()=>{
    void ops.refetch();
    if(finance.canRead)void finance.refetch();
  };
  const items=ops.data?[
    {label:"Clientes",value:ops.data.clients.length,icon:Users},
    {label:"Produtos",value:ops.data.products.length,icon:Shirt},
    {label:"Contratos",value:ops.data.contracts.length,icon:ClipboardList},
    {label:"Exemplares",value:ops.data.units.length,icon:Package},
    {label:"Agendamentos",value:ops.data.appointments.length,icon:CalendarClock},
    {label:"Trajes em contratos",value:ops.data.items.length,icon:Activity},
  ]:[];
  return <div className="space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-marsala-100 bg-gradient-to-r from-marsala-50 via-white to-white p-5 sm:p-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-marsala-800">
          <Settings2 className="h-4 w-4"/>Central de informações
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-marsala-950">Visão geral do sistema</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Acompanhe os registros reais da loja, consulte ferramentas de trabalho e acesse as configurações
          sem alterar o menu principal.
        </p>
      </div>
      <Button variant="outline" disabled={ops.isFetching||finance.isFetching} onClick={refresh}
        className="border-marsala-200 text-marsala-800">
        <RefreshCw className={"mr-2 h-4 w-4 "+((ops.isFetching||finance.isFetching)?"animate-spin":"")}/>
        Atualizar informações
      </Button>
    </header>

    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Resumo operacional</h3>
        <span className="text-xs text-muted-foreground">Fonte: Supabase</span>
      </div>
      {ops.isPending&&<div role="status" className="rounded-xl border p-6 text-sm text-muted-foreground">
        Consultando dados da operação...
      </div>}
      {ops.error&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Não foi possível carregar os indicadores: {ops.error instanceof Error?ops.error.message:"Erro de consulta"}.
        Nenhuma contagem foi estimada.
      </div>}
      {ops.data&&<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(item=><Card key={item.label} className="border-border shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{item.value}</p>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-marsala-50 text-marsala-800">
              <item.icon className="h-5 w-5"/>
            </span>
          </CardContent>
        </Card>)}
      </div>}
    </section>

    <div className="grid items-start gap-5 lg:grid-cols-[1.5fr_1fr]">
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowUpRight className="h-4 w-4 text-marsala-800"/>Acessos rápidos
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 p-4 sm:grid-cols-2">
          {actions.map(({path,name,description,icon:Icon})=><Link to={path} key={path}
            className="group flex items-start gap-3 rounded-xl border bg-card p-4 transition hover:border-marsala-300 hover:bg-marsala-50/50 focus-visible:outline-2 focus-visible:outline-marsala-700">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-marsala-50 text-marsala-800">
              <Icon className="h-4 w-4"/>
            </span>
            <span className="min-w-0">
              <strong className="block text-sm text-foreground group-hover:text-marsala-900">{name}</strong>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{description}</span>
            </span>
          </Link>)}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border-border shadow-sm">
          <CardHeader className="border-b pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-marsala-800"/>Registros financeiros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 text-sm">
            {!finance.canRead&&<p className="text-muted-foreground">Informações restritas a usuários autorizados.</p>}
            {finance.canRead&&finance.isPending&&<p className="text-muted-foreground">Consultando financeiro...</p>}
            {finance.canRead&&finance.error&&<p role="alert" className="text-red-700">
              Não foi possível consultar os registros financeiros.
            </p>}
            {finance.canRead&&finance.data&&([
              ["Pagamentos registrados",finance.data.payments.length],
              ["Caixas cadastrados",finance.data.registers.length],
              ["Movimentações de caixa",finance.data.movements.length],
            ] as const).map(([label,count])=><div key={label} className="flex justify-between gap-2 border-b py-2 last:border-0">
              <span className="text-muted-foreground">{label}</span>
              <strong className="tabular-nums">{count}</strong>
            </div>)}
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardHeader className="border-b pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-marsala-800"/>Segurança e cópias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 text-xs leading-relaxed text-muted-foreground">
            <p>Esta tela mostra dados consultados e não garante, por si, conciliação bancária ou backup restaurável.</p>
            <p>As cópias do PostgreSQL devem ser gerenciadas e testadas no provedor.</p>
            <a target="_blank" rel="noopener noreferrer"
              href="https://supabase.com/dashboard/project/roqcwdlsuawrdbmnwbvv/database/tables"
              className="inline-flex items-center gap-2 font-medium text-marsala-800 hover:underline">
              <Database className="h-4 w-4"/>Abrir banco no Supabase<ExternalLink className="h-3 w-3"/>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
    <p className="text-xs text-muted-foreground">
      Os totais refletem os registros visíveis à conta autenticada no momento da consulta.
      As operações do PDV e o cadastro são feitos nas áreas específicas.
    </p>
  </div>;
}
