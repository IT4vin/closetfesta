
export interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  time: string;
  client: string;
  status: string;
  notes?: string;
}

export interface CalendarDay {
  date: number;
  currentMonth: boolean;
  today?: boolean;
  events: CalendarEvent[];
}
