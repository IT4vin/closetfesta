import React from "react";
import { Link } from "react-router-dom";
import { PackageCheck, RefreshCw } from "lucide-react";
import { useLiveClosetData } from "@/hooks/useLiveClosetData";
import { Button } from "@/components/ui/button";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";

export default function InventoryLiveView() {
  const query=useLiveClosetData();
  if(query.isPending)return <p className="rounded-xl border p-6">Consultando estoque real no Supabase...</p>;
  if(query.error||!query.data)return <div role="alert" className="space-y-3 rounded-xl border border-red-200 p-5">
    <p>Estoque indisponível. Não serão exibidos dados estimados.</p>
    <p className="text-sm text-red-700">{query.error instanceof Error?query.error.message:"Erro de consulta"}</p>
    <Button variant="outline" onClick={()=>void query.refetch()}>Tentar novamente</Button>
  </div>;
  const {products,units,items}=query.data;
  const liveProducts=products.filter(p=>p.active&&!p.deleted_at);
  const ongoingItems=items.filter(i=>i.status==="confirmed"||i.status==="picked_up");
  const allocated=new Set(ongoingItems.map(i=>i.unit_id));
  const available=units.filter(u=>u.status==="available"&&!allocated.has(u.id)&&liveProducts.some(p=>p.id===u.product_id));
  return <main className="page-transition space-y-5">
    <header className="flex flex-wrap justify-between gap-3">
      <div><h1 className="text-3xl font-semibold">Controle de estoque</h1>
        <p className="text-sm text-muted-foreground">Quantidades reais de produtos e unidades físicas. Sem projeções simuladas.</p></div>
      <div className="flex gap-2"><Button variant="outline" onClick={()=>void query.refetch()}><RefreshCw className="mr-2 h-4 w-4"/>Atualizar</Button>
        <Button asChild><Link to="/products">Cadastrar ou editar traje</Link></Button></div>
    </header>
    <div className="grid gap-4 sm:grid-cols-3">
      {[
        ["Produtos ativos",liveProducts.length],
        ["Unidades físicas cadastradas",units.filter(u=>liveProducts.some(p=>p.id===u.product_id)).length],
        ["Unidades livres agora",available.length],
      ].map(([name,value])=><Card key={String(name)}><CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{name}</p><p className="mt-2 text-2xl font-semibold">{value}</p>
      </CardContent></Card>)}
    </div>
    <Card><CardHeader><CardTitle>Trajes no inventário ({liveProducts.length})</CardTitle></CardHeader><CardContent className="divide-y">
      {liveProducts.length===0&&<p className="py-4 text-sm text-muted-foreground">Nenhum traje ativo cadastrado.</p>}
      {liveProducts.map(p=>{
        const own=units.filter(u=>u.product_id===p.id);
        const free=own.filter(u=>u.status==="available"&&!allocated.has(u.id));
        return <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
          <div><p className="flex items-center gap-2 font-semibold"><PackageCheck className="h-4 w-4 text-rose-900"/>{p.name}</p>
            <p className="text-muted-foreground">SKU {p.sku??"—"} • Cadastro: {p.stock_quantity} unidade(s)</p></div>
          <div className="text-right"><p>Exemplares: {own.length}</p>
            <p className="text-muted-foreground">Livres agora: {free.length}</p>
            {p.stock_quantity!==own.length&&<p className="text-xs font-semibold text-amber-700">Divergência entre cadastro e unidades físicas</p>}
          </div>
        </div>;
      })}
    </CardContent></Card>
    <p className="text-xs text-muted-foreground">
      A disponibilidade para uma data futura depende da agenda de locações, não apenas do status atual.
      Produtos excluídos e inativos não aparecem neste painel; permanecem preservados nos contratos históricos.
    </p>
  </main>;
}
