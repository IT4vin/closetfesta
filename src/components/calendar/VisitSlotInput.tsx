import React,{useEffect,useState} from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getVisitSlot,type SlotAvailability } from "@/lib/closetCalendar";

export default function VisitSlotInput({
 id,kind,day,time,onChange,required=true,disabled=false,
}:{
 id:string;kind:"Prova"|"Retirada";day:string;time:string;
 onChange:(value:string)=>void;required?:boolean;disabled?:boolean;
}){
 const [slot,setSlot]=useState<SlotAvailability|null>(null);
 const [error,setError]=useState("");
 const [pending,setPending]=useState(false);
 useEffect(()=>{
  let active=true;
  setSlot(null);setError("");setPending(false);
  if(!day||!time)return()=>{active=false;};
  setPending(true);
  void getVisitSlot(kind,day,time).then(info=>{
   if(active)setSlot(info);
  }).catch(cause=>{
   if(active)setError(cause instanceof Error?cause.message:"Erro na consulta do horário");
  }).finally(()=>{if(active)setPending(false);});
  return()=>{active=false;};
 },[kind,day,time]);
 return <div className="space-y-1.5">
  <Label htmlFor={id} className="text-xs font-medium">Horário da {kind.toLowerCase()}{required?" *":""}</Label>
  <Input id={id} aria-label={"Horário da "+kind.toLowerCase()} type="time" step={300}
    value={time} onChange={event=>onChange(event.target.value)}
    required={required&&Boolean(day)} disabled={disabled||!day}
    className="h-10 border-marsala-200 focus-visible:ring-marsala-500"/>
  {!day&&<p className="text-xs text-muted-foreground">Escolha a data primeiro.</p>}
  {pending&&<p className="text-xs text-muted-foreground">Conferindo vagas deste horário...</p>}
  {error&&<p role="alert" className="text-xs text-red-700">{error}</p>}
  {slot&&<p className={"text-xs "+(slot.available?"text-emerald-800":"text-red-700")}>
   {slot.occupied} de {slot.capacity} atendimento(s) simultâneos.
   {slot.available?" Horário com vaga.":" "+(slot.reason||"Horário indisponível")+". "}
  </p>}
 </div>;
}
