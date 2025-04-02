
import React, { useState } from "react";
import { CalendarDays, ChevronRight, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TodayEvent {
  id: string;
  title: string;
  type: string;
  typeColor: string;
  time: string;
  location: string;
  client: string;
}

interface TodayEventsProps {
  events: TodayEvent[];
  onAddEvent: () => void;
}

const TodayEvents = ({ events, onAddEvent }: TodayEventsProps) => {
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);

  const handleEventHover = (index: number) => {
    setSelectedEvent(index);
  };
  
  const handleEventLeave = () => {
    setSelectedEvent(null);
  };

  return (
    <div className="premium-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="text-marsala" size={24} />
          <h2 className="text-xl font-medium">Eventos do Dia</h2>
        </div>
        <span className="text-sm text-neutral-500">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </div>
      
      <div className="space-y-4">
        {events.length > 0 ? (
          events.map((event, index) => (
            <div 
              key={event.id}
              className={`border-l-4 ${
                event.typeColor === 'marsala' ? 'border-marsala' : 
                event.typeColor === 'blue' ? 'border-blue-400' :
                event.typeColor === 'amber' ? 'border-amber-400' :
                'border-green-400'
              } p-4 bg-neutral-50 rounded-r-md transition-all duration-200 ${
                selectedEvent === index ? 'bg-neutral-100' : ''
              }`}
              onMouseEnter={() => handleEventHover(index)}
              onMouseLeave={handleEventLeave}
            >
              <div className="flex justify-between">
                <h3 className="font-medium text-lg">{event.title}</h3>
                <span className={`text-sm px-3 py-1 rounded-full ${
                  event.typeColor === 'marsala' ? 'bg-marsala-100 text-marsala-800' : 
                  event.typeColor === 'blue' ? 'bg-blue-100 text-blue-700' :
                  event.typeColor === 'amber' ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>{event.type}</span>
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-base text-neutral-600 flex items-center">
                  <Clock size={14} className="mr-1 text-neutral-400" />
                  {event.time} - {event.location}
                </p>
                <p className="text-base text-neutral-600">Cliente: {event.client}</p>
              </div>
              {selectedEvent === index && (
                <div className="mt-3 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-marsala hover:text-marsala-700 flex items-center"
                  >
                    Ver detalhes
                    <ChevronRight size={16} />
                  </Button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-neutral-500">
            <p>Não há eventos para hoje</p>
          </div>
        )}
        
        <div className="mt-5">
          <button 
            className="w-full text-center py-3 text-base text-marsala hover:text-marsala-700 border border-dashed border-neutral-300 rounded-md hover:border-marsala transition-colors"
            onClick={onAddEvent}
          >
            + Adicionar Evento
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodayEvents;
