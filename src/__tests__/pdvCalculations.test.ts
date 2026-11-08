import {describe,expect,it} from "vitest";
import {calculatePDVCart} from "@/lib/pdvCalculations";
const products=[
 {price:320,rental_price:200,quantity:2,discount:20},
 {price:110,rental_price:110,quantity:1,discount:0},
];
describe("carrinho financeiro do PDV",()=>{
  it("separa o valor de cada traje dos descontos e arredonda reais",()=>{
    expect(calculatePDVCart(products,10,"percentage")).toMatchObject({
      subtotal:510,itemDiscount:20,globalAmount:49,totalDiscount:69,total:441,valid:true,
    });
  });
  it("limita desconto global ao restante após descontos dos itens",()=>{
    expect(calculatePDVCart(products,9999,"amount")).toMatchObject({
      subtotal:510,total:0,totalDiscount:510,valid:true,
    });
  });
  it("identifica quantidade, desconto ou percentual inválidos",()=>{
    expect(calculatePDVCart([{...products[0],quantity:21}],0,"amount").valid).toBe(false);
    expect(calculatePDVCart([{...products[0],discount:999}],0,"amount").valid).toBe(false);
    expect(calculatePDVCart(products,101,"percentage").valid).toBe(false);
  });
  it("zera carrinho vazio sem inventar movimentações",()=>{
    expect(calculatePDVCart([],0,"amount")).toMatchObject({subtotal:0,total:0,totalDiscount:0,valid:true});
  });
});
