
import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  CalendarIcon,
  Clock 
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface EventFilterFormProps {
  onClose: () => void;
  onApplyFilters: (filters: EventFilters) => void;
}

export interface EventFilters {
  eventType: string[];
  client: string;
  product: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  status: string[];
}

const EventFilterForm = ({ onClose, onApplyFilters }: EventFilterFormProps) => {
  const [filters, setFilters] = useState<EventFilters>({
    eventType: [],
    client: "",
    product: "",
    dateFrom: undefined,
    dateTo: undefined,
    status: []
  });

  const eventTypes = [
    { id: "prova", label: "Prova" },
    { id: "evento", label: "Evento" },
    { id: "ajuste", label: "Ajuste" },
    { id: "consultoria", label: "Consultoria" }
  ];

  const statusOptions = [
    { id: "agendado", label: "Agendado" },
    { id: "confirmado", label: "Confirmado" },
    { id: "cancelado", label: "Cancelado" },
    { id: "concluido", label: "Concluído" }
  ];

  const handleEventTypeChange = (type: string) => {
    setFilters(prev => {
      const types = prev.eventType.includes(type) 
        ? prev.eventType.filter(t => t !== type)
        : [...prev.eventType, type];
      
      return { ...prev, eventType: types };
    });
  };

  const handleStatusChange = (status: string) => {
    setFilters(prev => {
      const statuses = prev.status.includes(status) 
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status];
      
      return { ...prev, status: statuses };
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFilters({
      eventType: [],
      client: "",
      product: "",
      dateFrom: undefined,
      dateTo: undefined,
      status: []
    });
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  return (
    <div className="py-4 space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">Filtrar Eventos</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="text-neutral-500"
        >
          <X size={18} />
        </Button>
      </div>

      <div className="space-y-5">
        {/* Event Types */}
        <div className="space-y-2">
          <Label className="text-base font-medium">Tipo de Evento</Label>
          <div className="flex flex-wrap gap-2">
            {eventTypes.map(type => (
              <div 
                key={type.id}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-colors",
                  filters.eventType.includes(type.id)
                    ? "bg-marsala text-white border-marsala"
                    : "bg-white text-neutral-700 border-neutral-300 hover:border-marsala"
                )}
                onClick={() => handleEventTypeChange(type.id)}
              >
                {type.label}
              </div>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Data Inicial</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateFrom ? format(filters.dateFrom, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom}
                  onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Data Final</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateTo ? format(filters.dateTo, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateTo}
                  onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Client and Product */}
        <div className="space-y-2">
          <Label htmlFor="client">Cliente</Label>
          <Input 
            id="client"
            name="client"
            value={filters.client}
            onChange={handleInputChange}
            placeholder="Nome do cliente"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product">Produto</Label>
          <Input 
            id="product"
            name="product"
            value={filters.product}
            onChange={handleInputChange}
            placeholder="Nome do produto"
          />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label className="text-base font-medium">Status</Label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(status => (
              <div 
                key={status.id}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-colors",
                  filters.status.includes(status.id)
                    ? "bg-marsala text-white border-marsala"
                    : "bg-white text-neutral-700 border-neutral-300 hover:border-marsala"
                )}
                onClick={() => handleStatusChange(status.id)}
              >
                {status.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-4 pt-4 border-t border-neutral-200">
        <Button 
          variant="outline" 
          onClick={handleReset}
        >
          Limpar Filtros
        </Button>
        <Button 
          className="bg-marsala hover:bg-marsala-700 text-white" 
          onClick={handleApply}
        >
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
};

export default EventFilterForm;
