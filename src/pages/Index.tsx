import React, { useState } from "react";
import { Clock, ShoppingBag, Calendar as CalendarIcon, Plus } from "lucide-react";
import ProfessionalDashboard from "../components/dashboard/ProfessionalDashboard";
import LateReturns from "../components/dashboard/LateReturns";
import TodayReturns from "../components/dashboard/TodayReturns";
import Next10DaysReturns from "../components/dashboard/Next10DaysReturns";
import DailySchedule from "../components/dashboard/DailySchedule";
import UpcomingEvents from "../components/dashboard/UpcomingEvents";
import RecentActivities from "../components/dashboard/RecentActivities";
import TopProducts from "../components/dashboard/TopProducts";
import NovoLancamentoForm from "../components/forms/NovoLancamentoForm";
import AgendarForm from "../components/forms/AgendarForm";
import { useAuth } from "@/stores/authStore";
import PermissionManager from "@/lib/permissions";
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
  const { user } = useAuth();
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

  // Verificar permissões para exibir ações
  const canCreateSales = PermissionManager.hasPermission('sales', 'create');
  const canCreateRentals = PermissionManager.hasPermission('rentals', 'create');
  const canSchedule = PermissionManager.hasPermission('schedule', 'create');
  
  return (
    <div className="page-transition space-y-8">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-marsala-600 to-marsala-800 bg-clip-text text-transparent">
            Bem-vindo, {user?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-neutral-600 flex items-center text-lg">
            <Clock size={20} className="mr-2 text-marsala-500" />
            <span>{capitalizedDate}</span>
          </p>
        </div>
        
        <div className="flex gap-3">
          {(canCreateSales || canCreateRentals) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-marsala-300 text-marsala-700 hover:bg-marsala-50 py-3 px-6 text-base shadow-sm">
                  <Plus size={20} className="mr-2" />
                  <span>Novo Lançamento</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {canCreateSales && (
                  <DropdownMenuItem onClick={handleNewSale}>
                    <ShoppingBag size={16} className="mr-2" />
                    <span>Nova Venda</span>
                  </DropdownMenuItem>
                )}
                {canCreateRentals && (
                  <DropdownMenuItem onClick={handleNewRental}>
                    <CalendarIcon size={16} className="mr-2" />
                    <span>Novo Aluguel</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {canSchedule && (
            <Button 
              className="bg-gradient-to-r from-marsala-600 to-marsala-700 hover:from-marsala-700 hover:to-marsala-800 text-white py-3 px-6 text-base shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => setScheduleOpen(true)}
            >
              <CalendarIcon size={20} className="mr-2" />
              <span>Agendar</span>
            </Button>
          )}
        </div>
      </header>
      
      {/* Dashboard Profissional Principal */}
      <section className="mb-8">
        <ProfessionalDashboard />
      </section>

      {/* Seções Detalhadas */}
      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="grid grid-cols-4 w-[600px] max-w-full bg-marsala-50 border border-marsala-200">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-marsala-600 data-[state=active]:text-white"
          >
            Visão Geral
          </TabsTrigger>
          <TabsTrigger 
            value="late"
            className="data-[state=active]:bg-marsala-600 data-[state=active]:text-white"
          >
            Em Atraso
          </TabsTrigger>
          <TabsTrigger 
            value="today"
            className="data-[state=active]:bg-marsala-600 data-[state=active]:text-white"
          >
            Para Hoje
          </TabsTrigger>
          <TabsTrigger 
            value="upcoming"
            className="data-[state=active]:bg-marsala-600 data-[state=active]:text-white"
          >
            Próximos Dias
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {PermissionManager.hasPermission('schedule', 'read') && <DailySchedule />}
            {PermissionManager.hasPermission('dashboard', 'read') && <RecentActivities />}
          </div>
          
          {PermissionManager.hasPermission('products', 'read') && (
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">Produtos Mais Alugados</h2>
              <TopProducts />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="late">
          {PermissionManager.hasPermission('rentals', 'read') ? (
            <LateReturns />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Sem permissão para visualizar aluguéis em atraso</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="today">
          {PermissionManager.hasPermission('rentals', 'read') ? (
            <TodayReturns />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Sem permissão para visualizar devoluções de hoje</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="upcoming">
          {PermissionManager.hasPermission('rentals', 'read') ? (
            <Next10DaysReturns />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Sem permissão para visualizar próximas devoluções</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Schedule Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-marsala-600" />
              Agendar Evento
            </DialogTitle>
          </DialogHeader>
          <AgendarForm onClose={() => setScheduleOpen(false)} />
        </DialogContent>
      </Dialog>
      
      {/* New Sale/Rental Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="sm:max-w-[600px] w-[90vw] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl font-semibold flex items-center gap-2">
              <Plus className="h-6 w-6 text-marsala-600" />
              Novo Lançamento
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <NovoLancamentoForm onClose={handleCloseSheet} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Index;
