import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Plus, Minus, X, ShoppingCart, UserRound, CalendarDays, CreditCard,
  Trash2, Keyboard, Save, ArrowRight, PackageSearch, ClipboardList,
  RefreshCw, ShoppingBag, ShieldCheck, History, ChevronDown, SlidersHorizontal,
  FileText, AlertCircle, Shirt, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/stores/authStore";
import PDVProductGallery, { PDVProductPhoto, rentalPrice, isAvailableForRental } from "./PDVProductGallery";
import type { Product } from "@/lib/api";
import type { CartItem, OrderDates } from "./PDVSale";
import VisitSlotInput from "@/components/calendar/VisitSlotInput";
import { conflictApproved, type CartConflictApproval, type ProductCartAvailability } from "@/lib/cartAvailability";

const currency=(value:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(value);
const identity=(p:Product)=>[p.name,p.sku,p.barcode,p.color,p.type,p.description].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
const fieldBase="h-10 rounded-lg border-border bg-background focus-visible:ring-marsala/50";
const dateFields:[keyof OrderDates,string][]=[
  ["tryOnDate","Prova"],["pickupDate","Retirada"],["eventDate","Evento"],["returnDate","Devolução"]
];

export interface PDVWorkspaceProps {
  products:Product[]; loading:boolean; error:string|null;
  cart:CartItem[]; dates:OrderDates;
  visitTimes:{tryOnTime:string;pickupTime:string};
  onVisitTimesChange:(next:{tryOnTime:string;pickupTime:string})=>void;
  customer:{id?:string;name:string;document:string;phone?:string}|null;
  searchValue:string; setSearchValue:(value:string)=>void;
  observations:string; setObservations:(value:string)=>void;
  globalDiscount:number; setGlobalDiscount:(value:number)=>void;
  globalDiscountType:"percentage"|"amount"; setGlobalDiscountType:(value:"percentage"|"amount")=>void;
  total:number; totalDiscount:number; processing:boolean;
  availability:Record<string,ProductCartAvailability>;
  availabilityBusy:boolean; availabilityError:string;
  overrides:Record<string,CartConflictApproval>;
  onReviewConflict:(productId:string)=>void;
  onDatesChange:(value:OrderDates)=>void;
  onAdd:(product:Product,quantity:number)=>void;
  onQuantityChange:(id:string,qty:number)=>void;
  onItemDiscount:(id:string,amount:number)=>void;
  onRemove:(id:string)=>void;
  onCustomer:()=>void; onRefresh:()=>void; onContinue:()=>void;
  onSaveDraft:()=>Promise<void>; onLoadDraft:()=>Promise<void>;
  onClear:()=>void; onOrders:()=>void;
  draftBusy:boolean; hasDraft:boolean;
}

export default function PDVWorkspace(props:PDVWorkspaceProps){
  const {
    products,loading,error,cart,dates,visitTimes,onVisitTimesChange,customer,searchValue,setSearchValue,
    observations,setObservations,globalDiscount,setGlobalDiscount,
    globalDiscountType,setGlobalDiscountType,total,totalDiscount,processing,
    availability,availabilityBusy,availabilityError,overrides,onReviewConflict,
    onDatesChange,onAdd,onQuantityChange,onItemDiscount,onRemove,onCustomer,
    onRefresh,onContinue,onSaveDraft,onLoadDraft,onClear,onOrders,draftBusy,hasDraft,
  }=props;
  const {user}=useAuth();
  const [qty,setQty]=useState(1);
  const [showMatches,setShowMatches]=useState(false);
  const [advanced,setAdvanced]=useState(false);
  const [notesOpen,setNotesOpen]=useState(false);
  const [discountOpen,setDiscountOpen]=useState(false);
  const [selectedCategory,setSelectedCategory]=useState("all");
  const [onlyAvailable,setOnlyAvailable]=useState(true);
  const searchRef=useRef<HTMLInputElement>(null);
  const manager=user?.role?.id==="admin"||user?.role?.id==="manager";
  const quantity=cart.reduce((sum,item)=>sum+item.quantity,0);
  const subtotal=cart.reduce((sum,item)=>sum+rentalPrice(item)*item.quantity,0);
  const itemDiscount=cart.reduce((sum,item)=>sum+item.discount,0);
  const categories=useMemo(()=>{
    const map=new Map<string,string>();
    products.forEach(p=>map.set(p.category_id||"uncategorized",p.category?.name||"Sem categoria"));
    return Array.from(map.entries()).sort((a,b)=>a[1].localeCompare(b[1],"pt-BR"));
  },[products]);
  const matches=useMemo(()=>{
    const term=searchValue.trim().toLocaleLowerCase("pt-BR");
    return products.filter(p=>{
      if(onlyAvailable&&!isAvailableForRental(p))return false;
      if(selectedCategory!=="all"&&(p.category_id||"uncategorized")!==selectedCategory)return false;
      return !term||identity(p).includes(term);
    });
  },[products,searchValue,onlyAvailable,selectedCategory]);
  const displayMatches=matches.slice(0,8);
  const datesValid=Boolean(dates.pickupDate&&dates.eventDate&&dates.returnDate
    &&dates.pickupDate<dates.eventDate&&dates.eventDate<dates.returnDate
    &&(!dates.tryOnDate||dates.tryOnDate<dates.pickupDate));
  const ready=cart.length>0&&Boolean(customer?.id)&&datesValid&&total>=0&&!processing;
  const canAdd=(product:Product)=>isAvailableForRental(product)
    &&(cart.find(item=>item.id===product.id)?.quantity??0)<Math.min(20,product.quantity);
  const add=(product:Product)=>{
    if(!canAdd(product))return;
    onAdd(product,Math.min(Math.max(1,qty),Math.max(0,Math.min(20,product.quantity)-(cart.find(item=>item.id===product.id)?.quantity??0))));
    setSearchValue("");setShowMatches(false);setQty(1);
    searchRef.current?.focus();
  };
  const quickAdd=()=>{
    const text=searchValue.trim().toLocaleLowerCase("pt-BR");
    if(!text)return;
    const found=matches.find(p=>[p.sku,p.barcode,p.id].some(code=>code?.toLocaleLowerCase("pt-BR")===text))
      ??(matches.length===1?matches[0]:null);
    if(found&&canAdd(found))add(found);
    else setShowMatches(true);
  };
  useEffect(()=>{
    const keydown=(e:KeyboardEvent)=>{
      const el=e.target;
      const editing=el instanceof HTMLElement &&
        el.matches('input,textarea,select,[contenteditable="true"]');
      if(document.querySelector('[role="dialog"]'))return;
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="b"){
        e.preventDefault();setAdvanced(true);
      }else if(e.key==="F8"){
        e.preventDefault();onCustomer();
      }else if(e.key==="F10"){
        e.preventDefault();void onSaveDraft();
      }else if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){
        e.preventDefault();onContinue();
      }else if(e.key==="Escape"&&!editing&&!advanced&&!discountOpen&&!document.querySelector('[role="dialog"]')){
        e.preventDefault();onClear();
      }
    };
    window.addEventListener("keydown",keydown);
    return()=>window.removeEventListener("keydown",keydown);
  },[onCustomer,onSaveDraft,onContinue,onClear,advanced,discountOpen]);

  return <div className="space-y-4 font-sans text-foreground" aria-label="Balcão de locações">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <span className="rounded-xl bg-marsala-50 p-3 text-marsala-800"><ShoppingCart className="h-5 w-5"/></span>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Nova locação</h2>
          <p className="text-xs text-muted-foreground">Atendimento de balcão · Busca, seleção e fechamento</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-marsala-200 bg-marsala-50 text-marsala-800">Locação de trajes</Badge>
        <Button size="sm" variant="outline" className="gap-2" onClick={()=>setAdvanced(true)}>
          <SlidersHorizontal className="h-4 w-4"/>Busca avançada <kbd className="hidden rounded bg-muted px-1.5 py-0.5 text-[10px] xl:inline">Ctrl+B</kbd>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button size="sm" variant="outline" className="gap-2">
            Mais ações <ChevronDown className="h-4 w-4"/></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onSelect={()=>void onSaveDraft()} disabled={draftBusy}><Save className="mr-2 h-4 w-4"/>Salvar para depois</DropdownMenuItem>
            <DropdownMenuItem onSelect={()=>void onLoadDraft()} disabled={!hasDraft||draftBusy}><History className="mr-2 h-4 w-4"/>Recuperar atendimento</DropdownMenuItem>
            <DropdownMenuItem onSelect={onOrders}><ClipboardList className="mr-2 h-4 w-4"/>Ver pedidos</DropdownMenuItem>
            <DropdownMenuItem onSelect={onRefresh}><RefreshCw className="mr-2 h-4 w-4"/>Atualizar catálogo</DropdownMenuItem>
            <DropdownMenuItem onSelect={onClear} disabled={!cart.length}><Trash2 className="mr-2 h-4 w-4"/>Cancelar atendimento</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm" aria-label="Busca e seleção de produtos">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px]">
            <div className="relative min-w-0">
              <Label htmlFor="pdv-product-search" className="mb-2 block text-xs font-semibold">Produto / traje</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                <Input id="pdv-product-search" ref={searchRef} value={searchValue} autoComplete="off"
                  onChange={e=>{setSearchValue(e.target.value);setShowMatches(true);}}
                  onFocus={()=>setShowMatches(true)}
                  onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();quickAdd();}if(e.key==="Escape")setShowMatches(false);}}
                  placeholder="Pesquise por descrição, código (SKU) ou GTIN"
                  className={fieldBase+" pl-10 pr-10"} aria-autocomplete="list" aria-expanded={showMatches}/>
                {searchValue&&<button type="button" aria-label="Limpar pesquisa" onClick={()=>{setSearchValue("");setShowMatches(false);}}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"><X className="h-4 w-4"/></button>}
              </div>
              {showMatches&&searchValue.trim().length>0&&
                <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-popover p-2 shadow-xl">
                  {loading?<p className="p-3 text-sm">Consultando trajes...</p>:
                  displayMatches.length===0?<div className="p-3 text-sm text-muted-foreground">
                    Nenhum traje encontrado. <Button size="sm" variant="link" onClick={()=>setAdvanced(true)}>Busca avançada</Button>
                  </div>:
                  displayMatches.map(p=><button key={p.id} type="button" disabled={!canAdd(p)}
                    onMouseDown={e=>e.preventDefault()} onClick={()=>add(p)}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-marsala-50 disabled:cursor-not-allowed disabled:opacity-50">
                    <PDVProductPhoto product={p} className="h-14 w-12 shrink-0 rounded-md"/>
                    <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{p.name}</strong>
                      <span className="block truncate text-xs text-muted-foreground">SKU: {p.sku??"—"}{p.barcode?" · GTIN: "+p.barcode:""}</span>
                      <span className="text-xs text-muted-foreground">{canAdd(p)?"Selecionar traje":"Indisponível"}</span>
                    </span>
                    <strong className="shrink-0 text-sm text-marsala-800">{currency(rentalPrice(p))}</strong>
                  </button>)}
                  {matches.length>displayMatches.length&&
                    <Button className="w-full" size="sm" variant="ghost" onClick={()=>setAdvanced(true)}>
                      Ver mais {matches.length-displayMatches.length} resultados
                    </Button>}
                </div>}
            </div>
            <div>
              <Label htmlFor="pdv-entry-qty" className="mb-2 block text-xs font-semibold">Quantidade</Label>
              <Input id="pdv-entry-qty" type="number" min={1} max={1000} step={1}
                className={fieldBase+" text-center tabular-nums"} value={qty}
                onChange={e=>setQty(Math.max(1,Math.min(1000,Math.floor(Number(e.target.value)||1))))}/>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <div className="flex flex-wrap gap-2">
              <select aria-label="Categoria do produto" className="h-9 max-w-48 rounded-lg border border-border bg-background px-3 text-xs"
                value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)}>
                <option value="all">Todas as categorias</option>
                {categories.map(([id,name])=><option key={id} value={id}>{name}</option>)}
              </select>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={onlyAvailable} onChange={e=>setOnlyAvailable(e.target.checked)}
                  className="accent-marsala"/>Somente disponíveis
              </label>
            </div>
            <span className="text-xs text-muted-foreground">{loading?"Carregando":matches.length+" trajes encontrados"}</span>
          </div>
          {error&&<div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
            {error}<Button size="sm" variant="outline" onClick={onRefresh}>Tentar novamente</Button></div>}
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm" aria-label="Itens do atendimento">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-marsala-800"/>
              <h3 className="text-sm font-semibold">Itens da locação</h3>
              <Badge variant="secondary">{cart.length} {cart.length===1?"modelo":"modelos"}</Badge>
            </div>
            <Button size="sm" variant="ghost" onClick={()=>setAdvanced(true)}
              className="gap-1 text-marsala-800 hover:bg-marsala-50"><Plus className="h-4 w-4"/> Adicionar traje</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[660px] text-left text-sm">
              <thead className="bg-muted/50 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <tr><th className="w-9 px-3 py-3">#</th><th className="px-3 py-3">Produto / traje</th>
                  <th className="px-3 py-3 text-center">Qtd.</th><th className="px-3 py-3 text-right">Valor unit.</th>
                  <th className="px-3 py-3 text-right">Subtotal</th><th className="w-12 px-2 py-3"> </th></tr>
              </thead>
              <tbody>
                {cart.map((item,index)=><tr key={item.id} className="border-t border-border align-middle">
                  <td className="px-3 py-3 text-xs text-muted-foreground">{index+1}</td>
                  <td className="px-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <PDVProductPhoto product={item} className="h-16 w-12 shrink-0 rounded-lg"/>
                      <div className="min-w-0"><p className="max-w-[260px] truncate font-semibold" title={item.name}>{item.name}</p>
                        <p className="truncate text-xs text-muted-foreground">SKU {item.sku??"não cadastrado"}
                          {item.color?" · "+item.color:""}</p>
                        {item.discount>0&&<p className="text-xs text-emerald-700">Desconto: {currency(item.discount)}</p>}
                        {availability[item.id]&&!availability[item.id].available&&
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant={conflictApproved(overrides[item.id],item.id,item.quantity,dates)?"outline":"destructive"}
                              className={conflictApproved(overrides[item.id],item.id,item.quantity,dates)?"border-amber-400 text-amber-800":""}>
                              {conflictApproved(overrides[item.id],item.id,item.quantity,dates)
                                ?"Desbloqueio gerencial autorizado":"Indisponível nas datas"}
                            </Badge>
                            <button className="text-xs font-semibold text-marsala-800 underline underline-offset-2"
                              type="button" onClick={()=>onReviewConflict(item.id)}>Ver histórico</button>
                          </div>}
                        {availabilityBusy&&<p className="text-xs text-muted-foreground">Consultando datas...</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3"><div className="mx-auto flex w-fit items-center rounded-lg border border-border">
                    <button type="button" className="p-2 hover:bg-muted disabled:opacity-40"
                      aria-label={"Diminuir quantidade de "+item.name}
                      disabled={item.quantity<=1} onClick={()=>onQuantityChange(item.id,item.quantity-1)}><Minus size={13}/></button>
                    <span className="w-7 text-center text-xs font-semibold tabular-nums">{item.quantity}</span>
                    <button type="button" className="p-2 hover:bg-muted disabled:opacity-40"
                      aria-label={"Aumentar quantidade de "+item.name}
                      disabled={item.quantity>=Math.min(20,products.find(p=>p.id===item.id)?.quantity??0)}
                      onClick={()=>onQuantityChange(item.id,item.quantity+1)}><Plus size={13}/></button>
                  </div></td>
                  <td className="px-3 py-3 text-right tabular-nums">{currency(rentalPrice(item))}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">{currency(item.subtotal)}
                    {manager&&<button type="button" onClick={()=>{setDiscountOpen(true);}}
                      className="mt-1 block w-full text-right text-[11px] text-marsala-800 hover:underline">
                      Ajustar descontos
                    </button>}
                  </td>
                  <td className="px-2 py-3"><button type="button" aria-label={"Remover "+item.name}
                    className="rounded-md p-2 text-muted-foreground hover:bg-red-50 hover:text-red-700"
                    onClick={()=>onRemove(item.id)}><Trash2 size={16}/></button></td>
                </tr>)}
              </tbody>
            </table>
            {cart.length===0&&<div className="flex min-h-[330px] flex-col items-center justify-center gap-3 px-5 py-10 text-center">
              <span className="rounded-2xl bg-marsala-50 p-5 text-marsala-800"><Shirt className="h-10 w-10"/></span>
              <h3 className="text-xl font-semibold">Pronto para iniciar uma locação</h3>
              <p className="max-w-md text-sm text-muted-foreground">Pesquise por nome, SKU ou código, escolha a quantidade e adicione o traje ao pedido.</p>
              <Button variant="outline" className="mt-1 gap-2 border-marsala-200 text-marsala-800"
                onClick={()=>setAdvanced(true)}><PackageSearch className="h-4 w-4"/>Explorar catálogo com fotos</Button>
              <div className="mt-4 grid max-w-md gap-3 sm:grid-cols-3">
                {[["1","Buscar produto"],["2","Conferir datas"],["3","Registrar locação"]].map(([n,l])=>
                  <div key={n} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-marsala-100 font-bold text-marsala-800">{n}</span>{l}
                  </div>)}
              </div>
            </div>}
          </div>
          {cart.length>0&&<div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
            <span>{quantity} {quantity===1?"peça selecionada":"peças selecionadas"}</span>
            <span>Subtotal dos trajes: <strong className="text-foreground">{currency(subtotal)}</strong></span>
          </div>}
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm" aria-label="Datas e observações">
          <div className="mb-3 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-marsala-800"/>
            <h3 className="text-sm font-semibold">Cronograma da locação</h3>
            <span className="ml-auto text-xs text-muted-foreground">Datas aplicadas aos trajes do pedido</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {dateFields.map(([key,label])=><div key={key}>
              <Label htmlFor={"pdv-"+key} className="mb-1 block text-xs text-muted-foreground">{label}</Label>
              <Input id={"pdv-"+key} type="date" value={dates[key]}
                onChange={e=>onDatesChange({...dates,[key]:e.target.value})}
                className={fieldBase+" px-2 text-xs"}/>
            </div>)}
          </div>
          <div className="mt-3 grid gap-3 rounded-lg border border-marsala-100 bg-marsala-50/30 p-3 sm:grid-cols-2">
            <VisitSlotInput id="pdv-time-fitting" kind="Prova" day={dates.tryOnDate}
              time={visitTimes.tryOnTime} required={Boolean(dates.tryOnDate)}
              onChange={value=>onVisitTimesChange({...visitTimes,tryOnTime:value})}/>
            <VisitSlotInput id="pdv-time-pickup" kind="Retirada" day={dates.pickupDate}
              time={visitTimes.pickupTime} required
              onChange={value=>onVisitTimesChange({...visitTimes,pickupTime:value})}/>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Escolha o horário em que a cliente virá à loja. O número de vagas é conferido pelo Supabase
              e o agendamento é confirmado junto com o contrato.
            </p>
          </div>
          {cart.length>0&&!datesValid&&<div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0"/>
            Informe retirada, evento e devolução em sequência; a prova, se houver, deve ser antes da retirada.
          </div>}
          <div className="mt-4 border-t border-border pt-3">
            <button type="button" onClick={()=>setNotesOpen(x=>!x)}
              className="flex w-full items-center justify-between text-left text-xs font-semibold">
              <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-marsala-800"/>
                Observações do pedido {observations?"· preenchidas":""}</span>
              <ChevronDown className={"h-4 w-4 transition-transform "+(notesOpen?"rotate-180":"")}/>
            </button>
            {notesOpen&&<textarea rows={3} className="mt-3 w-full rounded-lg border border-border bg-background p-3 text-sm"
              placeholder="Orientações para provas, retirada e ajustes..." maxLength={3000}
              value={observations} onChange={e=>setObservations(e.target.value)}/>}
          </div>
        </section>
      </div>

      <aside className="min-w-0 space-y-3 xl:sticky xl:top-3" aria-label="Resumo e finalização do atendimento">
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><ShoppingCart className="h-4 w-4 text-marsala-800"/>Resumo da locação</h3>
            <Badge variant="outline" className="border-marsala-200 text-marsala-800">Aluguel</Badge>
          </div>
          <div className="space-y-3 p-4 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Modelos</span>
              <strong>{cart.length}</strong></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Peças</span>
              <strong>{quantity}</strong></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Subtotal</span>
              <span>{currency(subtotal)}</span></div>
            {totalDiscount>0&&<div className="flex items-center justify-between text-emerald-700">
              <span>Descontos</span><strong>-{currency(totalDiscount)}</strong></div>}
            <div className="flex items-center justify-between rounded-lg bg-marsala px-3 py-3 text-white">
              <span className="text-sm font-semibold">Total do pedido</span><strong className="text-xl tabular-nums">{currency(total)}</strong>
            </div>
            {manager&&cart.length>0&&<Button size="sm" variant="outline" className="w-full border-marsala-200 text-marsala-800"
              onClick={()=>setDiscountOpen(true)}>Conceder desconto</Button>}
            {cart.length>0&&datesValid&&<div className="space-y-2 text-xs">
              {availabilityBusy&&<p role="status" className="text-muted-foreground">Verificando datas de locação no Supabase...</p>}
              {availabilityError&&<p role="alert" className="rounded-md border border-red-200 p-2 text-red-700">
                Falha na disponibilidade: {availabilityError}. Atualize as datas e tente novamente.
              </p>}
              {cart.some(item=>availability[item.id]&&!availability[item.id].available&&!conflictApproved(
                overrides[item.id],item.id,item.quantity,dates
              ))&&<p role="alert" className="rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-900">
                Existem trajes indisponíveis. Confira o histórico, remova ou solicite desbloqueio gerencial.
              </p>}
              {cart.some(item=>conflictApproved(overrides[item.id],item.id,item.quantity,dates))&&
                <p className="rounded-md border border-amber-200 p-2 text-amber-900">
                  Reserva excepcional autorizada. Resolva os conflitos físicos antes das retiradas.
                </p>}
            </div>}
            <Button onClick={onContinue} disabled={!cart.length||processing||availabilityBusy}
              className="h-11 w-full gap-2 bg-marsala text-white hover:bg-marsala-700">
              <CreditCard className="h-4 w-4"/>{processing?"Registrando contrato...":"Continuar para pagamento"}
            </Button>
            {!ready&&cart.length>0&&<p className="text-center text-xs text-muted-foreground">Para continuar, selecione cliente e preencha as datas obrigatórias.</p>}
          </div>
        </section>
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><UserRound className="h-4 w-4 text-marsala-800"/>Cliente</h3>
            <kbd className="rounded bg-muted px-2 py-1 text-[10px] text-muted-foreground">F8</kbd>
          </div>
          <Button variant="outline" onClick={onCustomer}
            className="h-auto min-h-11 w-full justify-between gap-2 text-left">
            <span className="min-w-0 flex-1 truncate">
              {customer?.name??"Selecionar ou cadastrar cliente"}
              {customer?.document&&<span className="mt-1 block truncate text-[10px] text-muted-foreground">{customer.document}</span>}
            </span>
            <Search className="h-4 w-4 shrink-0 text-muted-foreground"/>
          </Button>
          {!customer&&<p className="mt-2 text-xs text-amber-800">Cliente cadastrado é obrigatório para gerar o contrato.</p>}
        </section>
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-marsala-800"/>Atendente</h3>
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-3">
            <p className="truncate text-sm font-medium">{user?.full_name??"Não identificado"}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Usuário autenticado responsável pelo registro</p>
          </div>
        </section>
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Keyboard className="h-4 w-4 text-marsala-800"/>Atalhos</h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            {[["Ctrl + B","Busca avançada"],["F8","Selecionar cliente"],["F10","Salvar para depois"],["Ctrl + Enter","Continuar"]].map(([key,label])=>
              <div key={key} className="flex items-center justify-between gap-2">
                <span>{label}</span><kbd className="rounded-md bg-muted px-2 py-1 font-medium text-foreground">{key}</kbd>
              </div>)}
          </div>
        </section>
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold">Etapas do atendimento</h3>
          <ol className="space-y-3">
            {[
              {label:"Selecionar trajes",ok:cart.length>0},
              {label:"Identificar cliente",ok:Boolean(customer?.id)},
              {label:"Conferir datas",ok:datesValid},
              {label:"Registrar pagamento",ok:false},
            ].map(({label,ok},i)=><li key={label} className="flex items-center gap-3 text-xs">
              <span className={"flex h-6 w-6 shrink-0 items-center justify-center rounded-full "+(ok?"bg-emerald-50 text-emerald-700":"bg-muted text-muted-foreground")}>
                {ok?<CheckCircle2 className="h-4 w-4"/>:i+1}
              </span><span className={ok?"text-foreground":"text-muted-foreground"}>{label}</span>
            </li>)}
          </ol>
        </section>
      </aside>
    </div>

    <footer className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={!cart.length||processing} onClick={onContinue} className="gap-2 bg-marsala text-white hover:bg-marsala-700">
          <ArrowRight className="h-4 w-4"/>Continuar <span className="hidden text-[10px] opacity-70 sm:inline">Ctrl+Enter</span>
        </Button>
        <Button disabled={draftBusy||processing} variant="outline" className="gap-2" onClick={()=>void onSaveDraft()}>
          <Save className="h-4 w-4"/>Salvar para depois
        </Button>
        {hasDraft&&<Button disabled={draftBusy||processing} variant="ghost" size="sm" onClick={()=>void onLoadDraft()}>
          <History className="mr-1.5 h-4 w-4"/>Recuperar
        </Button>}
        <Button disabled={!cart.length||processing} variant="ghost" className="text-muted-foreground" onClick={onClear}>
          <X className="mr-1.5 h-4 w-4"/>Cancelar
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-right">
        <div><p className="text-[10px] text-muted-foreground">Itens</p><strong className="text-sm tabular-nums">{cart.length}</strong></div>
        <div><p className="text-[10px] text-muted-foreground">Quant.</p><strong className="text-sm tabular-nums">{quantity}</strong></div>
        <div><p className="text-[10px] text-muted-foreground">Total do pedido</p><strong className="text-lg tabular-nums text-marsala-800">{currency(total)}</strong></div>
      </div>
    </footer>

    <Dialog open={advanced} onOpenChange={setAdvanced}>
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto p-5">
        <DialogHeader><DialogTitle>Busca avançada de trajes</DialogTitle>
          <DialogDescription>Pesquise no catálogo real, confira fotos e adicione exemplares à locação.</DialogDescription>
        </DialogHeader>
        <PDVProductGallery products={products} loading={loading} error={error}
          cartQuantities={Object.fromEntries(cart.map(item=>[item.id,item.quantity]))}
          onAdd={p=>{onAdd(p,1);}} onRefresh={onRefresh}/>
      </DialogContent>
    </Dialog>

    <Dialog open={discountOpen} onOpenChange={setDiscountOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Descontos da locação</DialogTitle>
          <DialogDescription>O valor final será validado pelo banco na criação do contrato.</DialogDescription>
        </DialogHeader>
        {manager?<div className="space-y-4">
          <div className="grid grid-cols-[110px_1fr] gap-2">
            <select aria-label="Tipo de desconto global" value={globalDiscountType}
              onChange={e=>setGlobalDiscountType(e.target.value as "percentage"|"amount")}
              className="h-10 rounded-lg border border-border bg-background px-2 text-sm">
              <option value="percentage">%</option><option value="amount">R$</option>
            </select>
            <Input type="number" min={0} max={globalDiscountType==="percentage"?100:subtotal-itemDiscount}
              step=".01" value={globalDiscount}
              onChange={e=>setGlobalDiscount(Number(e.target.value)||0)}/>
          </div>
          {cart.map(item=><div key={item.id} className="grid grid-cols-[1fr_110px] items-center gap-3">
            <div><strong className="block truncate text-xs">{item.name}</strong>
              <p className="text-[11px] text-muted-foreground">Máximo {currency(rentalPrice(item)*item.quantity)}</p></div>
            <Input type="number" min={0} max={rentalPrice(item)*item.quantity} step=".01"
              aria-label={"Desconto no traje "+item.name} value={item.discount}
              onChange={e=>onItemDiscount(item.id,Math.max(0,Number(e.target.value)||0))}/>
          </div>)}
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between"><span>Descontos calculados</span><strong>{currency(totalDiscount)}</strong></div>
            <div className="mt-1 flex justify-between font-semibold"><span>Total final</span><span>{currency(total)}</span></div>
          </div>
          <Button className="w-full bg-marsala hover:bg-marsala-700" onClick={()=>setDiscountOpen(false)}>Aplicar ao atendimento</Button>
        </div>:<p className="text-sm text-muted-foreground">Somente gerente ou administrador pode conceder descontos.</p>}
      </DialogContent>
    </Dialog>
  </div>;
}
