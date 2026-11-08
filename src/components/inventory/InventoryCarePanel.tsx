import React, { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, ClipboardList, RefreshCw, Scissors } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PermissionManager from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LiveItem, LiveProduct, LiveUnit } from "@/hooks/useLiveClosetData";
import { localDay } from "@/lib/operationalAnalytics";

type CareTask = {
  id: string; unit_id: string; kind: "laundry" | "maintenance";
  status: "open" | "completed" | "superseded"; reason: string;
  source_item_id: string | null; opened_at: string; opened_by: string | null;
  closed_at: string | null; closing_notes: string | null;
};
const db = supabase as any;
const date = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
const careLabels: Record<CareTask["kind"], string> = {
  laundry: "Lavanderia", maintenance: "Manutenção",
};
const statusLabels: Record<CareTask["status"], string> = {
  open: "Em andamento", completed: "Concluído", superseded: "Redirecionado",
};

export default function InventoryCarePanel({
  units, products, items, onChanged,
}: {
  units: readonly LiveUnit[];
  products: readonly LiveProduct[];
  items: readonly LiveItem[];
  onChanged: () => Promise<unknown> | void;
}) {
  const { toast } = useToast();
  const cache = useQueryClient();
  const canRead = PermissionManager.hasPermission("inventory", "read");
  const canManage = PermissionManager.hasPermission("inventory", "update");
  const [pending, setPending] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const operationRef = useRef<{ unitId: string; reason: string; id: string } | null>(null);
  const tasksQuery = useQuery({
    queryKey: ["closet-care-tasks"],
    enabled: canRead,
    queryFn: async (): Promise<CareTask[]> => {
      const { data, error } = await db.from("product_care_tasks")
        .select("id,unit_id,kind,status,reason,source_item_id,opened_at,opened_by,closed_at,closing_notes")
        .order("opened_at", { ascending: false })
        .limit(200);
      if (error) throw new Error("Não foi possível consultar os atendimentos: " + error.message);
      return (data || []) as CareTask[];
    },
  });
  const tasks = tasksQuery.data || [];
  const currentTasks = useMemo(() => tasks.filter((task) => task.status === "open"), [tasks]);
  const taskByUnit = useMemo(() => new Map(currentTasks.map((task) => [task.unit_id, task])), [currentTasks]);
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const unitById = useMemo(() => new Map(units.map((unit) => [unit.id, unit])), [units]);
  const inCare = units.filter((unit) => unit.status === "laundry" || unit.status === "maintenance");
  const today = localDay(new Date());
  const reload = async () => {
    await Promise.all([
      cache.invalidateQueries({ queryKey: ["closet-care-tasks"] }),
      cache.invalidateQueries({ queryKey: ["closet-live-operations"] }),
      Promise.resolve(onChanged()),
    ]);
  };
  const startMaintenance = async (unit: LiveUnit) => {
    if (!canManage || pending) return;
    const product = productById.get(unit.product_id);
    const message = window.prompt(
      "Qual o motivo da manutenção de " + (product?.name || "este traje") + "? (mínimo 5 caracteres)",
      "",
    );
    if (message === null) return;
    const reason = message.trim();
    if (reason.length < 5 || reason.length > 500) {
      toast({ title: "Motivo inválido", description: "Escreva entre 5 e 500 caracteres.", variant: "destructive" });
      return;
    }
    const futureReservations = items.filter((item) =>
      item.unit_id === unit.id && item.status === "confirmed" && item.return_date >= today);
    if (futureReservations.length && !window.confirm(
      "Este exemplar tem " + futureReservations.length +
      " reserva(s) ainda não concluída(s). A manutenção impedirá a retirada até a liberação. " +
      "Confirme que irá revisar os contratos afetados.",
    )) return;
    if (!window.confirm(
      "Registrar manutenção e bloquear a unidade " + unit.unit_number +
      " para novas retiradas? A liberação posterior exige conferência da gerência.",
    )) return;
    setPending(unit.id);
    try {
      const previous = operationRef.current;
      const id = previous?.unitId === unit.id && previous.reason === reason
        ? previous.id : crypto.randomUUID();
      operationRef.current = { unitId: unit.id, reason, id };
      const { data, error } = await db.rpc("closet_care_start_maintenance", {
        p_unit_id: unit.id, p_reason: reason, p_operation_id: id,
      });
      if (error || !data?.id) throw new Error(error?.message || "Manutenção não confirmada pelo banco.");
      operationRef.current = null;
      await reload();
      toast({ title: "Manutenção aberta", description: "O exemplar foi bloqueado e o histórico foi registrado." });
    } catch (cause) {
      toast({ title: "Manutenção não registrada", description: cause instanceof Error ? cause.message : "Falha ao salvar.", variant: "destructive" });
    } finally {
      setPending("");
    }
  };
  const finishCare = async (task: CareTask) => {
    if (!canManage || pending) return;
    const notes = window.prompt("Observações da conferência final (opcional, até 1.000 caracteres):", "");
    if (notes === null) return;
    if (notes.length > 1000) {
      toast({ title: "Observação muito longa", variant: "destructive" });
      return;
    }
    if (!window.confirm(
      "Confirmar que o exemplar foi fisicamente conferido, está limpo, sem avarias pendentes " +
      "e pode voltar ao estoque disponível?",
    )) return;
    setPending(task.id);
    try {
      const { data, error } = await db.rpc("closet_care_complete", {
        p_task_id: task.id, p_notes: notes.trim() || null,
      });
      if (error || data?.status !== "completed") throw new Error(error?.message || "Liberação não confirmada.");
      await reload();
      toast({ title: "Traje liberado", description: "Conclusão registrada, unidade disponível após conferência." });
    } catch (cause) {
      toast({ title: "Não foi possível liberar", description: cause instanceof Error ? cause.message : "Erro de confirmação.", variant: "destructive" });
    } finally {
      setPending("");
    }
  };

  if (!canRead) return null;
  return <Card>
    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
      <div>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardCheck className="h-5 w-5 text-marsala-700" />Lavanderia e manutenção
        </CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Atendimento por exemplar com registro no Supabase e liberação por gerência.
        </p>
      </div>
      <Button variant="outline" size="sm" disabled={tasksQuery.isFetching || !!pending}
        onClick={() => void reload()}><RefreshCw className="mr-2 h-4 w-4" />Atualizar</Button>
    </CardHeader>
    <CardContent className="space-y-5">
      {tasksQuery.isPending && <p role="status" className="text-sm text-muted-foreground">Carregando ordens reais...</p>}
      {tasksQuery.error && <div role="alert" className="rounded-md border border-red-200 p-3 text-sm text-red-700">
        {tasksQuery.error instanceof Error ? tasksQuery.error.message : "Erro ao consultar ordens."}
        <Button size="sm" variant="outline" className="ml-2" onClick={() => void tasksQuery.refetch()}>Tentar novamente</Button>
      </div>}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Na lavanderia</p>
          <p className="text-2xl font-semibold">{units.filter((unit) => unit.status === "laundry").length}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Em manutenção</p>
          <p className="text-2xl font-semibold">{units.filter((unit) => unit.status === "maintenance").length}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Ordens abertas</p>
          <p className="text-2xl font-semibold">{tasksQuery.isSuccess ? currentTasks.length : "—"}</p>
        </div>
      </div>
      {tasksQuery.isSuccess && <div className="space-y-3">
        <h3 className="text-sm font-semibold">Exemplares que aguardam conferência</h3>
        {inCare.length === 0 && <p className="text-sm text-muted-foreground">Nenhum exemplar em lavanderia ou manutenção.</p>}
        {inCare.map((unit) => {
          const task = taskByUnit.get(unit.id);
          const product = productById.get(unit.product_id);
          return <div key={unit.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3">
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold">{product?.name || "Produto não encontrado"} · Exemplar {unit.unit_number}</p>
              <p className="text-muted-foreground">
                {unit.status === "laundry" ? "Lavanderia" : "Manutenção"}
                {task ? " · Início: " + date(task.opened_at) : " · Ordem ainda não encontrada"}
              </p>
              {task && <p className="mt-1 whitespace-pre-wrap">{task.reason}</p>}
            </div>
            {canManage && <div className="flex flex-wrap gap-2">
              {unit.status === "laundry" && <Button size="sm" variant="outline"
                disabled={!!pending} onClick={() => void startMaintenance(unit)}>
                <Scissors className="mr-2 h-4 w-4" />Enviar para reparo
              </Button>}
              {task && <Button size="sm" disabled={!!pending}
                className="bg-marsala hover:bg-marsala-700" onClick={() => void finishCare(task)}>
                <ClipboardCheck className="mr-2 h-4 w-4" />{pending === task.id ? "Salvando..." : "Concluir e liberar"}
              </Button>}
            </div>}
          </div>;
        })}
      </div>}
      {canManage && tasksQuery.isSuccess && <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Scissors className="h-4 w-4" />Iniciar manutenção de exemplar disponível</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {units.filter((unit) => unit.status === "available" && productById.has(unit.product_id))
            .slice(0, 100).map((unit) => {
              const product = productById.get(unit.product_id);
              return <div key={unit.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
                <span className="min-w-0 truncate">{product?.name} · Exemplar {unit.unit_number}</span>
                <Button variant="outline" size="sm" disabled={!!pending}
                  onClick={() => void startMaintenance(unit)}>Manutenção</Button>
              </div>;
            })}
        </div>
        {units.filter((unit) => unit.status === "available").length > 100 &&
          <p className="text-xs text-muted-foreground">Exibindo os primeiros 100 exemplares. A busca por código e a paginação serão ampliadas.</p>}
      </div>}
      <div>
        <Button variant="ghost" size="sm" onClick={() => setShowHistory((value) => !value)}>
          <ClipboardList className="mr-2 h-4 w-4" />{showHistory ? "Ocultar" : "Consultar"} histórico de atendimentos
        </Button>
        {showHistory && <div className="mt-3 space-y-2">
          {tasks.length === 0 && <p className="text-sm text-muted-foreground">Nenhum atendimento registrado.</p>}
          {tasks.map((task) => {
            const unit = unitById.get(task.unit_id);
            const product = unit && productById.get(unit.product_id);
            return <div key={task.id} className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <strong>{product?.name || "Produto histórico"} · {unit ? "Exemplar " + unit.unit_number : "Unidade anterior"}</strong>
                <span>{careLabels[task.kind]} · {statusLabels[task.status]}</span>
              </div>
              <p className="text-xs text-muted-foreground">Aberto em {date(task.opened_at)}
                {task.closed_at ? " · Encerrado em " + date(task.closed_at) : ""}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{task.reason}</p>
              {task.closing_notes && <p className="mt-1 text-xs text-muted-foreground">
                Encerramento: {task.closing_notes}</p>}
            </div>;
          })}
          <p className="text-xs text-muted-foreground">Últimos 200 atendimentos. Histórico preservado no banco.</p>
        </div>}
      </div>
    </CardContent>
  </Card>;
}
