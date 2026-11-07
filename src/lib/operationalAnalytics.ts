import type { LiveAppointment, LiveClosetData, LiveFinanceData, LiveItem } from "@/hooks/useLiveClosetData";

export type OperationKind = "prova" | "retirada" | "devolucao";
export type OperationRow = {
  id: string; kind: OperationKind; day: string; clientId: string | null;
  productId: string | null; contractId: string | null; description: string;
  source: "agenda" | "locacao";
};
export type Period = "day" | "week" | "month";
export const localDay = (date: Date | string) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(typeof date === "string" ? new Date(date) : date);

export function addDays(day: string, count: number) {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + count);
  return d.toISOString().slice(0, 10);
}
export function periodStart(today: string, period: Period): string {
  if (period === "day") return today;
  if (period === "month") return today.slice(0, 7) + "-01";
  const dayOfWeek = new Date(today + "T12:00:00Z").getUTCDay();
  return addDays(today, -((dayOfWeek + 6) % 7));
}
export const activeStatuses = new Set(["confirmed", "picked_up", "reserved", "pending"]);
export const terminalStatuses = new Set(["cancelled", "returned", "completed", "released"]);

export function operationRows(data: LiveClosetData): OperationRow[] {
  const contractClient = new Map(data.contracts.map(c => [c.id, c.client_id]));
  const rows: OperationRow[] = [];
  const appointmentKeys = new Set<string>();

  for (const appointment of data.appointments) {
    if (["cancelled", "completed", "done"].includes(appointment.status)) continue;
    const title = appointment.title.toLowerCase();
    const kind: OperationKind | null = title.includes("prov") ? "prova" :
      title.includes("retir") ? "retirada" : title.includes("devol") ? "devolucao" : null;
    if (!kind) continue;
    const day = localDay(appointment.start_at);
    const clientId = appointment.client_id;
    if (clientId) appointmentKeys.add([kind, clientId, day].join(":"));
    rows.push({ id: "appointment:" + appointment.id, kind, day, clientId, productId: null,
      contractId: null, description: appointment.title, source: "agenda" });
  }

  const insert = (item: LiveItem, kind: OperationKind, day: string | null | undefined) => {
    if (!day) return;
    const clientId = contractClient.get(item.contract_id) ?? null;
    if (clientId && appointmentKeys.has([kind, clientId, day].join(":"))) return;
    rows.push({ id: "item:" + item.id + ":" + kind, kind, day, clientId, productId: item.product_id,
      contractId: item.contract_id, description: kind === "prova" ? "Prova" :
        kind === "retirada" ? "Retirada do traje" : "Devolução do traje", source: "locacao" });
  };
  for (const item of data.items) {
    if (terminalStatuses.has(item.status)) continue;
    if (["confirmed", "reserved", "pending"].includes(item.status)) {
      insert(item, "prova", item.try_on_date);
      insert(item, "retirada", item.pickup_date);
    }
    if (["confirmed", "reserved", "pending", "picked_up"].includes(item.status) && !item.actual_return_at) {
      insert(item, "devolucao", item.return_date);
    }
  }
  return rows.sort((a,b) => a.day.localeCompare(b.day));
}
export function operationCounts(rows: OperationRow[], from: string, to: string) {
  return (["prova", "retirada", "devolucao"] as const).map(kind => ({
    kind, count: rows.filter(row => row.kind === kind && row.day >= from && row.day <= to).length,
  }));
}
export function periodResults(data: LiveClosetData, finance: LiveFinanceData, period: Period, today: string) {
  const first = periodStart(today, period);
  const contracts = data.contracts.filter(c => c.status !== "cancelled" && localDay(c.created_at) >= first && localDay(c.created_at) <= today);
  const payments = finance.payments.filter(p => p.status !== "reversed" && localDay(p.recorded_at) >= first && localDay(p.recorded_at) <= today);
  return {
    totalOrders: contracts.reduce((s,c) => s + Number(c.total), 0),
    received: payments.reduce((s,p) => s + Number(p.amount), 0),
    orderCount: contracts.length,
  };
}
export function receivableBalance(data: LiveClosetData, finance: LiveFinanceData) {
  const paid = new Map<string, number>();
  for (const payment of finance.payments) {
    if (payment.status === "reversed") continue;
    paid.set(payment.contract_id, (paid.get(payment.contract_id) ?? 0) + Number(payment.amount));
  }
  const pendingContracts = data.contracts.filter(c => c.status !== "cancelled")
    .reduce((sum,c) => sum + Math.max(0, Number(c.total) - (paid.get(c.id) ?? 0)), 0);
  const manualIncome = finance.transactions.filter(t => t.type === "income" && !t.paid_at)
    .reduce((sum,t) => sum + Number(t.amount), 0);
  return pendingContracts + manualIncome;
}
export const payableBalance = (finance: LiveFinanceData) =>
  finance.transactions.filter(t => t.type === "expense" && !t.paid_at)
    .reduce((sum,t) => sum + Number(t.amount), 0);
