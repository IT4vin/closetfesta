import { describe,expect,it } from "vitest";
import { creditCheckoutError,storeCreditLimit } from "@/lib/pdvStoreCredit";
describe("Crédito da loja na finalização do PDV",()=>{
 it("limita o resgate ao saldo real e ao valor da locação",()=>{
   expect(storeCreditLimit(450,300)).toBe(300);
   expect(storeCreditLimit(100.10,300)).toBe(100.10);
   expect(storeCreditLimit(0,300)).toBe(0);
 });
 it("permite 100% crédito sem novo recebimento",()=>{
   expect(creditCheckoutError(300,300,300,0,150)).toBeNull();
 });
 it("permite crédito como sinal parcial, sem receber dinheiro agora",()=>{
   expect(creditCheckoutError(150,300,300,0,150)).toBeNull();
 });
 it("permite combinação crédito e Pix",()=>{
   expect(creditCheckoutError(100.10,100.10,300,49.90,150)).toBeNull();
 });
 it("bloqueia uso sem saldo, sobrepagamento e sinal inferior ao mínimo",()=>{
   expect(creditCheckoutError(50,40,300,100,150)).toMatch(/maior/);
   expect(creditCheckoutError(150,200,300,160,150)).toMatch(/ultrapassam/);
   expect(creditCheckoutError(20,200,300,100,150)).toMatch(/sinal mínimo/);
 });
 it("não aceita valores negativos ou fração de centavo",()=>{
   expect(creditCheckoutError(-1,300,300,151,150)).toMatch(/valor válido/);
   expect(creditCheckoutError(50.001,300,300,100,150)).toMatch(/valor válido/);
 });
});
