
import React from "react";
import { ChevronLeft, ChevronRight, Plus, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarViewHeaderProps {
  currentMonth: number;
  currentYear: number;
  goToToday: () => void;
  prevMonth: () => void;
  nextMonth: () => void;
  openSchedule: () => void;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const CalendarViewHeader = ({
  currentMonth,
  currentYear,
  goToToday,
  prevMonth,
  nextMonth,
  openSchedule
}: CalendarViewHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold">
        {MONTHS[currentMonth]} {currentYear}
      </h2>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          onClick={goToToday}
          className="text-sm"
        >
          <CalendarIcon size={16} className="mr-1" />
          Hoje
        </Button>
        <button 
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <button 
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
        <Button 
          className="bg-marsala hover:bg-marsala-700 text-white py-1.5 ml-2"
          onClick={openSchedule}
        >
          <Plus size={16} />
          <span>Novo</span>
        </Button>
      </div>
    </div>
  );
};

export default CalendarViewHeader;
