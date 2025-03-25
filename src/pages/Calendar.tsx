
import React from "react";
import MainLayout from "../components/layout/MainLayout";
import CalendarComponent from "../components/calendar/Calendar";
import { CalendarDays, Filter, Plus } from "lucide-react";

const CalendarPage = () => {
  return (
    <MainLayout>
      <div className="page-transition">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Agenda</h1>
            <p className="text-neutral-500">Gerencie seus agendamentos e eventos</p>
          </div>
          
          <div className="flex gap-3">
            <button className="secondary-button">
              <Filter size={18} />
              <span>Filtrar</span>
            </button>
            <button className="primary-button">
              <Plus size={18} />
              <span>Novo Evento</span>
            </button>
          </div>
        </header>
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3">
            <CalendarComponent />
          </div>
          
          <div className="w-full lg:w-1/3">
            <div className="premium-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="text-marsala" size={20} />
                <h2 className="text-lg font-medium">Eventos do Dia</h2>
              </div>
              
              <div className="space-y-4">
                <div className="border-l-4 border-marsala p-3 bg-neutral-50 rounded-r-md">
                  <div className="flex justify-between">
                    <h3 className="font-medium">Casamento Silva</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-marsala-100 text-marsala-800">Aluguel</span>
                  </div>
                  <p className="text-sm text-neutral-600 mt-1">18:00 - Casa de Festas Elegance</p>
                  <p className="text-sm text-neutral-600">Cliente: Ana Silva</p>
                </div>
                
                <div className="border-l-4 border-blue-400 p-3 bg-neutral-50 rounded-r-md">
                  <div className="flex justify-between">
                    <h3 className="font-medium">Prova de Vestido</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Prova</span>
                  </div>
                  <p className="text-sm text-neutral-600 mt-1">14:30 - Loja Central</p>
                  <p className="text-sm text-neutral-600">Cliente: Maria Oliveira</p>
                </div>
                
                <div className="mt-4">
                  <button className="w-full text-center py-2 text-sm text-marsala hover:text-marsala-700 border border-dashed border-neutral-300 rounded-md hover:border-marsala transition-colors">
                    + Adicionar Evento
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CalendarPage;
