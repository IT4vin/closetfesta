
import React from "react";
import MainLayout from "../components/layout/MainLayout";
import CalendarComponent from "../components/calendar/Calendar";
import { CalendarDays, Filter, Plus } from "lucide-react";

const CalendarPage = () => {
  return (
    <MainLayout>
      <div className="page-transition">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Agenda</h1>
            <p className="text-neutral-500 text-lg">Gerencie seus agendamentos e eventos</p>
          </div>
          
          <div className="flex gap-4">
            <button className="secondary-button py-3 px-6 text-base">
              <Filter size={20} className="mr-2" />
              <span>Filtrar</span>
            </button>
            <button className="primary-button py-3 px-6 text-base">
              <Plus size={20} className="mr-2" />
              <span>Novo Evento</span>
            </button>
          </div>
        </header>
        
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
                  <button className="w-full text-center py-3 text-base text-marsala hover:text-marsala-700 border border-dashed border-neutral-300 rounded-md hover:border-marsala transition-colors">
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
