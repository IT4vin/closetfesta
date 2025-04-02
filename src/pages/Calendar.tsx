
import React, { useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import CalendarComponent from "../components/calendar/Calendar";
import { CalendarDays, Filter, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
              <div className="flex items-center gap-3 mb-6">
                <CalendarDays className="text-marsala" size={24} />
                <h2 className="text-xl font-medium">Eventos do Dia</h2>
              </div>
              
              <div className="space-y-5">
                <div className="border-l-4 border-marsala p-4 bg-neutral-50 rounded-r-md">
                  <div className="flex justify-between">
                    <h3 className="font-medium text-lg">Casamento Silva</h3>
                    <span className="text-sm px-3 py-1 rounded-full bg-marsala-100 text-marsala-800">Aluguel</span>
                  </div>
                  <p className="text-base text-neutral-600 mt-2">18:00 - Casa de Festas Elegance</p>
                  <p className="text-base text-neutral-600">Cliente: Ana Silva</p>
                </div>
                
                <div className="border-l-4 border-blue-400 p-4 bg-neutral-50 rounded-r-md">
                  <div className="flex justify-between">
                    <h3 className="font-medium text-lg">Prova de Vestido</h3>
                    <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-700">Prova</span>
                  </div>
                  <p className="text-base text-neutral-600 mt-2">14:30 - Loja Central</p>
                  <p className="text-base text-neutral-600">Cliente: Maria Oliveira</p>
                </div>
                
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
          />
        </SheetContent>
      </Sheet>
    </MainLayout>
  );
};

export default CalendarPage;
