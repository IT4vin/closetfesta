
import React, { useState, useEffect } from "react";
import MainLayout from "../components/layout/MainLayout";
import CalendarComponent from "../components/calendar/Calendar";
import { CalendarDays, Filter, Plus, X, ChevronRight, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import ScheduleForm from "@/components/dashboard/ScheduleForm";
import EventFilterForm, { EventFilters } from "@/components/calendar/EventFilterForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CalendarPage = () => {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<EventFilters>({
    eventType: [],
    client: "",
    product: "",
    dateFrom: undefined,
    dateTo: undefined,
    status: []
  });
  const [isFiltering, setIsFiltering] = useState(false);
  const [todayEvents, setTodayEvents] = useState<any[]>([
    {
      id: "event-1",
      title: "Casamento Silva",
      type: "Aluguel",
      typeColor: "marsala",
      time: "18:00",
      location: "Casa de Festas Elegance",
      client: "Ana Silva"
    },
    {
      id: "event-2",
      title: "Prova de Vestido",
      type: "Prova",
      typeColor: "blue",
      time: "14:30",
      location: "Loja Central",
      client: "Maria Oliveira"
    },
    {
      id: "event-3",
      title: "Ajuste Final",
      type: "Ajuste",
      typeColor: "amber",
      time: "10:00",
      location: "Atelier",
      client: "Carla Mendes"
    }
  ]);
  
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);

  useEffect(() => {
    // In a real app, this would fetch today's events from an API
    console.log("Fetching today's events with filters:", activeFilters);
  }, [activeFilters]);

  const handleApplyFilters = (filters: EventFilters) => {
    console.log("Applied filters:", filters);
    setActiveFilters(filters);
    setIsFiltering(
      filters.eventType.length > 0 || 
      !!filters.client || 
      !!filters.product || 
      !!filters.dateFrom || 
      !!filters.dateTo || 
      filters.status.length > 0
    );
  };

  const handleClearFilters = () => {
    setActiveFilters({
      eventType: [],
      client: "",
      product: "",
      dateFrom: undefined,
      dateTo: undefined,
      status: []
    });
    setIsFiltering(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (activeFilters.eventType.length > 0) count++;
    if (activeFilters.client) count++;
    if (activeFilters.product) count++;
    if (activeFilters.dateFrom || activeFilters.dateTo) count++;
    if (activeFilters.status.length > 0) count++;
    return count;
  };
  
  const handleEventHover = (index: number) => {
    setSelectedEvent(index);
  };
  
  const handleEventLeave = () => {
    setSelectedEvent(null);
  };

  return (
    <MainLayout>
      <div className="page-transition">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Agenda</h1>
            <p className="text-neutral-500 text-lg">Gerencie seus agendamentos e eventos</p>
          </div>
          
          <div className="flex gap-4">
            <Button 
              variant="outline"
              className="py-3 px-6 text-base relative"
              onClick={() => setIsFilterOpen(true)}
            >
              <Filter size={20} className="mr-2" />
              <span>Filtrar</span>
              {isFiltering && (
                <Badge 
                  className="absolute -top-2 -right-2 bg-marsala text-white"
                  variant="default"
                >
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
            <Button 
              className="bg-marsala hover:bg-marsala-700 text-white py-3 px-6 text-base"
              onClick={() => setIsScheduleOpen(true)}
            >
              <Plus size={20} className="mr-2" />
              <span>Novo Evento</span>
            </Button>
          </div>
        </header>
        
        {isFiltering && (
          <div className="mb-6 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Filtros aplicados:</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-neutral-500 hover:text-neutral-700"
                onClick={handleClearFilters}
              >
                <X size={16} className="mr-1" />
                Limpar todos
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {activeFilters.eventType.map(type => (
                <Badge key={type} variant="outline" className="bg-white">
                  Tipo: {type === 'prova' ? 'Prova' : 
                         type === 'evento' ? 'Evento' : 
                         type === 'ajuste' ? 'Ajuste' : 'Consultoria'}
                </Badge>
              ))}
              {activeFilters.client && (
                <Badge variant="outline" className="bg-white">
                  Cliente: {activeFilters.client}
                </Badge>
              )}
              {activeFilters.product && (
                <Badge variant="outline" className="bg-white">
                  Produto: {activeFilters.product}
                </Badge>
              )}
              {activeFilters.dateFrom && (
                <Badge variant="outline" className="bg-white">
                  De: {activeFilters.dateFrom.toLocaleDateString()}
                </Badge>
              )}
              {activeFilters.dateTo && (
                <Badge variant="outline" className="bg-white">
                  Até: {activeFilters.dateTo.toLocaleDateString()}
                </Badge>
              )}
              {activeFilters.status.map(status => (
                <Badge key={status} variant="outline" className="bg-white">
                  Status: {status === 'agendado' ? 'Agendado' : 
                          status === 'confirmado' ? 'Confirmado' : 
                          status === 'cancelado' ? 'Cancelado' : 'Concluído'}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-2/3">
            <CalendarComponent />
          </div>
          
          <div className="w-full lg:w-1/3">
            <div className="premium-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <CalendarDays className="text-marsala" size={24} />
                  <h2 className="text-xl font-medium">Eventos do Dia</h2>
                </div>
                <span className="text-sm text-neutral-500">{new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              </div>
              
              <div className="space-y-4">
                {todayEvents.length > 0 ? (
                  todayEvents.map((event, index) => (
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
                    onClick={() => setIsScheduleOpen(true)}
                  >
                    + Adicionar Evento
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Agendar</DialogTitle>
          </DialogHeader>
          <ScheduleForm onClose={() => setIsScheduleOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Filter Sheet */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent side="right" className="sm:max-w-[500px] w-[90vw] overflow-y-auto">
          <EventFilterForm 
            onClose={() => setIsFilterOpen(false)} 
            onApplyFilters={handleApplyFilters}
            initialFilters={activeFilters}
          />
        </SheetContent>
      </Sheet>
    </MainLayout>
  );
};

export default CalendarPage;
