
import React from "react";
import { Clock } from "lucide-react";
import { CalendarEvent } from "./types/calendarTypes";

interface CalendarDayProps {
  day: {
    date: number;
    currentMonth: boolean;
    today?: boolean;
    events: CalendarEvent[];
  };
  index: number;
  currentMonth: number;
  currentYear: number;
  selectedDate: Date | null;
  onDateClick: (day: CalendarDayProps["day"], index: number) => void;
  onEventClick: (event: CalendarEvent, e: React.MouseEvent) => void;
}

const CalendarDay = ({
  day,
  index,
  currentMonth,
  currentYear,
  selectedDate,
  onDateClick,
  onEventClick
}: CalendarDayProps) => {
  return (
    <div 
      key={index}
      onClick={() => onDateClick(day, index)}
      className={`
        min-h-[100px] p-2 border border-neutral-100 transition-all
        ${day.currentMonth ? "bg-white" : "bg-neutral-50 text-neutral-400"}
        ${day.today ? "border-marsala" : ""}
        ${selectedDate && day.currentMonth && day.date === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear() ? "ring-2 ring-marsala ring-opacity-50" : ""}
        ${day.currentMonth ? "hover:bg-neutral-50 cursor-pointer" : ""}
      `}
    >
      <div className="text-sm font-medium mb-1">{day.date}</div>
      
      <div className="space-y-1">
        {day.events.map((event) => (
          <div 
            key={event.id} 
            onClick={(e) => onEventClick(event, e)}
            className={`
              calendar-event p-1 rounded text-xs cursor-pointer transition-colors
              ${event.type === 'rental' ? 'bg-marsala-100 text-marsala-800 hover:bg-marsala-200' : 
               event.type === 'fitting' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : 
               event.type === 'adjustment' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 
               'bg-green-100 text-green-800 hover:bg-green-200'}
            `}
          >
            <div className="flex items-center gap-1 font-medium truncate">
              <Clock size={10} className="shrink-0" />
              <span>{event.time}</span>
              <span className="truncate">{event.title}</span>
            </div>
            <div className="text-[10px] opacity-70 truncate">{event.client}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarDay;
