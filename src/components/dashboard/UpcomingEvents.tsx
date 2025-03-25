
import React from "react";
import { Calendar, Clock, User, MapPin } from "lucide-react";

// This would come from an API in a real app
const upcomingEvents = [
  {
    id: 1,
    title: "Casamento Ana e Pedro",
    client: "Ana Silva",
    date: "12 Jun, 2023",
    time: "18:00",
    location: "Casa de Festas Elegance",
    type: "rental", // rental or fitting
    items: ["Vestido de noiva", "Véu"],
    daysLeft: 3,
  },
  {
    id: 2,
    title: "Prova de Vestido",
    client: "Maria Oliveira",
    date: "14 Jun, 2023",
    time: "14:30",
    location: "Loja Central",
    type: "fitting",
    items: ["Vestido de madrinha"],
    daysLeft: 5,
  },
  {
    id: 3,
    title: "Formatura João",
    client: "João Santos",
    date: "16 Jun, 2023",
    time: "19:00",
    location: "Universidade Federal",
    type: "rental",
    items: ["Terno preto", "Gravata"],
    daysLeft: 7,
  },
];

const EventCard = ({ event }: { event: typeof upcomingEvents[0] }) => {
  const isRental = event.type === "rental";
  
  return (
    <div className={`premium-card p-5 card-hover ${isRental ? "border-l-4 border-l-marsala" : "border-l-4 border-l-blue-400"}`}>
      <div className="flex justify-between">
        <h3 className="font-medium text-base">{event.title}</h3>
        <span className={`text-sm px-2 py-0.5 rounded-full ${isRental ? "bg-marsala-100 text-marsala-800" : "bg-blue-100 text-blue-700"}`}>
          {isRental ? "Aluguel" : "Prova"}
        </span>
      </div>
      
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <User size={14} />
          <span>{event.client}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <Calendar size={14} />
          <span>{event.date}</span>
          <Clock size={14} className="ml-2" />
          <span>{event.time}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <MapPin size={14} />
          <span>{event.location}</span>
        </div>
      </div>
      
      <div className="mt-4">
        <h4 className="text-xs text-neutral-500 mb-1">Itens:</h4>
        <div className="flex flex-wrap gap-1">
          {event.items.map((item, idx) => (
            <span key={idx} className="text-xs px-2 py-0.5 bg-neutral-100 rounded-full">
              {item}
            </span>
          ))}
        </div>
      </div>
      
      <div className="mt-4 border-t border-neutral-100 pt-3 flex justify-between items-center">
        <span className="text-xs text-neutral-500">Faltam:</span>
        <span className={`text-sm font-medium ${event.daysLeft <= 3 ? "text-red-600" : "text-neutral-700"}`}>
          {event.daysLeft} dias
        </span>
      </div>
    </div>
  );
};

const UpcomingEvents = () => {
  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Próximos Eventos</h2>
        <button className="secondary-button py-1.5">
          Ver todos
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {upcomingEvents.map((event, index) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
};

export default UpcomingEvents;
