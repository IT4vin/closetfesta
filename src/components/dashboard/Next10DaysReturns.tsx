
import React, { useState } from "react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ReturnItem {
  id: string;
  date: Date;
  dressName: string;
  client: string;
  preparationStatus: "not-started" | "in-progress" | "ready";
  imageUrl: string;
}

// Gerar dados dos próximos 10 dias
const generateNext10DaysData = (): ReturnItem[] => {
  const statuses: ("not-started" | "in-progress" | "ready")[] = [
    "not-started",
    "in-progress",
    "ready",
  ];
  const result: ReturnItem[] = [];

  // Gerar alguns itens para cada dia nos próximos 10 dias
  for (let i = 1; i <= 10; i++) {
    const itemsPerDay = Math.floor(Math.random() * 3) + 1; // 1 a 3 itens por dia
    for (let j = 0; j < itemsPerDay; j++) {
      result.push({
        id: `${i}-${j}`,
        date: addDays(new Date(), i),
        dressName: `Vestido ${j + 1} do Dia ${i}`,
        client: `Cliente ${j + 1} do Dia ${i}`,
        preparationStatus:
          statuses[Math.floor(Math.random() * statuses.length)],
        imageUrl: "/placeholder.svg",
      });
    }
  }

  return result;
};

const next10DaysData = generateNext10DaysData();

const Next10DaysReturns = () => {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredItems = next10DaysData.filter((item) => {
    // Filtrar por data, se selecionada
    if (date && format(item.date, "yyyy-MM-dd") !== format(date, "yyyy-MM-dd")) {
      return false;
    }
    
    // Filtrar por status, se não for "all"
    if (statusFilter !== "all" && item.preparationStatus !== statusFilter) {
      return false;
    }
    
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not-started":
        return "bg-red-100 text-red-800";
      case "in-progress":
        return "bg-amber-100 text-amber-800";
      case "ready":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "not-started":
        return "Não iniciado";
      case "in-progress":
        return "Em preparação";
      case "ready":
        return "Pronto";
      default:
        return status;
    }
  };

  return (
    <div className="premium-card overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <CalendarIcon size={20} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold">Próximos 10 Dias</h2>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex">
              <Button
                variant={view === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("list")}
                className="rounded-r-none"
              >
                Lista
              </Button>
              <Button
                variant={view === "calendar" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("calendar")}
                className="rounded-l-none"
              >
                Calendário
              </Button>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon size={16} />
                  {date ? format(date, "dd/MM/yyyy") : "Selecionar Data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <div className="flex items-center gap-2">
              <ListFilter size={16} />
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="not-started">Não iniciado</SelectItem>
                  <SelectItem value="in-progress">Em preparação</SelectItem>
                  <SelectItem value="ready">Pronto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {date && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDate(undefined)}
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {view === "list" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Vestido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status do Preparo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell>
                      {format(item.date, "dd 'de' MMMM, yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-gray-100 overflow-hidden">
                          <img
                            src={item.imageUrl}
                            alt={item.dressName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span>{item.dressName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.client}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          item.preparationStatus
                        )}`}
                      >
                        {getStatusText(item.preparationStatus)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Nenhum item encontrado para os filtros selecionados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => {
                const currentDate = addDays(new Date(), i + 1);
                const itemsForDate = filteredItems.filter(
                  (item) =>
                    format(item.date, "yyyy-MM-dd") ===
                    format(currentDate, "yyyy-MM-dd")
                );
                
                return (
                  <div
                    key={i}
                    className="premium-card p-4 h-full"
                  >
                    <div className="font-semibold mb-2 text-center">
                      {format(currentDate, "EEEE, dd/MM", { locale: ptBR })}
                    </div>
                    
                    {itemsForDate.length > 0 ? (
                      <div className="space-y-3">
                        {itemsForDate.map((item) => (
                          <div
                            key={item.id}
                            className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-8 h-8 rounded-md bg-gray-100 overflow-hidden">
                                <img
                                  src={item.imageUrl}
                                  alt={item.dressName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="text-sm font-medium truncate">
                                {item.dressName}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {item.client}
                            </div>
                            <div className="mt-1">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  item.preparationStatus
                                )}`}
                              >
                                {getStatusText(item.preparationStatus)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-24 flex items-center justify-center text-sm text-gray-500">
                        Sem devoluções
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Next10DaysReturns;
