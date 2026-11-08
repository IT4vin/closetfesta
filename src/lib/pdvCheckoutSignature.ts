/** Only financial choices and cart content define an idempotent checkout.
 * Client-side timestamps, receipt metadata or renders cannot create a second
 * request ID for the same submitted payment after a timeout.
 */
export function pdvCheckoutSignature(orderData:{
  payment_details?:{
    payments?: Array<{method:string;value:number;installments?:number}>;
    store_credit_amount?:number;
    [key:string]:unknown;
  };
  [key:string]:unknown;
}):string{
  const {payment_details,...contract}=orderData;
  return JSON.stringify({
    ...contract,
    payment_details:{
      store_credit_amount:payment_details?.store_credit_amount??0,
      payments:payment_details?.payments??[],
    },
  });
}
