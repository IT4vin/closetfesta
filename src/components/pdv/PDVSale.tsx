import React, {useCallback,useEffect,useMemo,useRef,useState} from "react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/lib/api";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PDVWorkspace from "./PDVWorkspace";
import PDVPaymentModal from "./PDVPaymentModal";
import PDVQuickCustomer from "./PDVQuickCustomer";
import RentalAvailabilityDialog from "./RentalAvailabilityDialog";
import { useAuth } from "@/stores/authStore";
import { availabilityKey, checkCartProductAvailability, conflictApproved, datesForAvailability, type ProductCartAvailability, type CartConflictApproval } from "@/lib/cartAvailability";
import {rentalPrice} from "./PDVProductGallery";
import { getVisitSlot } from "@/lib/closetCalendar";
import { pdvCheckoutSignature } from "@/lib/pdvCheckoutSignature";
import {calculatePDVCart} from "@/lib/pdvCalculations";
import {
  savePDVDraft, loadPDVDraft, deletePDVDraft,
  type PDVDraftPayload,
} from "@/lib/pdvDrafts";

export type OrderType="sale"|"rental"|"hybrid";
export type ItemType="sale"|"rental";
export interface CartItem extends Product {
  quantity:number;subtotal:number;discount:number;itemType:ItemType;
  tryOnDate?:string;pickupDate?:string;eventDate?:string;returnDate?:string;
}
export interface OrderDates {
  tryOnDate:string;pickupDate:string;eventDate:string;returnDate:string;
}
type Customer={id?:string;name:string;document:string;phone?:string};
const emptyDates=():OrderDates=>({
  tryOnDate:"",pickupDate:"",eventDate:"",returnDate:"",
});
const cents=(value:number)=>Math.round((value+Number.EPSILON)*100)/100;
const canRent=(p:Product)=>!p.deleted&&p.status==="available"&&p.quantity>0;
const MAX_UNITS_PER_PRODUCT=20;

export default function PDVSale(){
  const {toast}=useToast();
  const {user}=useAuth();
  const manager=user?.role?.id==="admin"||user?.role?.id==="manager";
  const {productsList,loading:loadingProducts,error:productsError,refetch:refetchProducts}=useProducts();
  const {createOrder}=useOrders();
  const [cart,setCart]=useState<CartItem[]>([]);
  const [searchValue,setSearchValue]=useState("");
  const [orderDates,setOrderDates]=useState<OrderDates>(emptyDates);
  const [visitTimes,setVisitTimes]=useState({tryOnTime:"",pickupTime:""});
  const [observations,setObservations]=useState("");
  const [globalDiscount,setGlobalDiscount]=useState(0);
  const [globalDiscountType,setGlobalDiscountType]=useState<"percentage"|"amount">("percentage");
  const [selectedCustomer,setSelectedCustomer]=useState<Customer|null>(null);
  const [isCustomerModalOpen,setCustomerModalOpen]=useState(false);
  const [isPaymentModalOpen,setPaymentModalOpen]=useState(false);
  const [isProcessingOrder,setProcessingOrder]=useState(false);
  const [draftBusy,setDraftBusy]=useState(false);
  const [hasDraft,setHasDraft]=useState(false);
  const checkoutRequestRef=useRef<{signature:string;key:string}|null>(null);
  const [availability,setAvailability]=useState<Record<string,ProductCartAvailability>>({});
  const [availabilityBusy,setAvailabilityBusy]=useState(false);
  const [availabilityError,setAvailabilityError]=useState("");
  const [conflictProductId,setConflictProductId]=useState<string|null>(null);
  const [overrideApprovals,setOverrideApprovals]=useState<Record<string,CartConflictApproval>>({});
  const checkSequence=useRef(0);
  const cartAvailabilitySignature=JSON.stringify({
    dates:orderDates,items:cart.map(item=>[item.id,item.quantity])
  });
  const liveSignature=useRef(cartAvailabilitySignature);
  liveSignature.current=cartAvailabilitySignature;

  useEffect(()=>{
    const token=++checkSequence.current;
    setAvailability({});
    setAvailabilityError("");
    if(!cart.length||!datesForAvailability(orderDates)){
      setAvailabilityBusy(false);
      return;
    }
    setAvailabilityBusy(true);
    void Promise.all(cart.map(item=>checkCartProductAvailability(
      item.id,item.quantity,orderDates,
    ))).then(results=>{
      if(token!==checkSequence.current)return;
      setAvailability(Object.fromEntries(results.map(result=>[result.product_id,result])));
      const first=cart.find(item=>{
        const result=results.find(entry=>entry.product_id===item.id);
        return result&&!result.available&&!conflictApproved(
          overrideApprovals[item.id],item.id,item.quantity,orderDates
        );
      });
      if(first)setConflictProductId(first.id);
    }).catch(cause=>{
      if(token!==checkSequence.current)return;
      setAvailabilityError(cause instanceof Error?cause.message:"Falha ao consultar disponibilidade");
    }).finally(()=>{
      if(token===checkSequence.current)setAvailabilityBusy(false);
    });
    return()=>{checkSequence.current++;};
  },[cartAvailabilitySignature]);

  const approveConflict=(productId:string,reason:string)=>{
    const item=cart.find(row=>row.id===productId);
    const check=availability[productId];
    if(!manager||!item||!check||check.available||reason.length<10||reason.length>500){
      toast({title:"Desbloqueio não autorizado",variant:"destructive"});return;
    }
    if(check.physical_available_units<item.quantity){
      toast({title:"Sem exemplares físicos suficientes",variant:"destructive"});return;
    }
    if(!window.confirm("Autorizar reserva EXCEPCIONAL com datas sobrepostas? A retirada física ficará bloqueada se o mesmo traje estiver com outra cliente. Esta autorização e justificativa serão auditadas."))return;
    setOverrideApprovals(previous=>({...previous,[productId]:{
      key:availabilityKey(item.id,item.quantity,orderDates),reason
    }}));
    checkoutRequestRef.current=null;
    setConflictProductId(null);
    toast({title:"Desbloqueio autorizado no carrinho",
      description:"A autorização gerencial será registrada no Supabase ao criar o contrato."});
  };

  const finance=useMemo(()=>
    calculatePDVCart(cart,globalDiscount,globalDiscountType),
    [cart,globalDiscount,globalDiscountType]
  );

  const validateDates=useCallback(()=>{
    const {tryOnDate,pickupDate,eventDate,returnDate}=orderDates;
    if(!pickupDate||!eventDate||!returnDate){
      toast({title:"Datas obrigatórias",description:"Informe retirada, evento e devolução.",variant:"destructive"});return false;
    }
    if(pickupDate>=eventDate||eventDate>=returnDate||(tryOnDate&&tryOnDate>=pickupDate)){
      toast({title:"Datas inconsistentes",description:"Prova antes da retirada; retirada antes do evento; devolução após o evento.",variant:"destructive"});return false;
    }
    return true;
  },[orderDates,toast]);

  const validateVisitTimes=useCallback(()=>{
    if(!visitTimes.pickupTime || (orderDates.tryOnDate && !visitTimes.tryOnTime)){
      toast({title:"Horário obrigatório",description:"Escolha o horário da retirada e, quando houver prova, também o horário da prova.",variant:"destructive"});
      return false;
    }
    return true;
  },[visitTimes,orderDates.tryOnDate,toast]);
  const verifyVisitSlots=async()=>{
    const entries: Array<{kind:"Prova"|"Retirada";day:string;time:string}> = [
      {kind:"Retirada",day:orderDates.pickupDate,time:visitTimes.pickupTime},
    ];
    if(orderDates.tryOnDate)entries.push({
      kind:"Prova",day:orderDates.tryOnDate,time:visitTimes.tryOnTime,
    });
    const checked=await Promise.all(entries.map(async entry=>({
      ...entry,result:await getVisitSlot(entry.kind,entry.day,entry.time),
    })));
    const unavailable=checked.find(item=>!item.result.available);
    if(unavailable)throw new Error(unavailable.kind+" às "+unavailable.time+": "+
      (unavailable.result.reason||"Horário sem vagas"));
  };

  const addProduct=useCallback((product:Product,count=1)=>{
    if(!canRent(product)){
      toast({title:"Traje indisponível",description:"Consulte a disponibilidade antes de adicioná-lo.",variant:"destructive"});return;
    }
    const max=Math.min(MAX_UNITS_PER_PRODUCT,product.quantity);
    const current=cart.find(item=>item.id===product.id)?.quantity??0;
    if(!Number.isInteger(count)||count<1||current+count>max){
      toast({title:"Limite de exemplares",description:`É possível selecionar até ${max} unidade(s) deste traje. Disponibilidade por data será validada no fechamento.`,variant:"destructive"});return;
    }
    const unit=rentalPrice(product);
    if(!Number.isFinite(unit)||unit<0){
      toast({title:"Preço inválido",description:"Corrija o preço no cadastro do traje.",variant:"destructive"});return;
    }
    setCart(previous=>{
      const match=previous.find(item=>item.id===product.id);
      return match
        ?previous.map(item=>item.id!==product.id?item:{
            ...item,quantity:item.quantity+count,
            subtotal:cents(unit*(item.quantity+count)-item.discount),
          })
        :[...previous,{
            ...product,quantity:count,subtotal:cents(unit*count),discount:0,
            itemType:"rental",tryOnDate:orderDates.tryOnDate,
            pickupDate:orderDates.pickupDate,eventDate:orderDates.eventDate,
            returnDate:orderDates.returnDate,
          }];
    });
    checkoutRequestRef.current=null;
  },[cart,orderDates,toast]);

  const updateQuantity=useCallback((productId:string,quantity:number)=>{
    const product=productsList.find(p=>p.id===productId);
    if(!product)return;
    const max=Math.min(product.quantity,MAX_UNITS_PER_PRODUCT);
    if(!Number.isInteger(quantity)||quantity<1||quantity>max){
      toast({title:"Quantidade inválida",description:`Limite deste modelo: ${max} unidade(s).`,variant:"destructive"});return;
    }
    setCart(previous=>previous.map(item=>item.id!==productId?item:{
      ...item,quantity,discount:Math.min(item.discount,cents(rentalPrice(item)*quantity)),
      subtotal:cents(rentalPrice(item)*quantity-Math.min(item.discount,cents(rentalPrice(item)*quantity))),
    }));
    checkoutRequestRef.current=null;
  },[productsList,toast]);

  const updateItemDiscount=useCallback((productId:string,amount:number)=>{
    if(!Number.isFinite(amount)||amount<0)return;
    setCart(previous=>previous.map(item=>{
      if(item.id!==productId)return item;
      const limit=cents(rentalPrice(item)*item.quantity);
      const discount=cents(Math.min(limit,amount));
      return {...item,discount,subtotal:cents(limit-discount)};
    }));
    checkoutRequestRef.current=null;
  },[]);

  const removeItem=useCallback((productId:string)=>{
    setCart(previous=>previous.filter(item=>item.id!==productId));
    checkoutRequestRef.current=null;
  },[]);

  const clearCart=useCallback(()=>{
    if(!cart.length&&!selectedCustomer&&!observations)return;
    if(!window.confirm("Cancelar este atendimento sem gravar contrato? O rascunho salvo, se existir, continuará disponível."))return;
    setCart([]);setSelectedCustomer(null);setOrderDates(emptyDates());setVisitTimes({tryOnTime:"",pickupTime:""});
    setOverrideApprovals({});setConflictProductId(null);
    setObservations("");setGlobalDiscount(0);setGlobalDiscountType("percentage");
    setSearchValue("");checkoutRequestRef.current=null;
    toast({title:"Atendimento cancelado",description:"Nenhum contrato foi criado."});
  },[cart.length,selectedCustomer,observations,toast]);

  const beginCheckout=useCallback(async()=>{
    if(isProcessingOrder||availabilityBusy||cart.length===0){
      toast({title:availabilityBusy?"Consultando datas":"Carrinho vazio",
        description:availabilityBusy?"Aguarde a consulta terminar.":"Adicione ao menos um traje.",
        variant:"destructive"});return;
    }
    if(!selectedCustomer?.id){
      toast({title:"Cliente obrigatório",description:"Selecione ou cadastre um cliente para gerar o contrato.",variant:"destructive"});
      setCustomerModalOpen(true);return;
    }
    if(!validateDates()||!validateVisitTimes())return;
    if(!finance.valid||!Number.isFinite(finance.total)||finance.total<=0){
      toast({title:"Total inválido",description:"Confira os preços e descontos antes de continuar.",variant:"destructive"});return;
    }
    // Revalidar antes de abrir o pagamento: outro operador pode ter locado o traje
    // desde a primeira seleção do carrinho.
    const expected=liveSignature.current;
    const token=++checkSequence.current;
    setAvailabilityBusy(true);setAvailabilityError("");
    try{
      await verifyVisitSlots();
      const results=await Promise.all(cart.map(item=>checkCartProductAvailability(
        item.id,item.quantity,orderDates,
      )));
      if(token!==checkSequence.current||expected!==liveSignature.current)return;
      setAvailability(Object.fromEntries(results.map(result=>[result.product_id,result])));
      const pending=cart.find(item=>{
        const result=results.find(row=>row.product_id===item.id);
        return result&&!result.available&&!conflictApproved(
          overrideApprovals[item.id],item.id,item.quantity,orderDates
        );
      });
      if(pending){
        setConflictProductId(pending.id);
        toast({title:"Produto indisponível para a data",
          description:"Consulte o histórico e remova ou solicite o desbloqueio.",variant:"destructive"});
        return;
      }
      setPaymentModalOpen(true);
    }catch(cause){
      if(token!==checkSequence.current)return;
      const message=cause instanceof Error?cause.message:"Não foi possível consultar disponibilidade";
      setAvailabilityError(message);
      toast({title:"Consulta de estoque não confirmada",description:message,variant:"destructive"});
    }finally{
      if(token===checkSequence.current)setAvailabilityBusy(false);
    }
  },[isProcessingOrder,availabilityBusy,cart,selectedCustomer,validateDates,validateVisitTimes,visitTimes,finance.valid,finance.total,toast,orderDates,overrideApprovals]);

  const handlePaymentComplete=async(paymentDetails:any)=>{
    if(!selectedCustomer?.id||!cart.length){
      throw new Error("Cliente e produtos são obrigatórios.");
    }
    if(!validateDates()||!validateVisitTimes())throw new Error("Datas e horários não confirmados.");
    setProcessingOrder(true);
    try{
      await verifyVisitSlots();
      const orderData={
        customer_name:selectedCustomer.name,
        client_id:selectedCustomer.id,
        customer_document:selectedCustomer.document,
        customer_phone:selectedCustomer.phone,
        order_type:"rental" as const,
        try_on_time:orderDates.tryOnDate?visitTimes.tryOnTime:null,
        pickup_time:visitTimes.pickupTime,
        items:cart.map(item=>({
          product_id:item.id,
          product_name:item.name,
          product_sku:item.sku,
          quantity:item.quantity,
          unit_price:rentalPrice(item),
          discount:item.discount,
          item_type:"rental" as const,
          override_conflict:conflictApproved(
            overrideApprovals[item.id],item.id,item.quantity,orderDates
          ),
          override_reason:conflictApproved(
            overrideApprovals[item.id],item.id,item.quantity,orderDates
          )?overrideApprovals[item.id].reason:null,
          try_on_date:orderDates.tryOnDate,
          pickup_date:orderDates.pickupDate,
          event_date:orderDates.eventDate,
          return_date:orderDates.returnDate,
        })),
        subtotal:finance.subtotal,
        total_discount:finance.totalDiscount,
        total:finance.total,
        total_sales:0,
        total_rentals:finance.totalRentals,
        observations,
        payment_details:paymentDetails,
      };
      const signature=pdvCheckoutSignature(orderData);
      if(!checkoutRequestRef.current||checkoutRequestRef.current.signature!==signature){
        checkoutRequestRef.current={signature,key:crypto.randomUUID()};
      }
      const created=await createOrder({...orderData,request_id:checkoutRequestRef.current.key});
      toast({title:"Locação registrada",description:`Pedido ${created.order_number} salvo no Supabase.`,
        action:<Button size="sm" variant="outline" onClick={()=>window.dispatchEvent(new Event("closetfesta:open-orders"))}>
          Ver pedidos
        </Button>});
      window.dispatchEvent(new Event("closetfesta:order-created"));
      window.dispatchEvent(new Event("closetfesta:open-orders"));
      setCart([]);setOrderDates(emptyDates());setVisitTimes({tryOnTime:"",pickupTime:""});setObservations("");
      setOverrideApprovals({});setConflictProductId(null);
      setGlobalDiscount(0);setGlobalDiscountType("percentage");
      setSelectedCustomer(null);setPaymentModalOpen(false);setSearchValue("");
      checkoutRequestRef.current=null;
      try {await deletePDVDraft();setHasDraft(false);}
      catch {toast({title:"Pedido confirmado",description:"O rascunho anterior ainda está salvo. Exclua-o manualmente se não for mais necessário."});}
    }catch(cause){
      const message=cause instanceof Error?cause.message:"Não foi possível registrar o contrato.";
      toast({title:"Falha ao finalizar",description:message,variant:"destructive"});
      throw cause;
    }finally{setProcessingOrder(false);}
  };

  const saveDraft=useCallback(async()=>{
    if(draftBusy)return;
    if(!cart.length&&!selectedCustomer){
      toast({title:"Nenhum atendimento para salvar",description:"Adicione um traje ou selecione um cliente."});return;
    }
    const payload:PDVDraftPayload={
      version:1,items:cart.map(item=>({product_id:item.id,quantity:item.quantity,discount:item.discount})),
      customer_id:selectedCustomer?.id??null,dates:orderDates,visitTimes,
      observations:observations.slice(0,3000),
      global_discount:globalDiscount,
      global_discount_type:globalDiscountType,
    };
    setDraftBusy(true);
    try{await savePDVDraft(payload);setHasDraft(true);
      toast({title:"Atendimento salvo",description:"Rascunho privado deste operador salvo no Supabase. Nenhum traje foi reservado."});
    }catch(cause){toast({title:"Rascunho não salvo",description:cause instanceof Error?cause.message:"Erro no banco.",variant:"destructive"});}
    finally{setDraftBusy(false);}
  },[draftBusy,cart,selectedCustomer,orderDates,visitTimes,observations,globalDiscount,globalDiscountType,toast]);

  const restoreDraft=useCallback(async()=>{
    if(draftBusy)return;
    if(cart.length&&!window.confirm("Substituir o carrinho atual pelo atendimento salvo?"))return;
    setDraftBusy(true);
    try{
      const draft=await loadPDVDraft();
      if(!draft){setHasDraft(false);toast({title:"Nenhum rascunho salvo"});return;}
      if(loadingProducts||productsError)throw new Error("Aguarde o catálogo carregar corretamente antes de recuperar.");
      const kept:CartItem[]=[];
      const dropped:string[]=[];
      for(const row of draft.payload.items){
        const product=productsList.find(p=>p.id===row.product_id);
        if(!product||!canRent(product)){
          dropped.push(row.product_id);continue;
        }
        const quantity=Math.min(MAX_UNITS_PER_PRODUCT,product.quantity,row.quantity);
        const max=cents(rentalPrice(product)*quantity);
        const discount=cents(Math.min(max,row.discount));
        kept.push({...product,itemType:"rental",quantity,discount,
          subtotal:cents(max-discount),...draft.payload.dates});
      }
      let nextCustomer:Customer|null=null;
      if(draft.payload.customer_id){
        const {data,error}=await supabase.from("clients")
          .select("id,full_name,document,phone").eq("id",draft.payload.customer_id).maybeSingle();
        if(error)throw new Error(error.message);
        if(data)nextCustomer={id:data.id,name:data.full_name,document:data.document??"",phone:data.phone??undefined};
      }
      setCart(kept);setSelectedCustomer(nextCustomer);
      setOverrideApprovals({});setConflictProductId(null);
      setOrderDates(draft.payload.dates);
      setVisitTimes(draft.payload.visitTimes??{tryOnTime:"",pickupTime:""});
      setObservations(draft.payload.observations);
      setGlobalDiscount(draft.payload.global_discount);setGlobalDiscountType(draft.payload.global_discount_type);
      checkoutRequestRef.current=null;
      toast({title:"Rascunho recuperado",description:dropped.length
        ?`${dropped.length} produto(s) foram removidos por indisponibilidade. Confira valores e datas antes de finalizar.`
        :"Valores e cadastro atuais carregados. Confira a disponibilidade pelas datas antes de finalizar."});
    }catch(cause){toast({title:"Falha ao recuperar rascunho",description:cause instanceof Error?cause.message:"Erro desconhecido.",variant:"destructive"});}
    finally{setDraftBusy(false);}
  },[draftBusy,cart.length,loadingProducts,productsError,productsList,toast]);

  useEffect(()=>{
    let active=true;
    loadPDVDraft().then(d=>{if(active)setHasDraft(Boolean(d));}).catch(()=>{});
    return()=>{active=false;};
  },[]);

  return <>
    <PDVWorkspace
      products={productsList} loading={loadingProducts} error={productsError}
      cart={cart} dates={orderDates} visitTimes={visitTimes}
      onVisitTimesChange={times=>{setVisitTimes(times);checkoutRequestRef.current=null;}}
      customer={selectedCustomer}
      searchValue={searchValue} setSearchValue={setSearchValue}
      observations={observations} setObservations={setObservations}
      globalDiscount={globalDiscount} setGlobalDiscount={value=>{
        setGlobalDiscount(value);checkoutRequestRef.current=null;
      }}
      globalDiscountType={globalDiscountType} setGlobalDiscountType={value=>{
        setGlobalDiscountType(value);checkoutRequestRef.current=null;
      }}
      total={finance.total} totalDiscount={finance.totalDiscount} processing={isProcessingOrder}
      availability={availability} availabilityBusy={availabilityBusy}
      availabilityError={availabilityError} overrides={overrideApprovals}
      onReviewConflict={id=>setConflictProductId(id)}
      onDatesChange={dates=>{
        setVisitTimes(old=>({
          tryOnTime:dates.tryOnDate===orderDates.tryOnDate?old.tryOnTime:"",
          pickupTime:dates.pickupDate===orderDates.pickupDate?old.pickupTime:"",
        }));
        setOrderDates(dates);checkoutRequestRef.current=null;
      }}
      onAdd={(product,quantity)=>addProduct(product,quantity)}
      onQuantityChange={updateQuantity} onItemDiscount={updateItemDiscount}
      onRemove={removeItem} onCustomer={()=>setCustomerModalOpen(true)}
      onRefresh={()=>void refetchProducts()}
      onContinue={beginCheckout} onSaveDraft={saveDraft} onLoadDraft={restoreDraft}
      onClear={clearCart} onOrders={()=>window.dispatchEvent(new Event("closetfesta:open-orders"))}
      draftBusy={draftBusy} hasDraft={hasDraft}
    />
    <RentalAvailabilityDialog
      open={Boolean(conflictProductId)} item={cart.find(item=>item.id===conflictProductId)||null}
      dates={orderDates} availability={conflictProductId?availability[conflictProductId]||null:null}
      canOverride={manager}
      onClose={()=>setConflictProductId(null)}
      onRemove={id=>{removeItem(id);setConflictProductId(null);}}
      onOverride={approveConflict}
    />
    <PDVPaymentModal isOpen={isPaymentModalOpen}
      onClose={()=>{if(!isProcessingOrder)setPaymentModalOpen(false);}}
      total={finance.total}
      onPaymentComplete={handlePaymentComplete}
      customer={selectedCustomer}/>
    <PDVQuickCustomer isOpen={isCustomerModalOpen}
      onClose={()=>setCustomerModalOpen(false)}
      onSelectCustomer={customer=>{setSelectedCustomer(customer);setCustomerModalOpen(false);checkoutRequestRef.current=null;}}/>
  </>;
}
