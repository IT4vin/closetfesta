import React, { useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, LockKeyhole, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { ProductCartAvailability, RentalHistoryEntry } from "@/lib/cartAvailability";
import type { CartItem, OrderDates } from "@/components/pdv/PDVSale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const day = (value: string | null | undefined) => value
  ? value.slice(0, 10).split("-").reverse().join("/") : "—";
const labels: Record<string, string> = {
  confirmed: "Reservado", picked_up: "Retirado", returned: "Devolvido",
  cancelled: "Cancelado", completed: "Concluído",
};
const label = (status: string) => labels[status] || status;

function HistoryRow({ item, conflict }: { item: RentalHistoryEntry; conflict: boolean }) {
  return <div className={"rounded-lg border p-3 text-sm " +
    (conflict ? "border-amber-300 bg-amber-50/60" : "border-border")}>
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <Link className="font-semibold text-marsala-800 underline-offset-2 hover:underline"
        to={"/pdv/pedidos/" + item.contract_id} target="_blank" rel="noopener noreferrer">
        Contrato nº {item.contract_number}
      </Link>
      <div className="flex items-center gap-2">
        {conflict && <Badge variant="destructive">Conflito de datas</Badge>}
        {item.override && <Badge variant="outline" className="border-amber-400 text-amber-800">Exceção</Badge>}
        <Badge variant="outline">{label(item.status)}</Badge>
      </div>
    </div>
    <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
      <span>Exemplar: {item.unit_number || "—"}</span>
      <span>Prova: {day(item.try_on_date)}</span>
      <span>Retirada: <strong className="text-foreground">{day(item.pickup_date)}</strong></span>
      <span>Evento: {day(item.event_date)}</span>
      <span>Devolução prevista: <strong className="text-foreground">{day(item.return_date)}</strong></span>
      <span>Devolução realizada: {day(item.actual_return_at)}</span>
    </div>
  </div>;
}

export default function RentalAvailabilityDialog({
  item, dates, availability, open, canOverride, onClose, onRemove, onOverride,
}: {
  item: CartItem | null;
  dates: OrderDates;
  availability: ProductCartAvailability | null;
  open: boolean;
  canOverride: boolean;
  onClose: () => void;
  onRemove: (productId: string) => void;
  onOverride: (productId: string, reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [visible, setVisible] = useState(25);
  useEffect(() => { setReason(""); setVisible(25); }, [item?.id, dates.pickupDate, dates.returnDate]);
  const conflicts = availability?.conflicts || [];
  const history = availability?.history || [];
  const conflictIds = new Set(conflicts.map((row) => row.id));
  const allowedQuantity = Boolean(item && availability &&
    availability.physical_available_units >= item.quantity);
  const reasonValid = reason.trim().length >= 10 && reason.trim().length <= 500;

  return <Dialog open={open && Boolean(item)} onOpenChange={(value) => { if (!value) onClose(); }}>
    <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden border-marsala-200 p-0">
      <DialogHeader className="shrink-0 space-y-2 border-b px-5 py-4 text-left">
        <DialogTitle className="flex items-center gap-2 text-lg text-marsala-800">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Produto indisponível para as datas escolhidas
        </DialogTitle>
        <DialogDescription>
          {item?.name || "Traje"} — de {day(dates.pickupDate)} a {day(dates.returnDate)}.
          Confira todo o histórico antes de remover o produto ou autorizar uma exceção.
        </DialogDescription>
      </DialogHeader>
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Quantidade solicitada</p>
            <p className="text-xl font-semibold">{item?.quantity || 0}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Exemplares livres nas datas</p>
            <p className="text-xl font-semibold text-red-700">{availability?.free_units ?? "—"}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Exemplares fisicamente aptos</p>
            <p className="text-xl font-semibold">{availability?.physical_available_units ?? "—"}</p>
          </div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          <strong>Atenção:</strong> o desbloqueio autoriza registrar uma reserva com conflito,
          mas não cria outro traje. Se o exemplar estiver entregue a outra cliente,
          a retirada física permanecerá bloqueada até que o conflito seja resolvido.
        </div>
        {conflicts.length > 0 && <section className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="h-4 w-4" />Reservas que coincidem com essas datas ({conflicts.length})
          </h3>
          {conflicts.map((row) => <HistoryRow key={row.id} item={row} conflict />)}
        </section>}
        <section className="space-y-2">
          <h3 className="font-semibold">Histórico completo de locações ({history.length})</h3>
          {history.length === 0 && <p className="text-sm text-muted-foreground">
            Nenhuma locação anterior registrada. Confira o status físico do estoque.
          </p>}
          {history.slice(0, visible).map((row) =>
            <HistoryRow key={row.id} item={row} conflict={conflictIds.has(row.id)} />)}
          {history.length > visible && <Button variant="outline" size="sm"
            onClick={() => setVisible((count) => count + 50)}>
            Mostrar mais {Math.min(50, history.length - visible)} locações
          </Button>}
        </section>
        {canOverride && allowedQuantity && <section className="space-y-2 rounded-lg border p-3">
          <Label htmlFor="override-reason" className="font-semibold">
            Justificativa da gerência para desbloquear (obrigatória)
          </Label>
          <Textarea id="override-reason" value={reason}
            onChange={(e) => setReason(e.target.value)} maxLength={500}
            placeholder="Ex.: Cliente ciente; gerência providenciará substituição antes da retirada." />
          <p className="text-xs text-muted-foreground">{reason.trim().length}/500 caracteres · mínimo 10.</p>
        </section>}
        {!canOverride && <p className="flex gap-2 text-sm text-amber-900">
          <LockKeyhole className="h-4 w-4 shrink-0" />
          Somente gerente ou administrador pode desbloquear um conflito.
        </p>}
        {!allowedQuantity && <p className="text-sm text-red-700">
          Não há exemplares fisicamente aptos suficientes para essa quantidade.
          Remova ou reduza o item; manutenção ou lavanderia não podem ser desbloqueadas.
        </p>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t bg-background px-5 py-4">
        <Button variant="outline" className="border-red-200 text-red-700"
          onClick={() => item && onRemove(item.id)}>
          <Trash2 className="mr-2 h-4 w-4" />Remover produto
        </Button>
        <Button disabled={!canOverride || !allowedQuantity || !reasonValid}
          className="bg-marsala hover:bg-marsala-700"
          onClick={() => item && onOverride(item.id, reason.trim())}>
          <LockKeyhole className="mr-2 h-4 w-4" />Desbloquear produto e continuar mesmo assim
        </Button>
      </div>
    </DialogContent>
  </Dialog>;
}
