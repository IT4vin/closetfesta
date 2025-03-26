
import React, { useState } from "react";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ScheduleFormProps {
  onClose: () => void;
}

const ScheduleForm = ({ onClose }: ScheduleFormProps) => {
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    type: "",
    client: "",
    product: "",
    time: "",
    duration: "1",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { name: string; value: string }) => {
    const { name, value } = 'target' in e ? e.target : e;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", { ...formData, date });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="client">Cliente</Label>
          <Input
            id="client"
            name="client"
            placeholder="Nome ou CPF do cliente"
            value={formData.client}
            onChange={handleChange}
          />
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
              <SelectItem value="vestido-a">Vestido de Festa A</SelectItem>
              <SelectItem value="vestido-b">Vestido de Noiva B</SelectItem>
              <SelectItem value="terno-c">Terno C</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Data</Label>
            <Popover>
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
                  onSelect={setDate}
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

      <div className="flex justify-end gap-4 pt-4">
        <Button variant="outline" type="button" onClick={onClose}>
          Cancelar
        </Button>
        <Button className="bg-marsala hover:bg-marsala-700 text-white" type="submit">
          Salvar
        </Button>
      </div>
    </form>
  );
};

export default ScheduleForm;
