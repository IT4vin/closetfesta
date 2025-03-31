
import React, { useState } from "react";
import { Clock, ShoppingBag, Calendar as CalendarIcon, Plus, DollarSign, ChevronDown } from "lucide-react";
import MainLayout from "../components/layout/MainLayout";
import DashboardMetrics from "../components/dashboard/DashboardMetrics";
import UpcomingEvents from "../components/dashboard/UpcomingEvents";
import RecentActivities from "../components/dashboard/RecentActivities";
import TopProducts from "../components/dashboard/TopProducts";
import NovoLancamentoForm from "../components/forms/NovoLancamentoForm";
import AgendarForm from "../components/forms/AgendarForm";
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
import {
  Sheet,
  SheetContent, 
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";

const Index = () => {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [newSaleOpen, setNewSaleOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
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
  
  const handleNewSale = () => {
    setIsSheetOpen(true);
  };
  
  const handleNewRental = () => {
    setIsSheetOpen(true);
  };
  
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
                <DropdownMenuItem onClick={handleNewSale}>
                  <ShoppingBag size={16} className="mr-2" />
                  <span>Nova Venda</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleNewRental}>
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
          <DashboardMetrics />
        </section>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid grid-cols-3 w-[400px]">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivities />
              <UpcomingEvents />
            </div>
          </TabsContent>
          
          <TabsContent value="events">
            <div className="premium-card">
              <UpcomingEvents />
            </div>
          </TabsContent>
          
          <TabsContent value="products">
            <TopProducts />
          </TabsContent>
        </Tabs>

        {/* Schedule Dialog */}
        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold">Agendar</DialogTitle>
            </DialogHeader>
            <AgendarForm onClose={() => setScheduleOpen(false)} />
          </DialogContent>
        </Dialog>
        
        {/* New Sale/Rental Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent side="right" className="sm:max-w-[600px] w-[90vw] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-2xl font-semibold">Novo Lançamento</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <NovoLancamentoForm onClose={() => setIsSheetOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </MainLayout>
  );
};

export default Index;
