import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, CheckCircle2, Clock3, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  confirmDashboardVisits,fetchDashboardVisitList,visitDateBR,visitLabel,
  visitPeriodLabel,type DashboardVisitKind,type DashboardVisitPeriod,
  type DashboardVisitRow,
} from "@/lib/dashboardVisits";
import PermissionManager from "@/lib/permissions";

const PAGE_SIZE=30;
type Selection=Record<string,DashboardVisitRow>;
const keyOf=(row:DashboardVisitRow)=>row.contract_id+"|"+row.day;

export default function DashboardVisitConfirmationDialog({
  selected,onClose,
}:{
  selected:{kind:DashboardVisitKind;period:DashboardVisitPeriod}|null;
  onClose:()=>void;
}) {
  const {toast}=useToast();
  const queryClient=useQueryClient();
  const [page,setPage]=useState(0);
  const [marked,setMarked]=useState<Selection>({});
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const canConfirm=PermissionManager.hasPermission("schedule","read");
  const kind=selected?.kind||"prova";
  const period=selected?.period||"today";
  const query=useQuery({
    queryKey:["closet-dashboard-visits",period,kind,page],
    enabled: Boolean(selected),
    queryFn:()=>fetchDashboardVisitList(period,kind,page*PAGE_SIZE,PAGE_SIZE),
    refetchOnMount:"always",staleTime:0,refetchOnWindowFocus:true,
  });
  const records=query.data?.rows||[];
  const today=query.data?.today||"";
  const selectable=useMemo(()=>records.filter(
    row=>!row.confirmed && row.day<=today
  ),[records,today]);
  const shownSelected=selectable.filter(row=>Boolean(marked[keyOf(row)]));
  const allSelected=selectable.length>0&&shownSelected.length===selectable.length;
  const selectedCount=Object.keys(marked).length;
  const total=query.data?.total||0;
  const hasNext=(page+1)*PAGE_SIZE<total;

  useEffect(()=>{setPage(0);setMarked({});setError("");},[kind,period,Boolean(selected)]);
  const toggle=(row:DashboardVisitRow,checked:boolean)=>{
    const key=keyOf(row);
    setMarked(old=>{
      const next={...old};
      if(checked)next[key]=row;else delete next[key];
      return next;
    });
  };
  const toggleAll=(checked:boolean)=>{
    setMarked(old=>{
      const next={...old};
      for(const row of selectable){
        if(checked)next[keyOf(row)]=row;
        else delete next[keyOf(row)];
      }
      return next;
    });
  };
  const confirm=async()=>{
    const chosen=Object.values(marked);
    if(!selected||!chosen.length||saving||!canConfirm)return;
    const future=chosen.filter(v=>v.day>today||v.confirmed||v.kind!==kind);
    if(future.length){
      setError("Uma seleção está inválida ou já confirmada. Atualize a lista.");return;
    }
    if(!window.confirm(
      "Confirmar que "+chosen.length+" cliente(s) compareceu(ram) para "+
      visitLabel[kind].toLowerCase()+"? Essa confirmação será registrada com o funcionário e horário. "+
      "Não movimenta o estoque nem registra entrega/devolução física dos trajes."
    ))return;
    setSaving(true);setError("");
    let saved=0;
    try{
      const byDay=new Map<string,string[]>();
      for(const row of chosen){
        byDay.set(row.day,[...(byDay.get(row.day)||[]),row.contract_id]);
      }
      for(const [day,ids] of byDay.entries()){
        const result=await confirmDashboardVisits(ids,kind,day);
        saved+=result.confirmed;
      }
      setMarked({});
      toast({title:"Comparecimentos confirmados",
        description:saved+" registro(s) salvos no Supabase."});
    }catch(cause){
      const message=cause instanceof Error?cause.message:"Falha ao confirmar presença.";
      setError((saved>0?saved+" registro(s) confirmados antes do erro. ":"")+message);
      setMarked({});
    }finally{
      await queryClient.invalidateQueries({queryKey:["closet-dashboard-visits"]});
      await queryClient.invalidateQueries({queryKey:["closet-live-operations"]});
      setSaving(false);
    }
  };

  return <Dialog open={Boolean(selected)} onOpenChange={(open)=>{if(!open&&!saving)onClose();}}>
    <DialogContent className="flex h-[88vh] max-h-[850px] w-[96vw] max-w-5xl flex-col gap-0 overflow-hidden border-marsala-200 p-0">
      <DialogHeader className="shrink-0 space-y-1 border-b px-5 py-4 text-left">
        <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-marsala-800">
          <CheckCheck className="h-5 w-5"/>
          {visitLabel[kind]} — {visitPeriodLabel[period].toLowerCase()}
        </DialogTitle>
        <DialogDescription>
          Selecione os contratos dos clientes que compareceram à loja e confirme a presença.
          A lista usa os compromissos reais dos contratos.
        </DialogDescription>
      </DialogHeader>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
        {kind!=="prova"&&<div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
          <strong>Importante:</strong> confirmar o comparecimento {kind==="retirada"?"não registra a entrega":"não registra a devolução"}
          {" "}dos trajes. A operação física deve ser concluída na ficha do contrato para
          atualizar o estoque e, na devolução, encaminhar o traje à lavanderia.
        </div>}
        {query.isPending&&<p role="status" className="py-8 text-center text-sm text-muted-foreground">
          Consultando compromissos no Supabase...
        </p>}
        {query.isError&&<div role="alert" className="rounded-md border border-red-200 p-4 text-sm text-red-700">
          {query.error instanceof Error?query.error.message:"Não foi possível carregar a lista."}
          <Button variant="outline" size="sm" className="ml-2" onClick={()=>void query.refetch()}>
            Tentar novamente
          </Button>
        </div>}
        {error&&<p role="alert" className="rounded-md border border-red-200 p-3 text-sm text-red-700">
          {error}
        </p>}
        {query.isSuccess&&<div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{total} compromisso(s) · {selectedCount} selecionado(s)</span>
            <Button variant="outline" size="sm" disabled={saving||query.isFetching}
              onClick={()=>void query.refetch()}>
              <RefreshCw className="mr-2 h-4 w-4"/>Atualizar lista
            </Button>
          </div>
          {records.length===0&&<p className="rounded-md border px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhum contrato encontrado para este tipo e período.
          </p>}
          {records.length>0&&<div className="overflow-x-auto">
            <table className="w-full min-w-[660px] border-collapse text-left text-sm">
              <thead className="border-b text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="w-12 px-2 py-3">
                    <Checkbox aria-label="Selecionar pendentes desta página" checked={allSelected}
                      disabled={!canConfirm||!selectable.length||saving}
                      onCheckedChange={value=>toggleAll(value===true)}/>
                  </th>
                  <th className="px-2 py-3">Cliente / Pedido</th>
                  <th className="px-2 py-3">Data / Horário</th>
                  <th className="px-2 py-3">Comparecimento</th>
                  <th className="px-2 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {records.map(row=><tr key={keyOf(row)} className="border-b align-top last:border-0 hover:bg-muted/30">
                  <td className="px-2 py-4">
                    <Checkbox aria-label={"Selecionar pedido "+row.contract_number}
                      checked={Boolean(marked[keyOf(row)])} disabled={!canConfirm||saving||row.confirmed||row.day>today}
                      onCheckedChange={value=>toggle(row,value===true)}/>
                  </td>
                  <td className="px-2 py-4">
                    <strong className="block max-w-[240px] break-words">{row.client_name}</strong>
                    <Link to={"/pdv/pedidos/"+row.contract_id} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-medium text-marsala-800 hover:underline">
                      Pedido ALU-{String(row.contract_number).padStart(6,"0")}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {row.items_total} traje(s) vinculado(s)
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-4">
                    {visitDateBR(row.day)}
                    <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5"/>{row.time||"Horário a definir"}
                    </span>
                  </td>
                  <td className="px-2 py-4">
                    <Badge variant={row.confirmed?"secondary":"outline"}
                      className={row.confirmed?"bg-emerald-100 text-emerald-800":"border-amber-200 text-amber-800"}>
                      {row.confirmed?"Confirmado":"Aguardando"}
                    </Badge>
                    {row.physical_complete&&kind!=="prova"&&<p className="mt-1 text-xs text-emerald-800">
                      Movimentação física já registrada
                    </p>}
                    {row.day>today&&<p className="mt-1 text-xs text-muted-foreground">
                      Aguardando data do atendimento
                    </p>}
                  </td>
                  <td className="px-2 py-4">
                    <Button asChild size="sm" variant="outline" title="Abrir contrato">
                      <Link to={"/pdv/pedidos/"+row.contract_id} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1 h-4 w-4"/>Abrir
                      </Link>
                    </Button>
                  </td>
                </tr>)}
              </tbody>
            </table>
          </div>}
        </div>}
      </div>
      <div className="shrink-0 space-y-3 border-t bg-background px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {total?("Exibindo "+(page*PAGE_SIZE+1)+"–"+Math.min((page+1)*PAGE_SIZE,total)+" de "+total):"Nenhum registro"}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page===0||saving||query.isFetching}
              onClick={()=>setPage(p=>Math.max(0,p-1))}>Anterior</Button>
            <Button size="sm" variant="outline" disabled={!hasNext||saving||query.isFetching}
              onClick={()=>setPage(p=>p+1)}>Próxima</Button>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" disabled={saving} onClick={onClose}>Fechar</Button>
          <Button className="bg-marsala hover:bg-marsala-700" disabled={!selectedCount||saving||!canConfirm}
            onClick={()=>void confirm()}>
            <CheckCircle2 className="mr-2 h-4 w-4"/>
            {saving?"Salvando...":"Confirmar comparecimento ("+selectedCount+")"}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}
