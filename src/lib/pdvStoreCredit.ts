export const centavos=(amount:number)=>Math.round(amount*100);
export function storeCreditLimit(balance:number,total:number):number {
 if(!Number.isFinite(balance)||balance<=0||!Number.isFinite(total)||total<=0)return 0;
 return Math.min(centavos(balance),centavos(total))/100;
}
export function creditCheckoutError(
 amount:number,balance:number,total:number,cashPaid:number,minimum:number,
):string|null{
 if(!Number.isFinite(amount)||amount<0||
    Math.abs(amount*100-centavos(amount))>0.0001)
   return "Informe um valor válido em reais e centavos para o crédito da loja.";
 if(amount>storeCreditLimit(balance,total)+0.00001)
   return "Crédito maior do que o saldo disponível do cliente ou total da locação.";
 if(!Number.isFinite(cashPaid)||cashPaid<0||
    Math.abs(cashPaid*100-centavos(cashPaid))>0.0001)
   return "Valor do recebimento inválido.";
 if(centavos(amount)+centavos(cashPaid)>centavos(total))
   return "O crédito e os recebimentos ultrapassam o total do contrato.";
 if(centavos(amount)+centavos(cashPaid)<centavos(minimum))
   return "O crédito e os recebimentos não atingem o sinal mínimo configurado.";
 return null;
}
