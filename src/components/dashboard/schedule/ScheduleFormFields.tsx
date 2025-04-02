
import React, { useState } from "react";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Client, Product, ScheduleFormDataType } from "./useScheduleFormData";

interface ScheduleFormFieldsProps {
  formData: ScheduleFormDataType;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { name: string; value: string }) => void;
  clients: Client[];
  products: Product[];
}

const ScheduleFormFields = ({ 
  formData, 
  date, 
  setDate, 
  handleChange, 
  clients, 
  products 
}: ScheduleFormFieldsProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    setIsCalendarOpen(false);
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <Select 
          value={formData.type}
          onValueChange={(value) => handleChange({ name: "type", value })}
        >
          <SelectTrigger id="type">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prova">Prova</SelectItem>
            <SelectItem value="evento">Evento</SelectItem>
            <SelectItem value="ajuste">Ajuste</SelectItem>
            <SelectItem value="consultoria">Consultoria</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="client">Cliente</Label>
        <Select
          value={formData.client}
          onValueChange={(value) => handleChange({ name: "client", value })}
        >
          <SelectTrigger id="client">
            <SelectValue placeholder="Selecione o cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="product">Produto</Label>
        <Select
          value={formData.product}
          onValueChange={(value) => handleChange({ name: "product", value })}
        >
          <SelectTrigger id="product">
            <SelectValue placeholder="Selecione o produto" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data</Label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Selecione uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Horário</Label>
          <Select
            value={formData.time}
            onValueChange={(value) => handleChange({ name: "time", value })}
          >
            <SelectTrigger id="time">
              <SelectValue placeholder="Hora" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
                <SelectItem key={hour} value={`${hour}:00`}>{`${hour}:00`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duração (horas)</Label>
        <Select
          value={formData.duration}
          onValueChange={(value) => handleChange({ name: "duration", value })}
        >
          <SelectTrigger id="duration">
            <SelectValue placeholder="Duração" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.5">30 minutos</SelectItem>
            <SelectItem value="1">1 hora</SelectItem>
            <SelectItem value="1.5">1 hora e 30 minutos</SelectItem>
            <SelectItem value="2">2 horas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Observações adicionais"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
        />
      </div>
    </div>
  );
};

export default ScheduleFormFields;
