import React from "react";
import { RefreshCw, Database, ShieldCheck } from "lucide-react";
import { useLiveClosetData, useLiveFinanceData } from "@/hooks/useLiveClosetData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SystemManagement() {
  const ops=useLiveClosetData();
  const finance=useLiveFinanceData();
  return <div className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-2xl font-semibold">Integridade do sistema</h2>
        <p className="text-sm text-muted-foreground">Contagens obtidas diretamente do Supabase. Sem backup ou sincronização simulados.</p></div>
      <Button variant="outline" onClick={()=>{void ops.refetch();if(finance.canRead)void finance.refetch();}}>
        <RefreshCw className="mr-2 h-4 w-4"/>Verificar novamente
      </Button>
    </header>
    {ops.isPending&&<p>Consultando banco...</p>}
    {ops.error&&<p role="alert" className="rounded-xl border border-red-200 p-4 text-red-700">
      A consulta ao Supabase falhou: {ops.error instanceof Error?ops.error.message:"Erro"}.
    </p>}
    {ops.data&&<div className="grid gap-4 sm:grid-cols-3">
      {[
        ["Clientes",ops.data.clients.length],
        ["Produtos ativos",ops.data.products.length],
        ["Contratos",ops.data.contracts.length],
        ["Itens em contratos",ops.data.items.length],
        ["Agendamentos",ops.data.appointments.length],
        ["Unidades físicas",ops.data.units.length],
      ].map(([label,value])=><Card key={String(label)}><CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      </CardContent></Card>)}
    </div>}
    {finance.canRead&&finance.data&&<Card><CardContent className="p-5">
      <p className="text-sm text-muted-foreground">Registros financeiros no banco</p>
      <p className="mt-2 text-sm">Pagamentos: {finance.data.payments.length} • Caixas: {finance.data.registers.length} • Movimentos: {finance.data.movements.length}</p>
    </CardContent></Card>}
    {finance.canRead&&finance.error&&<p role="alert">A consulta financeira falhou: {String(finance.error.message)}</p>}
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5"/>Backups e auditoria</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>Esta tela <strong>não</strong> realiza backup do PostgreSQL no navegador. Utilize os recursos oficiais do Supabase para exportar e validar restaurações.</p>
        <p>As chaves estrangeiras, restrições de integridade e auditorias SQL ficam versionadas no repositório do sistema.</p>
        <a className="block text-rose-800 underline" target="_blank" rel="noopener noreferrer"
          href="https://supabase.com/dashboard/project/roqcwdlsuawrdbmnwbvv/database/tables">
          Gerenciar banco no Supabase
        </a>
        <a className="block text-rose-800 underline" target="_blank" rel="noopener noreferrer"
          href="https://github.com/IT4vin/closetfesta/blob/work/production-readiness-phase1-20261106/supabase/audit/ghost_data_checks.sql">
          Abrir auditoria SQL versionada
        </a>
      </CardContent></Card>
    <div className="flex items-start gap-2 rounded-xl border bg-stone-50 p-4 text-sm text-muted-foreground">
      <ShieldCheck className="h-5 w-5 shrink-0"/>
      <p>Um banco acessível não comprova conciliação bancária, entrega de notificações ou funcionamento de todas as integrações. Eventos de demonstração foram removidos das telas principais.</p>
    </div>
  </div>;
}
