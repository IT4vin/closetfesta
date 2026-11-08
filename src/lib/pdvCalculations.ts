export type PDVCalculationLine = {
  price:number;
  rental_price?:number;
  rentalPrice?:number;
  quantity:number;
  discount:number;
};
export type PDVDiscountKind="percentage"|"amount";
export const roundBRL=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;

/** Valores informativos do carrinho. O RPC revalida preços e disponibilidade. */
export function calculatePDVCart(items:PDVCalculationLine[],discount:number,kind:PDVDiscountKind) {
  const subtotal=roundBRL(items.reduce((sum,item)=>
    sum+Number(item.rental_price??item.rentalPrice??item.price??0)*item.quantity,0));
  const itemDiscount=roundBRL(items.reduce((sum,item)=>sum+item.discount,0));
  const afterItems=roundBRL(Math.max(0,subtotal-itemDiscount));
  const globalAmount=kind==="percentage"
    ?roundBRL(afterItems*Math.min(100,Math.max(0,discount))/100)
    :roundBRL(Math.min(afterItems,Math.max(0,discount)));
  const totalDiscount=roundBRL(itemDiscount+globalAmount);
  const total=roundBRL(Math.max(0,subtotal-totalDiscount));
  const valid=items.every(item=>{
    const price=Number(item.rental_price??item.rentalPrice??item.price??0);
    return Number.isFinite(price)&&price>=0&&Number.isInteger(item.quantity)&&item.quantity>=1
      &&item.quantity<=20&&Number.isFinite(item.discount)&&item.discount>=0
      &&item.discount<=price*item.quantity;
  })&&Number.isFinite(discount)&&discount>=0&&
    (kind!=="percentage"||discount<=100);
  return {subtotal,itemDiscount,globalAmount,totalDiscount,total,totalRentals:total,valid};
}
