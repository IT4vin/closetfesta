
export interface EventFilters {
  eventType: string[];
  client: string;
  product: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  status: string[];
}

export interface FilterOption {
  id: string;
  label: string;
}

export const EVENT_TYPES: FilterOption[] = [
  { id: "prova", label: "Prova" },
  { id: "evento", label: "Evento" },
  { id: "ajuste", label: "Ajuste" },
  { id: "consultoria", label: "Consultoria" }
];

export const STATUS_OPTIONS: FilterOption[] = [
  { id: "agendado", label: "Agendado" },
  { id: "confirmado", label: "Confirmado" },
  { id: "cancelado", label: "Cancelado" },
  { id: "concluido", label: "Concluído" }
];
