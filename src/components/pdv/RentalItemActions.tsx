import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ordersApi, type OrderItem } from "@/lib/api";
import { releaseRentalItemFromLaundry } from "@/lib/rentalLifecycle";
import PermissionManager from "@/lib/permissions";

interface RentalItemActionsProps {
  orderId: string;
  item: OrderItem;
  onChanged: () => Promise<unknown> | void;
}

export default function RentalItemActions({ orderId, item, onChanged }: RentalItemActionsProps) {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const registerPickup = async () => {
    if (!window.confirm("Confirmar que o traje foi conferido e entregue à cliente?")) return;
    setBusy(true);
    try {
      await ordersApi.pickupItem(orderId, item.id);
      await onChanged();
      toast({ title: "Retirada registrada", description: "Traje entregue e registrado no banco de dados." });
    } catch (error) {
      toast({ title: "Retirada não registrada", description: error instanceof Error ? error.message : "Erro ao salvar.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const registerReturn = async () => {
    const notes = window.prompt("Observações da devolução (opcional). O traje será direcionado para lavanderia.", "");
    if (notes === null) return;
    if (!window.confirm("Confirmar recebimento físico do traje e envio para lavanderia?")) return;
    setBusy(true);
    try {
      await ordersApi.returnItem(orderId, item.id, { observations: notes });
      await onChanged();
      toast({ title: "Devolução registrada", description: "O traje foi encaminhado para lavanderia no sistema." });
    } catch (error) {
      toast({ title: "Devolução não registrada", description: error instanceof Error ? error.message : "Erro ao salvar.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (item.status === "returned") {
    if (!PermissionManager.hasPermission("inventory", "update")) {
      return <span className="text-sm text-muted-foreground">Aguardando liberação da lavanderia</span>;
    }
    return <Button size="sm" variant="outline" disabled={busy}
      onClick={async () => {
        if (!window.confirm("A lavanderia e a conferência terminaram? Confirmar que o traje está limpo, ajustado e pronto para nova locação?")) return;
        setBusy(true);
        try {
          await releaseRentalItemFromLaundry(item.id);
          await onChanged();
          toast({ title: "Traje liberado", description: "Unidade disponível para próximas locações." });
        } catch (error) {
          toast({ title: "Liberação não realizada", description: error instanceof Error ? error.message : "Erro ao salvar.", variant: "destructive" });
        } finally {
          setBusy(false);
        }
      }}>
      {busy ? "Salvando..." : "Liberar após lavanderia"}
    </Button>;
  }
  if (item.status === "picked_up") {
    return <Button size="sm" disabled={busy} onClick={() => void registerReturn()}>
      {busy ? "Salvando..." : "Registrar devolução"}
    </Button>;
  }
  return <Button size="sm" variant="outline" disabled={busy} onClick={() => void registerPickup()}>
    {busy ? "Salvando..." : "Registrar retirada"}
  </Button>;
}
