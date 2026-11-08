import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadClosetSettings, type ClosetSettingValues } from "@/lib/closetSettings";
import type { LiveContract, LivePayment } from "@/hooks/useLiveClosetData";
import { moneyBRL } from "@/hooks/useLiveClosetData";

export function localMonth(date: string | Date): string {
  const parts = new Intl.DateTimeFormat("pt-BR",{year:"numeric",month:"2-digit",timeZone:"America/Sao_Paulo"})
    .formatToParts(date instanceof Date ? date : new Date(date));
  const year = parts.find(p=>p.type==="year")?.value;
  const month = parts.find(p=>p.type==="month")?.value;
  return year+"-"+month;
}
export function goalsActuals(contracts: LiveContract[],payments: LivePayment[],month:string) {
  const inMonth = contracts.filter(c=>c.status!=="cancelled" && localMonth(c.created_at)===month);
  const receipts=payments.filter(p=>p.status!=="reversed" && localMonth(p.recorded_at)===month);
  const contracted=inMonth.reduce((total,c)=>total+Number(c.total),0);
  const received=receipts.reduce((total,p)=>total+Number(p.amount),0);
  return {contracted, received, count:inMonth.length, ticket:inMonth.length?contracted/inMonth.length:0};
}
export default function GoalsProgress({
  contracts,payments,
}: {contracts:LiveContract[],payments:LivePayment[]}) {
  const [targets,setTargets]=useState<ClosetSettingValues>({});
  const [error,setError]=useState("");
  const [loaded,setLoaded]=useState(false);
  useEffect(()=>{
    let active=true;
    void loadClosetSettings("goals").then(data=>{
      if(active) {setTargets(data);setLoaded(true);}
    }).catch(err=>{
      if(active) {setError(err instanceof Error?err.message:"Não foi possível carregar metas");setLoaded(true);}
    });
    return ()=>{active=false;};
  },[]);
  const month=localMonth(new Date());
  const values=goalsActuals(contracts,payments,month);
  const rows=[
    {label:"Valor contratado",target:Number(targets.monthly_contracts_amount),actual:values.contracted,money:true},
    {label:"Recebimentos registrados",target:Number(targets.monthly_received_amount),actual:values.received,money:true},
    {label:"Contratos fechados",target:Number(targets.monthly_contract_count),actual:values.count,money:false},
    {label:"Ticket médio",target:Number(targets.average_ticket),actual:values.ticket,money:true},
  ].filter(r=>Number.isFinite(r.target)&&r.target>0);
  return <Card className="border-marsala-100">
    <CardHeader><CardTitle className="text-base">Metas do mês — {month.split("-").reverse().join("/")}</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      {!loaded&&<p className="text-sm text-muted-foreground">Carregando metas cadastradas...</p>}
      {error&&<p role="alert" className="text-sm text-red-700">Metas indisponíveis: {error}</p>}
      {loaded&&!error&&rows.length===0&&<p className="text-sm text-muted-foreground">
        Nenhuma meta mensal foi configurada. Cadastre em Configurações → Metas para acompanhar o progresso.
      </p>}
      {rows.map(row=>{
        const percent=Math.min(100,Math.max(0,row.actual/row.target*100));
        const format=(v:number)=>row.money?moneyBRL(v):v.toLocaleString("pt-BR",{maximumFractionDigits:0});
        return <div key={row.label} className="space-y-2">
          <div className="flex flex-wrap justify-between gap-2 text-sm"><span>{row.label}</span>
            <strong>{format(row.actual)} / {format(row.target)}</strong></div>
          <div role="progressbar" aria-label={row.label} aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}
            className="h-2 overflow-hidden rounded-full bg-marsala-100">
            <div className="h-full rounded-full bg-marsala-600" style={{width:percent+"%"}}/>
          </div>
        </div>;
      })}
      <p className="text-xs text-muted-foreground">Contratos e recebimentos usam suas próprias datas. Cancelamentos e estornos não são contabilizados; metas não incluem conciliação bancária.</p>
    </CardContent>
  </Card>;
}
