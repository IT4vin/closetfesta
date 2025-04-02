
import React from "react";
import { Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CalendarHeaderProps {
  onOpenFilter: () => void;
  onOpenSchedule: () => void;
  isFiltering: boolean;
  filterCount: number;
}

const CalendarHeader = ({ 
  onOpenFilter, 
  onOpenSchedule, 
  isFiltering, 
  filterCount 
}: CalendarHeaderProps) => {
  return (
    <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-10">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Agenda</h1>
        <p className="text-neutral-500 text-lg">Gerencie seus agendamentos e eventos</p>
      </div>
      
      <div className="flex gap-4">
        <Button 
          variant="outline"
          className="py-3 px-6 text-base relative"
          onClick={onOpenFilter}
        >
          <Filter size={20} className="mr-2" />
          <span>Filtrar</span>
          {isFiltering && (
            <Badge 
              className="absolute -top-2 -right-2 bg-marsala text-white"
              variant="default"
            >
              {filterCount}
            </Badge>
          )}
        </Button>
        <Button 
          className="bg-marsala hover:bg-marsala-700 text-white py-3 px-6 text-base"
          onClick={onOpenSchedule}
        >
          <Plus size={20} className="mr-2" />
          <span>Novo Evento</span>
        </Button>
      </div>
    </header>
  );
};

export default CalendarHeader;
