import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock,Clock3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Visit = { id:string;title:string;start_at:string;status:string };
const format=(iso:string)=>new Intl.DateTimeFormat("pt-BR",{
 timeZone:"America/Sao_Paulo",day:"2-digit",month:"2-digit",year:"numeric",
 hour:"2-digit",minute:"2-digit",
}).format(new Date(iso));

export default function OrderVisitTimes({contractId}:{contractId:string}){
 const query=useQuery({
  queryKey:["closet-order-visits",contractId],
  enabled:Boolean(contractId),
  queryFn:async()=>{
    const {data,error}=await (supabase as any).from("appointments")
      .select("id,title,start_at,status").eq("contract_id",contractId)
      .neq("status","cancelled").order("start_at",{ascending:true});
    if(error)throw new Error(error.message);
    return (data||[]) as Visit[];
  },staleTime:0,refetchOnMount:"always",
 });
 const visits=query.data||[];
 return <div className="rounded-lg border border-marsala-100 bg-marsala-50/30 p-3 text-sm">
  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
   <strong className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-marsala-800"/>
    Horários de prova e retirada</strong>
   <Link to="/calendar" className="text-xs font-semibold text-marsala-800 hover:underline">
     Consultar agenda
   </Link>
  </div>
  {query.isPending&&<span className="text-xs text-muted-foreground">Consultando horários...</span>}
  {query.error&&<p role="alert" className="text-xs text-red-700">
    {query.error instanceof Error?query.error.message:"Horários indisponíveis."}
  </p>}
  {query.isSuccess&&visits.length===0&&<p className="text-xs text-muted-foreground">
    Este contrato ainda não possui horários marcados. Consulte a agenda para definir os horários.
  </p>}
  <div className="grid gap-2 sm:grid-cols-2">
   {visits.map(v=><p key={v.id} className="flex items-center gap-2">
    <Clock3 className="h-4 w-4 text-marsala-700"/>
    <strong>{v.title}:</strong> {format(v.start_at)}
   </p>)}
  </div>
 </div>;
}
