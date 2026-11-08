import type { ClosetSettingValues } from "@/lib/closetSettings";
export type PaymentMethodCode = "pix" | "cash" | "debit" | "credit" | "transfer";
const methods = ["pix", "cash", "debit", "credit", "transfer"] as const;
const keyByMethod: Record<PaymentMethodCode, string> = {
  pix: "pix_enabled", cash: "cash_enabled", debit: "debit_enabled", credit: "credit_enabled", transfer: "transfer_enabled",
};
export function isMethodEnabled(settings: ClosetSettingValues, method: string): boolean {
  return methods.includes(method as PaymentMethodCode) &&
    settings[keyByMethod[method as PaymentMethodCode]] !== false;
}
function positiveInteger(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}
/** A configuração de parcelas não adiciona juros nem assume taxa da adquirente. */
export function maximumInstallments(settings: ClosetSettingValues, amount: number): number {
  const global = Math.min(24, positiveInteger(settings.max_installments, 12));
  const threshold = [
    ["tier_1_max","tier_1_installments"],
    ["tier_2_max","tier_2_installments"],
    ["tier_3_max","tier_3_installments"],
    ["tier_4_max","tier_4_installments"],
  ] as const;
  for (const [maxKey, installmentsKey] of threshold) {
    const limit = Number(settings[maxKey]);
    const selected = Number(settings[installmentsKey]);
    if (Number.isFinite(limit) && limit >= 0 && Number.isInteger(selected) && selected >= 1 && amount <= limit) {
      return Math.min(global, selected);
    }
  }
  return Math.min(global, positiveInteger(settings.tier_5_installments, global));
}
export function availableInstallments(settings: ClosetSettingValues, amount: number): number[] {
  if (!Number.isFinite(amount) || amount <= 0) return [];
  const max = maximumInstallments(settings, amount);
  const minimum = Math.max(0, Number(settings.minimum_installment) || 0);
  return Array.from({length:max}, (_,index)=>index+1).filter(n => amount/n >= minimum-0.005);
}
export function minimumInitialPayment(operations: ClosetSettingValues, total: number): number {
  const pct = Number(operations.min_deposit_percent);
  const percent = Number.isFinite(pct) && pct >= 0 && pct <= 100 ? pct : 50;
  return Math.round(total*percent)/100;
}
export function validatePaymentLines(
  settings: ClosetSettingValues, lines: {method:string; value:number; installments:number}[],
  total: number,
): string | null {
  if (!lines.length) return "Registre pelo menos uma forma de pagamento.";
  if (lines.some(p=>!isMethodEnabled(settings,p.method))) return "Existe uma forma de pagamento desativada nas configurações.";
  if (lines.some(p=>!Number.isFinite(p.value)||p.value<=0||Math.abs(p.value*100-Math.round(p.value*100))>0.0001)) return "Valor de pagamento inválido.";
  if (lines.some(p=>!Number.isInteger(p.installments)||
    (p.method==="credit" ? !availableInstallments(settings,p.value).includes(p.installments) : p.installments!==1))) {
    return "Parcelamento incompatível com as regras cadastradas.";
  }
  if (lines.reduce((sum,p)=>sum+p.value,0)>total+0.005) return "Os pagamentos ultrapassam o total do pedido.";
  return null;
}
