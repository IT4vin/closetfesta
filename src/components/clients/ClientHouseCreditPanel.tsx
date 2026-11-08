import React, {useEffect,useRef,useState} from "react";
import { Link } from "react-router-dom";
import { useQuery,useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft,History,Wallet,PlusCircle,RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { useAuth } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { fetchAllRows } from "@/hooks/useLiveClosetData";
import {
  getCreditStatement,getCreditUsage,transferHouseCredit,redeemHouseCredit,
  moneyCredit,positiveMoney,type CreditKind,
} from "@/lib/houseCredits";

const labels:Record<CreditKind,string>={
  adjustment:"Ajuste gerencial",transfer_in:"Crédito recebido",
  transfer_out:"Crédito transferido",cancellation_credit:"Crédito de cancelamento",
  redemption:"Crédito utilizado em locação",
};
const formatTime=(iso:string)=>new Date(iso).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"});
const amountOf=(input:string)=>Number(input.replace(",","."));
const makeOperation=(reference:React.MutableRefObject<{signature:string;id:string}|null>,signature:string)=>{
  if(!reference.current||reference.current.signature!==signature)
    reference.current={signature,id:crypto.randomUUID()};
  return reference.current.id;
};

export default function ClientHouseCreditPanel({
  clientId,contractId,onChanged,
}:{
  clientId:string;contractId?:string;onChanged?:()=>Promise<unknown>|void;
}){
  const {user}=useAuth();
  const role=user?.role?.id;
  const manager=role==="admin"||role==="manager";
  const canApply=manager||role==="cashier";
  const {toast}=useToast();
  const cache=useQueryClient();
  const [page,setPage]=useState(0);
  const [transferOpen,setTransferOpen]=useState(false);
  const [redeemOpen,setRedeemOpen]=useState(false);
  const [target,setTarget]=useState("");
  const [amount,setAmount]=useState("");
  const [reason,setReason]=useState("");
  const [proof,setProof]=useState("");
  const [authorized,setAuthorized]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const operation=useRef<{signature:string;id:string}|null>(null);
  useEffect(()=>{setPage(0);setTransferOpen(false);setRedeemOpen(false);
    setTarget("");setAmount("");setReason("");setProof("");setAuthorized(false);
    setError("");operation.current=null;},[clientId]);
  const statement=useQuery({
    queryKey:["house-credit-client",clientId,page],
    queryFn:()=>getCreditStatement(clientId,page),
    enabled:Boolean(user?.id&&clientId),
    staleTime:0,refetchOnMount:"always",
  });
  const usage=useQuery({
    queryKey:["house-credit-contract",contractId],
    enabled:Boolean(user?.id&&contractId),
    queryFn:()=>getCreditUsage(contractId!),
    staleTime:0,refetchOnMount:"always",
  });
  const customers=useQuery({
    queryKey:["house-credit-destinations"],
    enabled:transferOpen&&manager,
    queryFn:async()=>{
      const rows=await fetchAllRows<{id:string;full_name:string}>("clients","id,full_name");
      return rows.filter(row=>row.id!==clientId).sort((a,b)=>
        a.full_name.localeCompare(b.full_name,"pt-BR"));
    },
  });
  const balance=Number(statement.data?.balance||0);
  const remaining=Number(usage.data?.remaining||0);
  const canSpend=canApply&&Boolean(contractId)&&
    Boolean(usage.data&&["confirmed","picked_up"].includes(usage.data.status))&&
    balance>0&&remaining>0;
  const reset=(mode:"transfer"|"redeem")=>{
    setTransferOpen(mode==="transfer");setRedeemOpen(mode==="redeem");
    setAmount(mode==="redeem"?Math.min(balance,remaining).toFixed(2):"");
    setTarget("");setReason("");setProof("");setAuthorized(false);
    setError("");operation.current=null;
  };
  const changed=()=>{
    operation.current=null;
    setError("");
  };
  const invalidate=async()=>{
    await cache.invalidateQueries({queryKey:["house-credit-client"]});
    await cache.invalidateQueries({queryKey:["house-credit-contract"]});
    await cache.invalidateQueries({queryKey:["closet-live-operations"]});
    await cache.invalidateQueries({queryKey:["closet-live-finance"]});
    if(onChanged)await onChanged();
  };
  const transfer=async(e:React.FormEvent)=>{
    e.preventDefault();
    const value=amountOf(amount);
    if(busy||!manager)return;
    if(!positiveMoney(value)||value>balance||!target||!authorized||
      proof.trim().length<10||reason.trim().length<3){
      setError("Confirme saldo, cliente destinatário, autorização do titular e motivo.");
      return;
    }
    if(!window.confirm("Transferir "+moneyCredit(value)+" do crédito de "+statement.data?.client_name+
      " para "+customers.data?.find(c=>c.id===target)?.full_name+
      "? A autorização do titular foi conferida e será registrada."))return;
    const id=makeOperation(operation,JSON.stringify([clientId,target,value,reason,proof]));
    setBusy(true);setError("");
    try{
      await transferHouseCredit({from:clientId,to:target,amount:value,reason,
        authorizationReference:proof,operationId:id});
      operation.current=null;setTransferOpen(false);
      toast({title:"Crédito transferido",description:"Saldo e autorização registrados no Supabase."});
      await invalidate();
    }catch(cause){setError(cause instanceof Error?cause.message:"Transferência não confirmada.");}
    finally{setBusy(false);}
  };
  const redeem=async(e:React.FormEvent)=>{
    e.preventDefault();
    const value=amountOf(amount);
    if(busy||!contractId||!canSpend)return;
    if(!positiveMoney(value)||value>balance||value>remaining||reason.trim().length<3){
      setError("Valor maior que o crédito ou saldo do pedido, ou motivo não informado.");return;
    }
    if(!window.confirm("Aplicar "+moneyCredit(value)+" de crédito neste contrato?"+
      " O resgate diminui o saldo de crédito, mas não registra recebimento novo."))return;
    const id=makeOperation(operation,JSON.stringify([contractId,value,reason]));
    setBusy(true);setError("");
    try{
      await redeemHouseCredit({contractId,amount:value,reason,operationId:id});
      operation.current=null;setRedeemOpen(false);
      toast({title:"Crédito aplicado ao contrato",
        description:"Crédito abatido sem gerar recebimento duplicado."});
      await invalidate();
    }catch(cause){setError(cause instanceof Error?cause.message:"Resgate não confirmado.");}
    finally{setBusy(false);}
  };

  return <Card className="border-marsala-200">
    <CardHeader className="pb-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-5 w-5 text-marsala-800"/>Crédito na loja
        </CardTitle>
        <Button size="sm" variant="outline" disabled={statement.isFetching}
          onClick={()=>void invalidate()}>
          <RefreshCw className="mr-2 h-4 w-4"/>Atualizar
        </Button>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      {statement.isPending&&<p role="status" className="text-sm text-muted-foreground">Consultando saldo real...</p>}
      {statement.isError&&<p role="alert" className="text-sm text-red-700">
        {statement.error instanceof Error?statement.error.message:"Não foi possível consultar os créditos."}
      </p>}
      {statement.isSuccess&&<div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-marsala-50 p-4">
          <div>
            <p className="text-xs text-marsala-800">Saldo disponível de {statement.data.client_name}</p>
            <p className="text-2xl font-bold text-marsala-900">{moneyCredit(balance)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {manager&&balance>0&&<Button size="sm" variant="outline"
              className="border-marsala-200 text-marsala-800" onClick={()=>reset("transfer")}>
              <ArrowRightLeft className="mr-2 h-4 w-4"/>Transferir
            </Button>}
            {canSpend&&<Button size="sm" className="bg-marsala hover:bg-marsala-700"
              onClick={()=>reset("redeem")}>
              <PlusCircle className="mr-2 h-4 w-4"/>Usar neste pedido
            </Button>}
          </div>
        </div>
        {contractId&&usage.isSuccess&&<div className="grid gap-2 rounded-lg border p-3 text-xs sm:grid-cols-3">
          <div>Crédito aplicado neste pedido
            <strong className="mt-1 block text-sm">{moneyCredit(Number(usage.data.credit_applied))}</strong>
          </div>
          <div>Recebido por outros meios
            <strong className="mt-1 block text-sm">{moneyCredit(Number(usage.data.cash_paid))}</strong>
          </div>
          <div>Saldo do pedido após créditos
            <strong className="mt-1 block text-sm text-marsala-900">{moneyCredit(remaining)}</strong>
          </div>
        </div>}
        {contractId&&usage.isError&&<p role="alert" className="text-xs text-red-700">
          Não foi possível consultar os créditos aplicados neste pedido.
        </p>}
        {transferOpen&&manager&&<form onSubmit={e=>void transfer(e)}
          className="space-y-3 rounded-lg border border-marsala-200 p-4">
          <h4 className="font-semibold">Transferir crédito para outro cliente</h4>
          <p className="text-xs text-muted-foreground">
            Transferência realizada pela gerência após autorização do titular.
          </p>
          <div className="space-y-1">
            <Label htmlFor="credit-destination">Cliente que receberá o crédito *</Label>
            <select id="credit-destination" required value={target} onChange={e=>{setTarget(e.target.value);changed();}}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Selecione um cadastro</option>
              {(customers.data||[]).map(c=><option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
            {customers.isError&&<p className="text-xs text-red-700">Erro ao carregar clientes destinatários.</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="credit-transfer-amount">Valor a transferir (R$) *</Label>
            <Input id="credit-transfer-amount" type="number" min="0.01" step="0.01"
              max={balance} required value={amount}
              onChange={e=>{setAmount(e.target.value);changed();}}/>
          </div>
          <div className="space-y-1">
            <Label htmlFor="credit-transfer-proof">Referência da autorização do titular *</Label>
            <Input id="credit-transfer-proof" required minLength={10} maxLength={180}
              placeholder="Ex.: autorização presencial registrada na loja em 08/11"
              value={proof} onChange={e=>{setProof(e.target.value);changed();}}/>
          </div>
          <div className="space-y-1">
            <Label htmlFor="credit-transfer-reason">Motivo da transferência *</Label>
            <Input id="credit-transfer-reason" required minLength={3} maxLength={220}
              value={reason} onChange={e=>{setReason(e.target.value);changed();}}/>
          </div>
          <label className="flex items-start gap-2 text-xs">
            <Checkbox checked={authorized} onCheckedChange={checked=>{setAuthorized(checked===true);changed();}}/>
            Confirmo que o titular autorizou transferir o saldo para o destinatário informado.
          </label>
          {error&&<p role="alert" className="text-xs text-red-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={()=>setTransferOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={busy||!authorized||!target||customers.isError}
              className="bg-marsala hover:bg-marsala-700">{busy?"Registrando...":"Confirmar transferência"}</Button>
          </div>
        </form>}
        {redeemOpen&&canSpend&&<form onSubmit={e=>void redeem(e)}
          className="space-y-3 rounded-lg border border-marsala-200 p-4">
          <h4 className="font-semibold">Usar crédito neste contrato</h4>
          <p className="text-xs text-muted-foreground">
            Limite para este pedido: {moneyCredit(Math.min(balance,remaining))}. O uso de crédito
            reduz o saldo a pagar, mas não é um novo recebimento.
          </p>
          <Label htmlFor="credit-redeem-amount">Valor (R$)</Label>
          <Input id="credit-redeem-amount" type="number" min="0.01" step="0.01"
            max={Math.min(balance,remaining)} required value={amount}
            onChange={e=>{setAmount(e.target.value);changed();}}/>
          <Label htmlFor="credit-redeem-reason">Observação do resgate</Label>
          <Input id="credit-redeem-reason" required minLength={3} maxLength={180}
            placeholder="Ex.: utilização de crédito de cancelamento"
            value={reason} onChange={e=>{setReason(e.target.value);changed();}}/>
          {error&&<p role="alert" className="text-xs text-red-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={()=>setRedeemOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={busy} className="bg-marsala hover:bg-marsala-700">
              {busy?"Salvando...":"Aplicar crédito"}
            </Button>
          </div>
        </form>}
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <History className="h-4 w-4"/>Histórico de créditos ({statement.data.total_entries})
          </h4>
          {statement.data.entries.length===0&&<p className="text-xs text-muted-foreground">
            Nenhuma movimentação de crédito registrada para este cliente.
          </p>}
          {statement.data.entries.map(entry=><div key={entry.id}
            className="flex flex-wrap items-start justify-between gap-2 border-b py-2 text-xs last:border-0">
            <div className="max-w-lg">
              <p className="font-semibold">{labels[entry.kind]??entry.kind}</p>
              <p className="text-muted-foreground">{formatTime(entry.created_at)} · {entry.note}</p>
              {entry.related_client_name&&<p className="text-muted-foreground">
                Cliente relacionado: {entry.related_client_name}
              </p>}
              {entry.source_contract_id&&<Link className="text-marsala-800 hover:underline"
                to={"/pdv/pedidos/"+entry.source_contract_id}>
                Contrato ALU-{String(entry.contract_number).padStart(6,"0")}
              </Link>}
            </div>
            <strong className={Number(entry.delta)>=0?"text-emerald-700":"text-red-700"}>
              {Number(entry.delta)>0?"+":""}{moneyCredit(Number(entry.delta))}
            </strong>
          </div>)}
          {statement.data.total_entries>30&&<div className="flex items-center justify-end gap-2">
            <Button type="button" size="sm" variant="outline" disabled={page===0||statement.isFetching}
              onClick={()=>setPage(v=>Math.max(0,v-1))}>Anterior</Button>
            <span className="text-xs text-muted-foreground">Página {page+1}</span>
            <Button type="button" size="sm" variant="outline"
              disabled={(page+1)*30>=statement.data.total_entries||statement.isFetching}
              onClick={()=>setPage(v=>v+1)}>Próxima</Button>
          </div>}
        </div>
      </div>}
    </CardContent>
  </Card>;
}
