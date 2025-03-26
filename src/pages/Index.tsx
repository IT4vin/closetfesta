
import React from "react";
import { Clock, ShoppingBag, Calendar as CalendarIcon, Plus } from "lucide-react";
import MainLayout from "../components/layout/MainLayout";
import DashboardStats from "../components/dashboard/DashboardStats";
import UpcomingEvents from "../components/dashboard/UpcomingEvents";

const Index = () => {
  const currentDate = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const formattedDate = currentDate.toLocaleDateString('pt-BR', options);
  
  // Capitalize first letter
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  
  return (
    <MainLayout>
      <div className="page-transition space-y-10">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Dashboard</h1>
            <p className="text-neutral-500 flex items-center text-lg">
              <Clock size={20} className="mr-2" />
              <span>{capitalizedDate}</span>
            </p>
          </div>
          
          <div className="flex gap-4">
            <button className="secondary-button py-3 px-6 text-base">
              <ShoppingBag size={20} className="mr-2" />
              <span>Nova Venda</span>
            </button>
            <button className="primary-button py-3 px-6 text-base">
              <CalendarIcon size={20} className="mr-2" />
              <span>Agendar</span>
            </button>
          </div>
        </header>
        
        <section className="mb-12">
          <DashboardStats />
        </section>
        
        <section>
          <UpcomingEvents />
        </section>
      </div>
    </MainLayout>
  );
};

export default Index;
