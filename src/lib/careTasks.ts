import type { LiveItem, LiveUnit } from "@/hooks/useLiveClosetData";

/**
 * A manutenção é iniciada apenas para exemplares fisicamente presentes.
 * A regra definitiva de bloqueio ocorre na RPC transacional do Supabase.
 */
export function canStartCareMaintenance(status: LiveUnit["status"]): boolean {
  return status === "available" || status === "laundry";
}

/** Contratos confirmados que podem exigir troca de exemplar. */
export function pendingBookingsForMaintenance(
  items: readonly LiveItem[],
  unitId: string,
  today: string,
): LiveItem[] {
  return items.filter((item) =>
    item.unit_id === unitId &&
    item.status === "confirmed" &&
    item.return_date >= today
  );
}

export function canReleaseCare(
  task: { status: string; kind: string } | null | undefined,
  unit: Pick<LiveUnit, "status"> | null | undefined,
): boolean {
  return Boolean(task && unit && task.status === "open" &&
    (task.kind === "laundry" || task.kind === "maintenance") &&
    task.kind === unit.status);
}
