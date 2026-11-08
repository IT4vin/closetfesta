import { supabase } from "@/integrations/supabase/client";

export type DashboardVisitKind = "prova" | "retirada" | "devolucao";
export type DashboardVisitPeriod = "overdue" | "today" | "next10";
export type DashboardVisitCount = { total: number; confirmed: number; pending: number };
export type DashboardVisitRow = {
  contract_id: string;
  contract_number: number;
  client_name: string;
  kind: DashboardVisitKind;
  day: string;
  time: string | null;
  items_total: number;
  confirmed: boolean;
  confirmed_at: string | null;
  confirmed_by: string | null;
  physical_complete: boolean;
};
export type DashboardVisitResult = {
  period: DashboardVisitPeriod;
  kind: DashboardVisitKind | null;
  today: string;
  counts: Partial<Record<DashboardVisitKind, DashboardVisitCount>>;
  rows: DashboardVisitRow[];
  total: number;
  offset: number;
  limit: number;
};

const db = supabase as any;
const kinds = ["prova","retirada","devolucao"] as const;
const periods = ["overdue","today","next10"] as const;
const isKind = (kind:string):kind is DashboardVisitKind => kinds.some(k=>k===kind);
const isPeriod = (period:string):period is DashboardVisitPeriod => periods.some(k=>k===period);
export const visitLabel: Record<DashboardVisitKind,string> = {
  prova:"Provas",retirada:"Retiradas",devolucao:"Devoluções",
};
export const visitPeriodLabel: Record<DashboardVisitPeriod,string> = {
  overdue:"Em atraso",today:"Hoje",next10:"Próximos 10 dias",
};
export const visitDateBR = (date:string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "—";
  return date.split("-").reverse().join("/");
};
export function visitCount(result:DashboardVisitResult|undefined,kind:DashboardVisitKind):DashboardVisitCount {
  return result?.counts?.[kind]??{total:0,confirmed:0,pending:0};
}

export async function fetchDashboardVisitList(
  period:DashboardVisitPeriod,
  kind:DashboardVisitKind|null=null,
  offset=0,
  limit=30,
):Promise<DashboardVisitResult> {
  if (!isPeriod(period)||(kind!==null&&!isKind(kind))||
    !Number.isInteger(offset)||offset<0||
    !Number.isInteger(limit)||limit<1||limit>100) {
    throw new Error("Parâmetros inválidos para a lista de confirmações.");
  }
  const {data,error}=await db.rpc("closet_dashboard_visits",{
    p_period:period,p_kind:kind,p_offset:offset,p_limit:limit,
  });
  if(error)throw new Error(error.message);
  if(!data||!Array.isArray(data.rows)||!data.counts||
    !Number.isFinite(Number(data.total))||data.period!==period){
    throw new Error("O Supabase não confirmou a lista de compromissos.");
  }
  return data as DashboardVisitResult;
}

export async function confirmDashboardVisits(
  contractIds:string[],kind:DashboardVisitKind,day:string
):Promise<{confirmed:number;new_confirmations:number}> {
  if(!isKind(kind)||!/^\d{4}-\d{2}-\d{2}$/.test(day)||
    !contractIds.length||contractIds.length>100||new Set(contractIds).size!==contractIds.length){
    throw new Error("Selecione contratos válidos do mesmo tipo e dia.");
  }
  const {data,error}=await db.rpc("closet_confirm_visit_attendance",{
    p_contract_ids:contractIds,p_kind:kind,p_day:day,
  });
  if(error)throw new Error(error.message);
  if(!data||Number(data.confirmed)!==contractIds.length){
    throw new Error("O Supabase não confirmou todas as presenças selecionadas.");
  }
  return data;
}
