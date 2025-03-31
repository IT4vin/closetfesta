
import React from "react";
import { Calendar, Clock, Check, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScheduleEvent {
  id: string;
  type: "fitting" | "pickup" | "return";
  client: string;
  time: string;
  dressName: string;
  status: "pending" | "confirmed" | "completed";
  clientImageUrl: string;
}

// Dados de exemplo (seriam substituídos por dados reais do backend)
const scheduleData: ScheduleEvent[] = [
  {
    id: "1",
    type: "fitting",
    client: "Amanda Costa",
    time: "09:30",
    dressName: "Vestido Sereia Branco",
    status: "confirmed",
    clientImageUrl: "/placeholder.svg"
  },
  {
    id: "2",
    type: "pickup",
    client: "Fernanda Oliveira",
    time: "11:00",
    dressName: "Vestido Princesa Azul",
    status: "completed",
    clientImageUrl: "/placeholder.svg"
  },
  {
    id: "3",
    type: "return",
    client: "Mariana Silva",
    time: "14:30",
    dressName: "Vestido Longo Verde",
    status: "pending",
    clientImageUrl: "/placeholder.svg"
  },
  {
    id: "4",
    type: "fitting",
    client: "Carolina Santos",
    time: "16:00",
    dressName: "Vestido Curto Vermelho",
    status: "confirmed",
    clientImageUrl: "/placeholder.svg"
  }
];

const DailySchedule = () => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "fitting":
        return <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <Calendar size={16} className="text-purple-600" />
        </div>;
      case "pickup":
        return <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <Calendar size={16} className="text-blue-600" />
        </div>;
      case "return":
        return <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <Calendar size={16} className="text-green-600" />
        </div>;
      default:
        return <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <Calendar size={16} className="text-gray-600" />
        </div>;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "fitting":
        return "Prova";
      case "pickup":
        return "Retirada";
      case "return":
        return "Devolução";
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          Pendente
        </span>;
      case "confirmed":
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Confirmado
        </span>;
      case "completed":
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Concluído
        </span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>;
    }
  };

  return (
    <div className="premium-card overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Clock size={20} className="text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold">Agenda do Dia</h2>
          </div>
          <Button variant="outline" size="sm">Ver agenda completa</Button>
        </div>
      </div>
      
      <div className="divide-y divide-gray-100">
        {scheduleData.map((event) => (
          <div key={event.id} className="p-5 hover:bg-gray-50 transition-colors duration-150">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="text-lg font-semibold">{event.time}</div>
                {getTypeIcon(event.type)}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      {getTypeText(event.type)}
                      <span className="text-gray-400">·</span>
                      {event.dressName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <UserRound size={14} className="text-gray-400" />
                      <span className="text-gray-600 text-sm">{event.client}</span>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(event.status)}
                  </div>
                </div>
                
                {event.status !== "completed" && (
                  <Button variant="outline" size="sm" className="mt-2">
                    <Check size={14} className="mr-2" />
                    Marcar como concluído
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailySchedule;
