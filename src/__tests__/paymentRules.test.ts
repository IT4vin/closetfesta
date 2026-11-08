import { describe, expect, it } from "vitest";
import { availableInstallments, isMethodEnabled, maximumInstallments, minimumInitialPayment, validatePaymentLines } from "@/lib/paymentRules";
describe("regras financeiras configuráveis", () => {
  it("desativa métodos e valida recebimentos",()=>{
    expect(isMethodEnabled({pix_enabled:false},"pix")).toBe(false);
    expect(isMethodEnabled({},"credit")).toBe(true);
    expect(validatePaymentLines({pix_enabled:false},[{method:"pix",value:50,installments:1}],100)).toMatch(/desativada/);
  });
  it("limita parcelas por faixa de preço e mínimo",()=>{
    const rules={max_installments:10,tier_1_max:199,tier_1_installments:2,
      tier_2_max:499,tier_2_installments:3,tier_5_installments:10,minimum_installment:100};
    expect(maximumInstallments(rules,180)).toBe(2);
    expect(availableInstallments(rules,180)).toEqual([1]);
    expect(availableInstallments(rules,450)).toEqual([1,2,3]);
    expect(maximumInstallments(rules,2000)).toBe(10);
    expect(validatePaymentLines(rules,[{method:"credit",value:180,installments:2}],400)).toMatch(/Parcelamento/);
  });
  it("mantém meios sem parcelamento mesmo se parcela mínima for alta",()=>{
    expect(validatePaymentLines({minimum_installment:500},[{method:"cash",value:10,installments:1}],20)).toBeNull();
  });
  it("calcula sinal padrão e percentual configurado",()=>{
    expect(minimumInitialPayment({},420)).toBe(210);
    expect(minimumInitialPayment({min_deposit_percent:30},420)).toBe(126);
  });
});