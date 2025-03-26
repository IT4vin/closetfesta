
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
    <div className={`premium-card p-6 card-hover ${isRental ? "border-l-4 border-l-marsala" : "border-l-4 border-l-blue-400"}`}>
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-lg truncate mr-2">{event.title}</h3>
        <span className={`text-sm px-3 py-1 rounded-full whitespace-nowrap ${isRental ? "bg-marsala-100 text-marsala-800" : "bg-blue-100 text-blue-700"}`}>
          {isRental ? "Aluguel" : "Prova"}
        </span>
      </div>
      
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3 text-base text-neutral-600">
          <User size={18} className="flex-shrink-0" />
          <span className="truncate">{event.client}</span>
        </div>
        
        <div className="flex items-center flex-wrap gap-2 text-base text-neutral-600">
          <div className="flex items-center gap-2 mr-3">
            <Calendar size={18} className="flex-shrink-0" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={18} className="flex-shrink-0" />
            <span>{event.time}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-base text-neutral-600">
          <MapPin size={18} className="flex-shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>
      </div>
      
      <div className="mt-5">
        <h4 className="text-sm text-neutral-500 mb-2">Itens:</h4>
        <div className="flex flex-wrap gap-2">
          {event.items.map((item, idx) => (
            <span key={idx} className="text-sm px-3 py-1 bg-neutral-100 rounded-full whitespace-nowrap">
              {item}
            </span>
          ))}
        </div>
      </div>
      
      <div className="mt-5 border-t border-neutral-100 pt-4 flex justify-between items-center">
        <span className="text-sm text-neutral-500">Faltam:</span>
        <span className={`text-base font-medium ${event.daysLeft <= 3 ? "text-red-600" : "text-neutral-700"}`}>
          {event.daysLeft} dias
        </span>
      </div>
    </div>
  );
};

const UpcomingEvents = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold">Próximos Eventos</h2>
        <button className="secondary-button py-2 px-5 text-base">
          Ver todos
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {upcomingEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
};

export default UpcomingEvents;
