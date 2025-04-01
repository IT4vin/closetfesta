import React, { useState } from "react";
import { Clock, ShoppingBag, Calendar as CalendarIcon, Plus } from "lucide-react";
import MainLayout from "../components/layout/MainLayout";
import DashboardMetrics from "../components/dashboard/DashboardMetrics";
import LateReturns from "../components/dashboard/LateReturns";
import TodayReturns from "../components/dashboard/TodayReturns";
import Next10DaysReturns from "../components/dashboard/Next10DaysReturns";
import FinancialResults from "../components/dashboard/FinancialResults";
import DailySchedule from "../components/dashboard/DailySchedule";
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
  
  const handleCloseSheet = () => {
    // Force close the sheet and reset any needed state
    setIsSheetOpen(false);
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
          <FinancialResults />
        </section>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid grid-cols-4 w-[600px] max-w-full">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="late">Em Atraso</TabsTrigger>
            <TabsTrigger value="today">Para Hoje</TabsTrigger>
            <TabsTrigger value="upcoming">Próximos Dias</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DailySchedule />
              <RecentActivities />
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold mb-6">Produtos Mais Alugados</h2>
              <TopProducts />
            </div>
          </TabsContent>
          
          <TabsContent value="late">
            <LateReturns />
          </TabsContent>
          
          <TabsContent value="today">
            <TodayReturns />
          </TabsContent>
          
          <TabsContent value="upcoming">
            <Next10DaysReturns />
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
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen} forceMount={false}>
          <SheetContent side="right" className="sm:max-w-[600px] w-[90vw] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-2xl font-semibold">Novo Lançamento</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <NovoLancamentoForm onClose={handleCloseSheet} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </MainLayout>
  );
};

export default Index;
