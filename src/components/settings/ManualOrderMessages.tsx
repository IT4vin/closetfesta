import React, {useEffect,useMemo,useState} from "react";
import {Button} from "@/components/ui/button";
import {Card,CardContent,CardHeader,CardTitle} from "@/components/ui/card";
import {loadClosetSettings,type ClosetSettingValues} from "@/lib/closetSettings";
import type {OrderDetail} from "@/lib/rentalOrderDetails";

const labels: Record<string,string> = {
  fitting_confirmation:"Confirmação de prova",
  pickup_confirmation:"Confirmação de retirada",
  return_reminder:"Lembrete de devolução",
  late_return:"Devolução em atraso",
  pending_payment:"Pagamento pendente",
  location_notice:"Mudança de endereço",
};
const date=(value?:string|null)=>{
  if(!value)return "não informada";
  const m=/^(\\d{4})-(\\d{2})-(\\d{2})/.exec(value);
  return m?m[3]+"/"+m[2]+"/"+m[1]:"não informada";
};
export function renderOrderMessage(template:string,variables:Record<string,string>):string {
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi,(match,key:string)=>
    Object.prototype.hasOwnProperty.call(variables,key)?variables[key]:match);
}
export default function ManualOrderMessages({detail}:{detail:OrderDetail}) {
  const [messages,setMessages]=useState<ClosetSettingValues>({});
  const [company,setCompany]=useState<ClosetSettingValues>({});
  const [selected,setSelected]=useState("fitting_confirmation");
  const [error,setError]=useState("");
  const [status,setStatus]=useState("");
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    let active=true;
    void Promise.all([loadClosetSettings("messages"),loadClosetSettings("company")])
      .then(([models,shop])=>{
        if(!active)return;
        setMessages(models);setCompany(shop);setLoading(false);
      }).catch(cause=>{
        if(!active)return;
        setError(cause instanceof Error?cause.message:"Não foi possível carregar os modelos.");
        setLoading(false);
      });
    return()=>{active=false;};
  },[]);
  const first=detail.order.items[0];
  const fmtMoney=(n:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n);
  const address=[company.street,company.number,company.complement,company.neighborhood,
    company.city,company.state].filter(Boolean).join(", ");
  const variables={
    cliente_nome:detail.customer.full_name,
    pedido_numero:detail.order.order_number,
    contrato_numero:detail.order.order_number,
    data_prova:date(first?.try_on_date),
    data_retirada:date(first?.pickup_date),
    data_evento:date(first?.event_date),
    data_devolucao:date(first?.return_date),
    valor_total:fmtMoney(Number(detail.order.total)),
    saldo_pendente:detail.payments===null?"Consulte a loja":fmtMoney(Math.max(0,Number(detail.order.total)-
      detail.payments.filter(p=>p.status!=="reversed").reduce((sum,p)=>sum+Number(p.amount),0))),
    endereco:address||"Endereço não cadastrado",
  };
  const preview=renderOrderMessage(String(messages[selected]??""),variables);
  const phone=useMemo(()=>{
    const digits=(detail.customer.phone??"").replace(/\D/g,"");
    if(/^55\d{10,11}$/.test(digits))return digits;
    if(/^\d{10,11}$/.test(digits))return "55"+digits;
    return "";
  },[detail.customer.phone]);
  const copy=async()=>{
    try {await navigator.clipboard.writeText(preview);setStatus("Mensagem copiada. O envio deve ser feito manualmente.");}
    catch {setStatus("Não foi possível copiar. Selecione o texto na pré-visualização.");}
  };
  return <Card className="mt-3">
    <CardHeader><CardTitle className="text-sm">Mensagens ao cliente</CardTitle></CardHeader>
    <CardContent className="space-y-3">
      {loading&&<p className="text-xs text-muted-foreground">Buscando modelos...</p>}
      {error&&<p role="alert" className="text-xs text-red-700">{error}</p>}
      {!loading&&!error&&<>
        <select aria-label="Modelo da mensagem" className="h-10 w-full rounded-md border bg-background px-2 text-sm"
          value={selected} onChange={e=>{setSelected(e.target.value);setStatus("");}}>
          {Object.entries(labels).map(([key,label])=><option key={key} value={key}>{label}</option>)}
        </select>
        <div className="min-h-20 whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-xs">
          {preview||"Modelo não cadastrado. Configure o texto em Configurações → Avisos e mensagens."}
        </div>
        {status&&<p role="status" className="text-xs text-muted-foreground">{status}</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" disabled={!preview} onClick={()=>void copy()}>
            Copiar mensagem
          </Button>
          <Button type="button" size="sm" disabled={!preview||!phone}
            className="bg-marsala-600 hover:bg-marsala-700"
            onClick={()=>window.open("https://wa.me/"+phone+"?text="+encodeURIComponent(preview),"_blank","noopener,noreferrer")}>
            Abrir WhatsApp
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">A mensagem não é enviada automaticamente. Revise datas e valores antes de compartilhar.</p>
      </>}
    </CardContent>
  </Card>;
}
