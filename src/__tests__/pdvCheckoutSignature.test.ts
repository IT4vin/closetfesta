import {describe,expect,it} from "vitest";
import {pdvCheckoutSignature} from "@/lib/pdvCheckoutSignature";
const initial={
 client_id:"11111111-1111-4111-8111-111111111111",
 customer_name:"Cliente Teste",total:299.9,
 items:[{product_id:"p1",quantity:1}],
 payment_details:{
   store_credit_amount:100,
   payments:[{method:"pix",value:199.9,installments:1}],
   date:"2026-11-08T18:00:00.000Z",
   registration_type:"operator_recorded",
 },
};
describe("chave de idempotência da finalização",()=>{
 it("não muda quando o operador tenta novamente segundos depois",()=>{
  const again={...initial,payment_details:{
    ...initial.payment_details,date:"2026-11-08T18:01:00.000Z",
  }};
  expect(pdvCheckoutSignature(initial)).toBe(pdvCheckoutSignature(again));
 });
 it("altera quando crédito da loja, pagamento ou item muda",()=>{
  expect(pdvCheckoutSignature(initial)).not.toBe(pdvCheckoutSignature({
    ...initial,payment_details:{...initial.payment_details,store_credit_amount:150},
  }));
  expect(pdvCheckoutSignature(initial)).not.toBe(pdvCheckoutSignature({
    ...initial,items:[{product_id:"p2",quantity:1}],
  }));
 });
});
