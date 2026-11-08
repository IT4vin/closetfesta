import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CalendarCheck2, CheckCircle2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  checkCartProductAvailability, datesForAvailability,
  type ProductCartAvailability,
} from "@/lib/cartAvailability";
import type { OrderDates } from "@/components/pdv/PDVSale";
import { productHistoryDate } from "@/lib/productRentalHistory";

const blankDates = (): OrderDates => ({
  tryOnDate: "", pickupDate: "", eventDate: "", returnDate: "",
});
const fields: {key:keyof OrderDates; label:string; optional?:boolean}[] = [
  {key:"tryOnDate",label:"Data da prova",optional:true},
  {key:"pickupDate",label:"Retirada"},
  {key:"eventDate",label:"Evento"},
  {key:"returnDate",label:"Devolução"},
];

export default function ProductHistoryAvailabilityPanel({productId}: {productId:string|null}) {
  const [dates,setDates]=useState<OrderDates>(blankDates);
  const [availability,setAvailability]=useState<ProductCartAvailability|null>(null);
  const [consultedDates,setConsultedDates]=useState<OrderDates|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [shownConflicts,setShownConflicts]=useState(10);
  const sequence=useRef(0);

  useEffect(()=>{
    sequence.current++;
    setDates(blankDates());
    setAvailability(null);
    setConsultedDates(null);
    setBusy(false);
    setError("");
    setShownConflicts(10);
    return()=>{sequence.current++;};
  },[productId]);

  const editDate=(key:keyof OrderDates,value:string)=>{
    sequence.current++;
    setDates(previous=>({...previous,[key]:value}));
    setAvailability(null);
    setConsultedDates(null);
    setError("");
    setBusy(false);
    setShownConflicts(10);
  };

  const consult=async(event:React.FormEvent)=>{
    event.preventDefault();
    if(!productId)return;
    if(!datesForAvailability(dates)){
      setError("Informe retirada, evento e devolução em ordem cronológica. A prova, se preenchida, deve ser anterior à retirada.");
      setAvailability(null);
      setConsultedDates(null);
      return;
    }
    const request=++sequence.current;
    setBusy(true);
    setError("");
    setAvailability(null);
    setConsultedDates(null);
    try{
      // A mesma RPC do PDV confere todas as reservas ativas e o estado físico do exemplar.
      // A conferência é informativa e não cria/bloqueia uma reserva.
      const response=await checkCartProductAvailability(productId,1,dates);
      if(request!==sequence.current)return;
      setAvailability(response);
      setConsultedDates({...dates});
    }catch(cause){
      if(request!==sequence.current)return;
      setError(cause instanceof Error?cause.message:"Não foi possível consultar a disponibilidade.");
    }finally{
      if(request===sequence.current)setBusy(false);
    }
  };

  const conflicts=availability?.conflicts||[];
  return <section aria-label="Consultar disponibilidade por datas"
    className="mb-5 space-y-3 rounded-xl border border-marsala-200 bg-background p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-marsala-800">
          <CalendarCheck2 className="h-4 w-4" aria-hidden="true"/>
          Consultar disponibilidade do produto
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Escolha as datas para verificar o período de locação, sem criar um contrato.
        </p>
      </div>
      <Badge variant="outline" className="border-marsala-200 text-marsala-800">
        Consulta no Supabase
      </Badge>
    </div>
    <form onSubmit={(event)=>void consult(event)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {fields.map(({key,label,optional})=><div key={key} className="space-y-1.5">
          <Label htmlFor={"product-history-"+key} className="text-xs font-medium">
            {label}{optional?" (opcional)":""}
          </Label>
          <Input id={"product-history-"+key} type="date" required={!optional}
            disabled={!productId} value={dates[key]}
            onChange={(event)=>editDate(key,event.target.value)}
            className="h-10 text-sm focus-visible:ring-marsala-500"/>
        </div>)}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-lg text-xs text-muted-foreground">
          A disponibilidade do traje considera <strong>retirada até devolução</strong>.
          A data de prova não confirma vaga na agenda de provas ou da costura.
        </p>
        <Button type="submit" size="sm" disabled={busy||!productId}
          className="bg-marsala hover:bg-marsala-700">
          <Search className="mr-2 h-4 w-4" aria-hidden="true"/>
          {busy?"Consultando...":"Consultar disponibilidade"}
        </Button>
      </div>
    </form>

    {error&&<p role="alert" className="rounded-md border border-red-200 p-3 text-sm text-red-700">
      {error}
    </p>}
    {busy&&<p role="status" className="text-sm text-muted-foreground">
      Conferindo o estoque e os contratos no Supabase...
    </p>}
    {availability&&consultedDates&&<div className="space-y-3 border-t pt-3" aria-live="polite">
      <div className="flex flex-wrap items-start gap-3">
        {availability.available
          ?<CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true"/>
          :<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden="true"/>}
        <div className="min-w-0 flex-1">
          <p className={"font-semibold "+(availability.available?"text-emerald-800":"text-red-700")}>
            {availability.available?"Produto disponível no período consultado":
              "Produto indisponível no período consultado"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {productHistoryDate(consultedDates.pickupDate)} até {productHistoryDate(consultedDates.returnDate)}
            {" · "}{availability.free_units} exemplar(es) livre(s) no período
            {" · "}{availability.physical_available_units} exemplar(es) com estado físico disponível
          </p>
          {availability.available&&conflicts.length>0&&<p className="mt-1 text-xs text-amber-800">
            Existem outras reservas no período, mas ainda há exemplar disponível.
          </p>}
          {!availability.available&&conflicts.length===0&&<p className="mt-1 text-xs text-muted-foreground">
            Não há conflito de contrato ativo nessa faixa. Confira lavanderia, manutenção e o estado do estoque.
          </p>}
        </div>
      </div>
      {conflicts.length>0&&<div className="space-y-2">
        <p className="text-xs font-semibold">Reservas coincidentes ({conflicts.length})</p>
        <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
          {conflicts.slice(0,shownConflicts).map((item)=>
            <div key={item.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-amber-200 p-2.5 text-xs">
              <div>
                <Link className="font-semibold text-marsala-800 hover:underline"
                  to={"/pdv/pedidos/"+item.contract_id}>
                  Contrato ALU-{String(item.contract_number).padStart(6,"0")}
                </Link>
                <p className="mt-0.5 text-muted-foreground">
                  Exemplar {item.unit_number} · Retirada {productHistoryDate(item.pickup_date)}
                  {" · "}Devolução {productHistoryDate(item.return_date)}
                </p>
              </div>
              <Badge variant="outline" className="text-amber-800">Datas coincidentes</Badge>
            </div>)}
          {shownConflicts<conflicts.length&&<Button type="button" variant="outline" size="sm"
            onClick={()=>setShownConflicts(count=>count+25)}>
            Mostrar mais {Math.min(25,conflicts.length-shownConflicts)} reservas
          </Button>}
        </div>
      </div>}
      <p className="text-xs text-muted-foreground">
        Consulta informativa: outra locação pode ser registrada depois desta verificação.
        A confirmação final de disponibilidade ocorre no PDV.
      </p>
    </div>}
  </section>;
}
