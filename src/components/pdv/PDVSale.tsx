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
import {rentalPrice} from "./PDVProductGallery";
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
  const {productsList,loading:loadingProducts,error:productsError,refetch:refetchProducts}=useProducts();
  const {createOrder}=useOrders();
  const [cart,setCart]=useState<CartItem[]>([]);
  const [searchValue,setSearchValue]=useState("");
  const [orderDates,setOrderDates]=useState<OrderDates>(emptyDates);
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
    setCart([]);setSelectedCustomer(null);setOrderDates(emptyDates());
    setObservations("");setGlobalDiscount(0);setGlobalDiscountType("percentage");
    setSearchValue("");checkoutRequestRef.current=null;
    toast({title:"Atendimento cancelado",description:"Nenhum contrato foi criado."});
  },[cart.length,selectedCustomer,observations,toast]);

  const beginCheckout=useCallback(()=>{
    if(isProcessingOrder||cart.length===0){
      toast({title:"Carrinho vazio",description:"Adicione ao menos um traje.",variant:"destructive"});return;
    }
    if(!selectedCustomer?.id){
      toast({title:"Cliente obrigatório",description:"Selecione ou cadastre um cliente para gerar o contrato.",variant:"destructive"});
      setCustomerModalOpen(true);return;
    }
    if(!validateDates())return;
    if(!finance.valid||!Number.isFinite(finance.total)||finance.total<=0){
      toast({title:"Total inválido",description:"Confira os preços e descontos antes de continuar.",variant:"destructive"});return;
    }
    setPaymentModalOpen(true);
  },[isProcessingOrder,cart.length,selectedCustomer,validateDates,finance.total,toast]);

  const handlePaymentComplete=async(paymentDetails:any)=>{
    if(!selectedCustomer?.id||!cart.length){
      throw new Error("Cliente e produtos são obrigatórios.");
    }
    if(!validateDates())throw new Error("Datas do aluguel não confirmadas.");
    setProcessingOrder(true);
    try{
      const orderData={
        customer_name:selectedCustomer.name,
        client_id:selectedCustomer.id,
        customer_document:selectedCustomer.document,
        customer_phone:selectedCustomer.phone,
        order_type:"rental" as const,
        items:cart.map(item=>({
          product_id:item.id,
          product_name:item.name,
          product_sku:item.sku,
          quantity:item.quantity,
          unit_price:rentalPrice(item),
          discount:item.discount,
          item_type:"rental" as const,
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
      const signature=JSON.stringify(orderData);
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
      setCart([]);setOrderDates(emptyDates());setObservations("");
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
      customer_id:selectedCustomer?.id??null,dates:orderDates,
      observations:observations.slice(0,3000),
      global_discount:globalDiscount,
      global_discount_type:globalDiscountType,
    };
    setDraftBusy(true);
    try{await savePDVDraft(payload);setHasDraft(true);
      toast({title:"Atendimento salvo",description:"Rascunho privado deste operador salvo no Supabase. Nenhum traje foi reservado."});
    }catch(cause){toast({title:"Rascunho não salvo",description:cause instanceof Error?cause.message:"Erro no banco.",variant:"destructive"});}
    finally{setDraftBusy(false);}
  },[draftBusy,cart,selectedCustomer,orderDates,observations,globalDiscount,globalDiscountType,toast]);

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
      setOrderDates(draft.payload.dates);setObservations(draft.payload.observations);
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
      cart={cart} dates={orderDates} customer={selectedCustomer}
      searchValue={searchValue} setSearchValue={setSearchValue}
      observations={observations} setObservations={setObservations}
      globalDiscount={globalDiscount} setGlobalDiscount={value=>{
        setGlobalDiscount(value);checkoutRequestRef.current=null;
      }}
      globalDiscountType={globalDiscountType} setGlobalDiscountType={value=>{
        setGlobalDiscountType(value);checkoutRequestRef.current=null;
      }}
      total={finance.total} totalDiscount={finance.totalDiscount} processing={isProcessingOrder}
      onDatesChange={dates=>{setOrderDates(dates);checkoutRequestRef.current=null;}}
      onAdd={(product,quantity)=>addProduct(product,quantity)}
      onQuantityChange={updateQuantity} onItemDiscount={updateItemDiscount}
      onRemove={removeItem} onCustomer={()=>setCustomerModalOpen(true)}
      onRefresh={()=>void refetchProducts()}
      onContinue={beginCheckout} onSaveDraft={saveDraft} onLoadDraft={restoreDraft}
      onClear={clearCart} onOrders={()=>window.dispatchEvent(new Event("closetfesta:open-orders"))}
      draftBusy={draftBusy} hasDraft={hasDraft}
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
