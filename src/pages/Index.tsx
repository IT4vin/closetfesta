
import React, { useState } from "react";
import { Clock, ShoppingBag, Calendar as CalendarIcon, Plus, DollarSign } from "lucide-react";
import MainLayout from "../components/layout/MainLayout";
import DashboardStats from "../components/dashboard/DashboardStats";
import UpcomingEvents from "../components/dashboard/UpcomingEvents";
import ScheduleForm from "../components/dashboard/ScheduleForm";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

const Index = () => {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  
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
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Dashboard</h1>
            <p className="text-neutral-500 flex items-center text-lg">
              <Clock size={20} className="mr-2" />
              <span>{capitalizedDate}</span>
            </p>
          </div>
          
          <div className="flex gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-marsala text-marsala hover:bg-marsala/10 py-3 px-6 text-base">
                  <Plus size={20} className="mr-2" />
                  <span>Novo Lançamento</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => console.log("Nova Venda")}>
                  <ShoppingBag size={16} className="mr-2" />
                  <span>Nova Venda</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log("Novo Aluguel")}>
                  <CalendarIcon size={16} className="mr-2" />
                  <span>Novo Aluguel</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              className="bg-marsala hover:bg-marsala-700 text-white py-3 px-6 text-base"
              onClick={() => setScheduleOpen(true)}
            >
              <CalendarIcon size={20} className="mr-2" />
              <span>Agendar</span>
            </Button>
          </div>
        </header>
        
        <section className="mb-8">
          <DashboardStats />
        </section>
        
        <section>
          <UpcomingEvents />
        </section>

        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold">Agendar</DialogTitle>
            </DialogHeader>
            <ScheduleForm onClose={() => setScheduleOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Index;
