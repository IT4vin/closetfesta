
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
      <div className="page-transition space-y-8">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
            <p className="text-neutral-500 flex items-center">
              <Clock size={16} className="mr-1" />
              <span>{capitalizedDate}</span>
            </p>
          </div>
          
          <div className="flex gap-3">
            <button className="secondary-button">
              <ShoppingBag size={18} />
              <span>Nova Venda</span>
            </button>
            <button className="primary-button">
              <CalendarIcon size={18} />
              <span>Agendar</span>
            </button>
          </div>
        </header>
        
        <section className="mb-8">
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
