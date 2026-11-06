import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import PermissionManager from "@/lib/permissions";
import { recordRentalPayment } from "@/lib/rentalLifecycle";
import { supabase } from "@/integrations/supabase/client";

type PaymentRecord = {
  id: string;
  amount: number;
  method: string;
  status: "operator_recorded" | "reconciled" | "reversed";
  recorded_at: string;
};

const currency = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function RentalPaymentActions({
  contractId,
  contractTotal,
}: {
  contractId: string;
  contractTotal: number;
}) {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "credit" | "debit" | "pix" | "transfer">("pix");
  const [installments, setInstallments] = useState("1");
  const [verified, setVerified] = useState(false);
  const requestRef = useRef<{ key: string; signature: string } | null>(null);
  const canRecord = PermissionManager.hasPermission("payments", "create");

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      // RLS do Supabase restringe visualização a operador de caixa e gerência.
      const { data, error: dbError } = await (supabase as any)
        .from("rental_payments")
        .select("id,amount,method,status,recorded_at")
        .eq("contract_id", contractId)
        .order("recorded_at", { ascending: false });
      if (dbError) throw dbError;
      setPayments((data ?? []) as PaymentRecord[]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível consultar os pagamentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canRecord) void load();
  }, [contractId, canRecord]);

  if (!canRecord) return null;

  const paid = payments.filter(payment => payment.status !== "reversed")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const remaining = Math.max(0, Math.round((contractTotal - paid) * 100) / 100);

  const submit = async () => {
    const value = Number(amount);
    const portions = method === "credit" ? Number(installments) : 1;
    if (loading || error || busy || !verified) return;
    if (!Number.isFinite(value) || value <= 0 || Math.round(value * 100) / 100 > remaining) {
      toast({ title: "Valor inválido", description: "O pagamento deve ser positivo e não pode ultrapassar o saldo.", variant: "destructive" });
      return;
    }
    if (!Number.isInteger(portions) || portions < 1 || portions > 24) {
      toast({ title: "Parcelamento inválido", variant: "destructive" });
      return;
    }
    const signature = JSON.stringify([contractId, value, method, portions]);
    if (!requestRef.current || requestRef.current.signature !== signature) {
      requestRef.current = { key: crypto.randomUUID(), signature };
    }
    if (!window.confirm("Confirma que este valor já foi recebido e o comprovante foi conferido?")) return;
    setBusy(true);
    try {
      await recordRentalPayment({
        contractId, requestId: requestRef.current.key, method, amount: value, installments: portions,
      });
      toast({ title: "Recebimento registrado", description: "Registro manual salvo. A conciliação com banco ou adquirente permanece separada." });
      setAmount("");
      setVerified(false);
      requestRef.current = null;
      await load();
    } catch (cause) {
      toast({ title: "Recebimento não registrado", description: cause instanceof Error ? cause.message : "Falha ao gravar.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-lg border bg-background p-3" aria-label="Pagamentos do contrato">
      <h4 className="font-semibold">Pagamentos do aluguel (registro manual)</h4>
      {loading ? <p className="text-sm text-muted-foreground">Consultando pagamentos...</p> : error ?
        <p className="text-sm text-destructive" role="alert">{error}</p> : (
        <>
          <p className="my-2 text-sm">Total: {currency(contractTotal)} | Recebido: {currency(paid)} | <strong>Saldo: {currency(remaining)}</strong></p>
          {payments.length > 0 && <p className="mb-2 text-xs text-muted-foreground">
            {payments.length} lançamento(s) no histórico. Registros manuais não equivalem a confirmação de adquirente.
          </p>}
          {remaining > 0 && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor={`rental-payment-${contractId}`}>Valor recebido (R$)</Label>
                <Input id={`rental-payment-${contractId}`} type="number" min="0.01" step="0.01"
                  className="w-36" value={amount} onChange={e => { setAmount(e.target.value); requestRef.current = null; }} />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`rental-method-${contractId}`}>Forma</Label>
                <select id={`rental-method-${contractId}`} className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={method} onChange={e => { setMethod(e.target.value as typeof method); requestRef.current = null; }}>
                  <option value="pix">Pix</option><option value="cash">Dinheiro</option>
                  <option value="debit">Débito</option><option value="credit">Crédito</option>
                  <option value="transfer">Transferência</option>
                </select>
              </div>
              {method === "credit" && (
                <div className="space-y-1">
                  <Label htmlFor={`rental-installments-${contractId}`}>Parcelas</Label>
                  <Input id={`rental-installments-${contractId}`} type="number" min="1" max="24"
                    className="w-20" value={installments} onChange={e => { setInstallments(e.target.value); requestRef.current = null; }} />
                </div>
              )}
              <label className="flex max-w-xs items-center gap-2 text-xs">
                <input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} />
                Conferi o recebimento real e os dados deste lançamento.
              </label>
              <Button size="sm" disabled={busy || !verified || !Number(amount)} onClick={() => void submit()}>
                {busy ? "Salvando..." : "Registrar recebimento"}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
