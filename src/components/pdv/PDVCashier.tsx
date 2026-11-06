import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, LockKeyhole, RefreshCw, Wallet, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type CashRegister = {
  id: string;
  status: string;
  opening_amount: number | string;
  closing_amount: number | string | null;
  expected_amount: number | string | null;
  difference: number | string | null;
  opened_at: string;
  closed_at: string | null;
  notes: string | null;
};
type CashMovement = {
  id: string;
  type: string;
  amount: number | string;
  description: string | null;
  created_at: string;
};

const currency = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dateTime = (value: string) => new Date(value).toLocaleString("pt-BR");
const db = supabase as any;

const PDVCashier = () => {
  const { toast } = useToast();
  const [register, setRegister] = useState<CashRegister | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<"open" | "close" | "movement" | null>(null);
  const [openingAmount, setOpeningAmount] = useState("0");
  const [countedAmount, setCountedAmount] = useState("");
  const [closingNote, setClosingNote] = useState("");
  const [movementKind, setMovementKind] = useState<"withdrawal" | "reinforcement">("withdrawal");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementDescription, setMovementDescription] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: identity, error: authError } = await supabase.auth.getUser();
      if (authError || !identity.user) throw new Error("Faça login para consultar o caixa.");
      const { data: cash, error: cashError } = await supabase.from("cash_registers")
        .select("id,status,opening_amount,closing_amount,expected_amount,difference,opened_at,closed_at,notes")
        .eq("opened_by", identity.user.id)
        .order("opened_at", { ascending: false })
        .limit(1).maybeSingle();
      if (cashError) throw cashError;
      setRegister(cash as CashRegister | null);
      if (!cash) {
        setMovements([]);
      } else {
        const { data, error: movementError } = await supabase.from("cash_movements")
          .select("id,type,amount,description,created_at")
          .eq("cash_register_id", cash.id)
          .order("created_at", { ascending: true });
        if (movementError) throw movementError;
        setMovements((data ?? []) as CashMovement[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o caixa.");
      setRegister(null);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const expectedBalance = useMemo(
    () => Number(register?.opening_amount ?? 0) +
      movements.reduce((sum, item) => sum + Number(item.amount), 0),
    [register, movements],
  );
  const isOpen = register?.status === "open";

  const execute = async (action: () => Promise<void>, success: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      toast({ title: success, description: "Movimentação registrada no banco de dados." });
      setDialog(null);
      await load();
    } catch (err) {
      toast({
        title: "Operação não concluída",
        description: err instanceof Error ? err.message : "O banco não confirmou a operação.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const openCash = async () => {
    const amount = Number(openingAmount);
    if (!Number.isFinite(amount) || amount < 0) return;
    await execute(async () => {
      const { error } = await db.rpc("cashier_open", { p_amount: amount });
      if (error) throw error;
      setOpeningAmount("0");
    }, "Caixa aberto");
  };

  const moveCash = async () => {
    if (!register || !isOpen) return;
    const amount = Number(movementAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    await execute(async () => {
      const { error } = await db.rpc("cashier_move", {
        p_cash_id: register.id,
        p_kind: movementKind,
        p_amount: amount,
        p_description: movementDescription.trim() || null,
      });
      if (error) throw error;
      setMovementAmount("");
      setMovementDescription("");
    }, movementKind === "withdrawal" ? "Sangria registrada" : "Reforço registrado");
  };

  const closeCash = async () => {
    if (!register || !isOpen || countedAmount.trim() === "") return;
    const amount = Number(countedAmount);
    if (!Number.isFinite(amount) || amount < 0) return;
    await execute(async () => {
      const { error } = await db.rpc("cashier_close", {
        p_cash_id: register.id,
        p_counted: amount,
        p_note: closingNote.trim() || null,
      });
      if (error) throw error;
      setCountedAmount("");
      setClosingNote("");
    }, "Caixa fechado");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">Controle de Caixa</h2>
          <p className="text-sm text-muted-foreground">Histórico persistente por operador</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading || busy}>
          <RefreshCw className="mr-2 h-4 w-4" />Atualizar
        </Button>
      </div>
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        A conciliação automática de recebimentos dos contratos ainda está em desenvolvimento.
        O saldo abaixo considera abertura, sangrias e reforços registrados neste caixa.
        Não use este valor como fechamento financeiro completo da loja.
      </div>
      {error && <div role="alert" className="rounded-md border border-destructive p-3 text-destructive">{error}</div>}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />Status do Caixa</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-3">
                <p className="font-semibold">{isOpen ? "Aberto" : "Fechado"}</p>
                <p className="text-xs text-muted-foreground">{register ? dateTime(register.opened_at) : "Nenhum caixa encontrado"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo esperado (sem recebimentos de contratos)</p>
                <p className="text-2xl font-bold">{currency(expectedBalance)}</p>
                <p className="text-xs text-muted-foreground">Saldo inicial: {currency(Number(register?.opening_amount ?? 0))}</p>
              </div>
              {register && !isOpen && register.closed_at && (
                <div className="text-sm space-y-1">
                  <p>Fechado em: {dateTime(register.closed_at)}</p>
                  <p>Valor contado: {currency(Number(register.closing_amount ?? 0))}</p>
                  <p>Diferença: {currency(Number(register.difference ?? 0))}</p>
                </div>
              )}
              {isOpen ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => { setMovementKind("withdrawal"); setDialog("movement"); }}>
                      <ArrowUp className="mr-1 h-4 w-4" />Sangria
                    </Button>
                    <Button variant="outline" onClick={() => { setMovementKind("reinforcement"); setDialog("movement"); }}>
                      <ArrowDown className="mr-1 h-4 w-4" />Reforço
                    </Button>
                  </div>
                  <Button variant="destructive" className="w-full" onClick={() => setDialog("close")}>
                    <LockKeyhole className="mr-2 h-4 w-4" />Fechar caixa
                  </Button>
                </div>
              ) : <Button className="w-full" onClick={() => setDialog("open")}>Abrir caixa</Button>}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Movimentações da última sessão</CardTitle></CardHeader>
            <CardContent>
              {!movements.length ? <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada.</p> : (
                <div className="space-y-2 max-h-[440px] overflow-y-auto">
                  {movements.map(item => (
                    <div key={item.id} className="flex justify-between gap-3 border-b py-2 text-sm">
                      <div>
                        <p className="font-medium">{item.type === "opening" ? "Abertura" : item.type === "closing" ? "Fechamento" : item.type === "withdrawal" ? "Sangria" : item.type === "reinforcement" ? "Reforço" : item.type}</p>
                        <p className="text-xs text-muted-foreground">{dateTime(item.created_at)}{item.description ? ` — ${item.description}` : ""}</p>
                      </div>
                      <span className="font-semibold tabular-nums">{currency(Number(item.amount))}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={dialog === "open"} onOpenChange={value => !busy && setDialog(value ? "open" : null)}>
        <DialogContent><DialogHeader><DialogTitle>Abertura de caixa</DialogTitle></DialogHeader>
          <Label htmlFor="openingValue">Valor inicial em dinheiro</Label>
          <Input id="openingValue" type="number" min="0" step="0.01" value={openingAmount} onChange={e => setOpeningAmount(e.target.value)} />
          <DialogFooter><Button variant="outline" onClick={() => setDialog(null)} disabled={busy}>Cancelar</Button>
            <Button onClick={openCash} disabled={busy || !Number.isFinite(Number(openingAmount)) || Number(openingAmount) < 0}>Confirmar abertura</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={dialog === "movement"} onOpenChange={value => !busy && setDialog(value ? "movement" : null)}>
        <DialogContent><DialogHeader><DialogTitle>{movementKind === "withdrawal" ? "Sangria" : "Reforço"}</DialogTitle></DialogHeader>
          <Label htmlFor="movementValue">Valor</Label>
          <Input id="movementValue" type="number" min="0.01" step="0.01" value={movementAmount} onChange={e => setMovementAmount(e.target.value)} />
          <Label htmlFor="movementDescription">Descrição</Label>
          <Input id="movementDescription" value={movementDescription} onChange={e => setMovementDescription(e.target.value)} />
          <DialogFooter><Button variant="outline" onClick={() => setDialog(null)} disabled={busy}>Cancelar</Button>
            <Button onClick={moveCash} disabled={busy || Number(movementAmount) <= 0}>Registrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={dialog === "close"} onOpenChange={value => !busy && setDialog(value ? "close" : null)}>
        <DialogContent><DialogHeader><DialogTitle>Fechamento de caixa</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Conte o dinheiro físico. A conciliação dos recebimentos de contratos ainda não está integrada.</p>
          <Label htmlFor="countedValue">Valor contado em dinheiro</Label>
          <Input id="countedValue" type="number" min="0" step="0.01" value={countedAmount} onChange={e => setCountedAmount(e.target.value)} />
          <Label htmlFor="closingNote">Observações</Label>
          <Input id="closingNote" value={closingNote} onChange={e => setClosingNote(e.target.value)} />
          <DialogFooter><Button variant="outline" onClick={() => setDialog(null)} disabled={busy}>Cancelar</Button>
            <Button variant="destructive" onClick={closeCash} disabled={busy || countedAmount.trim() === "" || Number(countedAmount) < 0}>Confirmar fechamento</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PDVCashier;
