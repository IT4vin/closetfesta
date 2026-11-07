import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ClipboardList, FileBarChart, CalendarRange, RotateCw, Coins, Handshake,
  Users, TrendingUp, ArrowLeft, RefreshCw, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PDVReports from "@/components/pdv/PDVReports";
import { useLiveClosetData, useLiveFinanceData, moneyBRL, type LiveItem } from "@/hooks/useLiveClosetData";
import { operationRows, localDay, addDays } from "@/lib/operationalAnalytics";
import SpecialReports from "@/components/reports/SpecialReports";

type View = "separacao" | "pedidos" | "indisponibilidade" | "rotatividade" |
  "creditos" | "consignados" | "comissoes" | "clientes";
const titles: Record<View,{title:string,description:string,Icon:typeof ClipboardList}> = {
  separacao:{title:"Separação", description:"Provas, retiradas e devoluções que exigem preparação de trajes.",Icon:ClipboardList},
  pedidos:{title:"Pedidos",description:"Contratos, recebimentos e formas de pagamento por período.",Icon:FileBarChart},
  indisponibilidade:{title:"Indisponibilidade de produtos",description:"Exemplares livres, reservados ou indisponíveis em datas selecionadas.",Icon:CalendarRange},
  rotatividade:{title:"Rotatividade de produtos",description:"Frequência de locação e valores associados a cada traje.",Icon:RotateCw},
  creditos:{title:"Créditos",description:"Saldo de clientes, ajustes e transferência auditável entre cadastros.",Icon:Coins},
  consignados:{title:"Consignados",description:"Exemplares consignados a parceiros e reservas ativas, sem misturá-los.",Icon:Handshake},
  comissoes:{title:"Comissões",description:"Comissões vinculadas a contratos e vendedores, com aprovação financeira.",Icon:TrendingUp},
  clientes:{title:"Análise de clientes",description:"Origem do cadastro, frequência de locações e valores por cliente.",Icon:Users},
};
const dateText=(d:string)=>d.split("-").reverse().join("/");
const statCard=(title:string,value:string,detail:string)=> <Card><CardContent className="p-4">
  <p className="text-xs text-muted-foreground">{title}</p>
  <p className="mt-2 text-xl font-semibold tabular-nums">{value}</p>
  <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
</CardContent></Card>;

export default function LiveReportsHub() {
  const [params,setParams] = useSearchParams();
  const selected=params.get("view") as View|null;
  const selectedView: View | null=selected&&Object.prototype.hasOwnProperty.call(titles,selected)?selected:null;
  const [from,setFrom]=useState(()=>localDay(new Date()));
  const [to,setTo]=useState(()=>addDays(localDay(new Date()),10));
  const operations=useLiveClosetData();
  const finance=useLiveFinanceData();
  const data=operations.data;
  const clientNames=useMemo(()=>new Map((data?.clients??[]).map(c=>[c.id,c.full_name])),[data]);
  const productNames=useMemo(()=>new Map((data?.products??[]).map(p=>[p.id,p.name])),[data]);
  const contractMap=useMemo(()=>new Map((data?.contracts??[]).map(c=>[c.id,c])),[data]);
  const rangeValid=from<=to&&new Date(to+"T12:00:00Z").getTime()-new Date(from+"T12:00:00Z").getTime()<=60*86400000;

  if(!selectedView)return <main className="page-transition space-y-6">
    <header><h1 className="text-3xl font-semibold">Relatórios</h1>
      <p className="mt-1 text-sm text-muted-foreground">Consultas operacionais e financeiras com dados reais do Closet Festa.</p></header>
    <div className="grid gap-4 md:grid-cols-2">
      {(Object.entries(titles) as [View,typeof titles[View]][]).map(([key,detail])=>{
        const Icon=detail.Icon;
        return <Card key={key} className="hover:border-slate-300 hover:shadow-sm">
          <CardContent className="flex items-start gap-4 p-6">
            <div className="rounded-lg border bg-slate-50 p-4 text-slate-700"><Icon size={32} strokeWidth={1.6}/></div>
            <div className="flex-1"><h2 className="font-semibold">{detail.title}</h2>
              <p className="mt-2 min-h-[3em] text-xs text-muted-foreground">{detail.description}</p>
              <Button size="sm" className="mt-3" onClick={()=>setParams({view:key})}>
                Clique para ver <ChevronRight size={14} className="ml-1"/></Button>
            </div>
          </CardContent></Card>;
      })}
    </div>
  </main>;

  return <main className="page-transition space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><Button variant="ghost" size="sm" className="-ml-3" onClick={()=>setParams({})}>
          <ArrowLeft size={15} className="mr-1"/> Todos os relatórios</Button>
        <h1 className="text-2xl font-semibold">{titles[selectedView].title}</h1>
        <p className="text-sm text-muted-foreground">{titles[selectedView].description}</p></div>
      <Button variant="outline" onClick={()=>{void operations.refetch();if(finance.canRead)void finance.refetch();}}>
        <RefreshCw className="mr-2 h-4 w-4"/>Atualizar
      </Button>
    </header>
    {selectedView==="pedidos" ? <PDVReports/> :
    selectedView==="creditos"||selectedView==="comissoes"||selectedView==="consignados" ?
      <SpecialReports view={selectedView} operations={data} loading={operations.isPending} error={operations.error} /> :
    operations.isPending ? <p className="rounded-lg border p-6">Buscando registros no Supabase...</p> :
    operations.error||!data ? <p role="alert" className="rounded-lg border border-red-200 p-5 text-red-700">
      Erro ao carregar: {operations.error instanceof Error?operations.error.message:"Falha de consulta"}</p> :
    <>
      {selectedView!=="clientes"&&<div className="flex flex-wrap items-end gap-3">
        <label className="text-xs">De<input type="date" className="mt-1 block rounded border bg-background p-2 text-sm"
          value={from} onChange={e=>setFrom(e.target.value)}/></label>
        <label className="text-xs">Até<input type="date" className="mt-1 block rounded border bg-background p-2 text-sm"
          value={to} onChange={e=>setTo(e.target.value)}/></label>
        <span className="pb-2 text-xs text-muted-foreground">Intervalo máximo de 60 dias</span>
      </div>}
      {!rangeValid && selectedView!=="clientes" ?
        <p role="alert" className="rounded border border-amber-300 p-4">Selecione um intervalo válido de até 60 dias.</p> :
      selectedView==="separacao" ?
        <Separation data={data} from={from} to={to} clientNames={clientNames} productNames={productNames}/> :
      selectedView==="indisponibilidade" ?
        <Availability data={data} from={from} to={to} productNames={productNames}/> :
      selectedView==="rotatividade" ?
        <Rotation data={data} from={from} to={to} productNames={productNames}/> :
        <ClientAnalysis data={data}/>}
    </>}
  </main>;
}

type Data = NonNullable<ReturnType<typeof useLiveClosetData>["data"]>;
function Separation({data,from,to,clientNames,productNames}:{data:Data,from:string,to:string,
  clientNames:Map<string,string>,productNames:Map<string,string>}) {
  const rows=operationRows(data).filter(o=>o.day>=from&&o.day<=to);
  const counts=(["prova","retirada","devolucao"] as const).map(kind=>({
    name:{prova:"Provas",retirada:"Retiradas",devolucao:"Devoluções"}[kind],
    n:rows.filter(o=>o.kind===kind).length,
  }));
  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3">{counts.map(c=><React.Fragment key={c.name}>
      {statCard(c.name,String(c.n),"Compromissos que exigem preparação")}</React.Fragment>)}</div>
    <Card><CardHeader><CardTitle className="text-base">Lista de separação ({rows.length})</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {!rows.length&&<p className="text-sm text-muted-foreground">Nenhuma prova, retirada ou devolução registrada para o período.</p>}
        {rows.map(o=><div key={o.id} className="grid gap-2 rounded-lg border p-3 text-sm sm:grid-cols-[110px_120px_1fr]">
          <strong>{dateText(o.day)}</strong>
          <span className="capitalize">{o.kind==="devolucao"?"Devolução":o.kind}</span>
          <div><p className="font-medium">{clientNames.get(o.clientId??"")??"Cliente não disponível"}</p>
            <p className="text-xs text-muted-foreground">{o.productId ? (productNames.get(o.productId)??"Traje arquivado"):o.description} • {o.source==="agenda"?"Agendamento":"Contrato"}</p></div>
        </div>)}
      </CardContent></Card>
    <p className="text-xs text-muted-foreground">A agenda e os prazos dos contratos são reconciliados por cliente, tipo e dia para reduzir contagens duplicadas.</p>
  </div>;
}
function Availability({data,from,to,productNames}:{data:Data,from:string,to:string,productNames:Map<string,string>}) {
  const days:string[]=[];
  for(let day=from;day<=to&&days.length<61;day=addDays(day,1))days.push(day);
  const rows=data.products.map(product=>{
    const units=data.units.filter(u=>u.product_id===product.id);
    const blockedDays=days.map(day=>{
      const blocked=units.filter(u=>u.status!=="available"||data.items.some(i=>
        i.unit_id===u.id&&["confirmed","picked_up"].includes(i.status)&&i.pickup_date<=day&&i.return_date>=day));
      return {day,blocked:blocked.length,total:units.length};
    });
    return {
      ...product,units:units.length,
      noStock:units.length===0,
      unavailableDays:blockedDays.filter(x=>x.total>0&&x.blocked===x.total),
      maxBlocked:Math.max(0,...blockedDays.map(x=>x.blocked)),
    };
  }).filter(p=>p.unavailableDays.length||p.maxBlocked||p.noStock);
  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3">
      {statCard("Produtos com restrições",String(rows.length),"Inclui reserva e indisponibilidade física")}
      {statCard("Trajes sem exemplares",String(rows.filter(r=>r.noStock).length),"Confira o cadastro do estoque físico")}
      {statCard("Trajes totalmente ocupados",String(rows.filter(r=>r.unavailableDays.length>0).length),"Em ao menos um dia do período selecionado")}
    </div>
    <Card><CardHeader><CardTitle className="text-base">Disponibilidade por exemplar e data</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {rows.length===0&&<p className="text-sm text-muted-foreground">Nenhuma restrição encontrada no intervalo selecionado.</p>}
        {rows.map(p=><div key={p.id} className="rounded-md border p-3 text-sm">
          <p className="font-medium">{p.name}</p>
          <p className="text-xs text-muted-foreground">{p.units} exemplares cadastrados • Máximo simultâneo ocupado: {p.maxBlocked}</p>
          <p className="mt-1 text-xs text-rose-700">{p.noStock?"Sem exemplar físico disponível":
            p.unavailableDays.length?("Indisponível em: "+p.unavailableDays.map(x=>dateText(x.day)).join(", ")):
            "Há reservas parciais, mas não há dia totalmente indisponível no intervalo."}</p>
        </div>)}
      </CardContent></Card>
    <p className="text-xs text-muted-foreground">Disponibilidade consultiva baseada no status dos exemplares e nas reservas do período; a confirmação definitiva da locação é validada pelo banco.</p>
  </div>;
}
function Rotation({data,from,to,productNames}:{data:Data,from:string,to:string,productNames:Map<string,string>}) {
  const eligible=data.items.filter(i=>!["cancelled"].includes(i.status)&&i.event_date>=from&&i.event_date<=to);
  const stats=new Map<string,{n:number,value:number}>();
  for(const item of eligible){
    const s=stats.get(item.product_id)??{n:0,value:0};
    s.n++;s.value+=Number(item.unit_price)-Number(item.discount);stats.set(item.product_id,s);
  }
  const rows=Array.from(stats).map(([id,s])=>({
    id,name:productNames.get(id)??"Produto arquivado",...s,
    units:data.units.filter(u=>u.product_id===id).length,
  })).sort((a,b)=>b.n-a.n);
  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3">
      {statCard("Itens associados a locações",String(eligible.length),"Referências de trajes nos contratos")}
      {statCard("Modelos movimentados",String(rows.length),"Produtos com evento no período")}
      {statCard("Valor associado aos itens",moneyBRL(rows.reduce((a,b)=>a+b.value,0)),"Valor contratado dos itens, não valor recebido")}
    </div>
    <Card><CardHeader><CardTitle className="text-base">Rotatividade por traje</CardTitle></CardHeader><CardContent className="space-y-2">
      {rows.length===0&&<p className="text-sm text-muted-foreground">Sem locações com evento nesse intervalo.</p>}
      {rows.map(p=><div className="flex flex-wrap items-center justify-between gap-3 border-b py-3 text-sm" key={p.id}>
        <div><strong>{p.name}</strong><p className="text-xs text-muted-foreground">Exemplares: {p.units} • Locações por exemplar: {p.units>0?(p.n/p.units).toFixed(2):"não disponível"}</p></div>
        <div className="text-right"><strong>{p.n} locações</strong><p className="text-xs text-muted-foreground">{moneyBRL(p.value)} contratados</p></div>
      </div>)}
    </CardContent></Card>
  </div>;
}
function ClientAnalysis({data}:{data:Data}) {
  const clientCount=new Map<string,{n:number,value:number}>();
  for(const contract of data.contracts.filter(c=>c.status!=="cancelled")){
    const c=clientCount.get(contract.client_id)??{n:0,value:0};
    c.n++;c.value+=Number(contract.total);clientCount.set(contract.client_id,c);
  }
  const origins=new Map<string,number>();
  for(const client of data.clients) {
    const label=client.acquisition_source?.trim()||"Não informado";
    origins.set(label,(origins.get(label)??0)+1);
  }
  const top=[...data.clients].map(c=>({id:c.id,name:c.full_name,
    origin:c.acquisition_source?.trim()||"Não informado",stats:clientCount.get(c.id)??{n:0,value:0}}))
    .sort((a,b)=>b.stats.n-a.stats.n||b.stats.value-a.stats.value);
  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3">
      {statCard("Clientes cadastrados",String(data.clients.length),"Cadastros reais")}
      {statCard("Clientes com locações",String(clientCount.size),"Clientes com contrato não cancelado")}
      {statCard("Contratos associados",String(Array.from(clientCount.values()).reduce((s,x)=>s+x.n,0)),"Vínculos de clientes com pedidos")}
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-base">Origem dos clientes</CardTitle></CardHeader><CardContent className="divide-y">
        {[...origins].sort((a,b)=>b[1]-a[1]).map(([name,value])=><div key={name} className="flex justify-between py-3 text-sm">
          <span>{name}</span><strong>{value}</strong></div>)}
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Frequência de locação</CardTitle></CardHeader><CardContent className="divide-y">
        {top.slice(0,30).map(c=><div key={c.id} className="flex justify-between gap-3 py-3 text-sm">
          <div><strong>{c.name}</strong><p className="text-xs text-muted-foreground">Origem: {c.origin}</p></div>
          <div className="text-right"><strong>{c.stats.n} contratos</strong><p className="text-xs text-muted-foreground">{moneyBRL(c.stats.value)}</p></div>
        </div>)}
        {top.length===0&&<p className="text-sm text-muted-foreground">Nenhum cliente cadastrado.</p>}
      </CardContent></Card>
    </div>
    <p className="text-xs text-muted-foreground">Origem é informada no cadastro do cliente. Registros anteriores sem essa informação aparecem como “Não informado”.</p>
  </div>;
}
