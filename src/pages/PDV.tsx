import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wand2, User, LogOut } from "lucide-react";
import PDVSale from "@/components/pdv/PDVSale";
import PDVCashier from "@/components/pdv/PDVCashier";
import PDVReports from "@/components/pdv/PDVReports";
import PDVOrders from "@/components/pdv/PDVOrders";
import SystemManagement from "@/components/pdv/SystemManagement";
import SyncStatusIndicator from "@/components/pdv/SyncStatusIndicator";
import RealTimeDashboard from "@/components/dashboard/RealTimeDashboard";
import EventCalendar from "@/components/calendar/EventCalendar";
import TestOrderWizard from "@/components/pdv/TestOrderWizard";
import LoginForm from "@/components/auth/LoginForm";
import { usePermissions } from "@/lib/permissions";

const PDV = () => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { user, isAuthenticated, logout } = usePermissions();

  const handleLogout = () => {
    try {
      console.log('🚪 Fazendo logout...');
      logout();
      console.log('✅ Logout executado');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      // Em caso de erro, forçar recarregamento como fallback
      window.location.reload();
    }
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
  };

  // Se não estiver autenticado ou se login estiver sendo mostrado
  if (!isAuthenticated || showLogin) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  // Mock events data for demonstration
  const mockEvents = [
    {
      id: '1',
      title: 'Prova - Maria Silva',
      type: 'try_on' as const,
      date: new Date().toISOString(),
      time: '14:00',
      customer_name: 'Maria Silva',
      product_name: 'Vestido de Festa Azul',
      order_id: 'ORD-001',
      status: 'confirmed' as const,
      priority: 'medium' as const,
      color: 'bg-blue-500'
    },
    {
      id: '2',
      title: 'Retirada - João Santos',
      type: 'pickup' as const,
      date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      time: '10:00',
      customer_name: 'João Santos',
      product_name: 'Terno Clássico',
      order_id: 'ORD-002',
      status: 'pending' as const,
      priority: 'high' as const,
      color: 'bg-green-500'
    },
    {
      id: '3',
      title: 'Evento - Casamento Ana',
      type: 'event' as const,
      date: new Date(Date.now() + 259200000).toISOString(), // 3 days
      time: '16:00',
      customer_name: 'Ana Costa',
      product_name: 'Vestido de Noiva',
      order_id: 'ORD-003',
      status: 'confirmed' as const,
      priority: 'high' as const,
      color: 'bg-purple-500'
    },
    {
      id: '4',
      title: 'Devolução - Carlos Lima',
      type: 'return' as const,
      date: new Date(Date.now() + 345600000).toISOString(), // 4 days
      time: '09:00',
      customer_name: 'Carlos Lima',
      product_name: 'Smoking',
      order_id: 'ORD-004',
      status: 'pending' as const,
      priority: 'medium' as const,
      color: 'bg-orange-500'
    },
    {
      id: '5',
      title: 'ATRASO - Pedro Oliveira',
      type: 'overdue' as const,
      date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      time: '18:00',
      customer_name: 'Pedro Oliveira',
      product_name: 'Fraque',
      order_id: 'ORD-005',
      status: 'pending' as const,
      priority: 'high' as const,
      color: 'bg-red-500'
    }
  ];

  const handleEventClick = (event: any) => {
    console.log('Event clicked:', event);
    // Implement event detail modal or navigation
  };

  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date);
    // Implement date selection logic
  };

  const handleCreateEvent = (date: Date) => {
    console.log('Create event for date:', date);
    // Implement event creation modal
  };

  return (
    <div className="page-transition h-full">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">Ponto de Venda Híbrido</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-base">
            Sistema completo de vendas e aluguéis
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Informações do usuário logado */}
          {user && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg shadow-sm">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">{user.full_name}</span>
              <Badge variant="outline" className="text-xs">{user.role.name}</Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLogout}
                className="h-6 w-6 p-0 ml-2"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          <SyncStatusIndicator />
          <Button 
            onClick={() => setIsWizardOpen(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Criar Pedido Teste
          </Button>
        </div>
      </header>

      <Tabs defaultValue="venda" className="w-full">
        <div className="overflow-x-auto mb-4 md:mb-6">
          <TabsList className="w-full grid grid-cols-7 min-w-[800px] md:min-w-0">
            <TabsTrigger value="venda" className="text-sm md:text-base py-2 md:py-2.5 px-2 md:px-4">
              🛒 Venda
            </TabsTrigger>
            <TabsTrigger value="pedidos" className="text-sm md:text-base py-2 md:py-2.5 px-2 md:px-4">
              📋 Pedidos
            </TabsTrigger>
            <TabsTrigger value="caixa" className="text-sm md:text-base py-2 md:py-2.5 px-2 md:px-4">
              💰 Caixa
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="text-sm md:text-base py-2 md:py-2.5 px-2 md:px-4">
              📊 Dashboard
            </TabsTrigger>
            <TabsTrigger value="agenda" className="text-sm md:text-base py-2 md:py-2.5 px-2 md:px-4">
              📅 Agenda
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="text-sm md:text-base py-2 md:py-2.5 px-2 md:px-4">
              📈 Relatórios
            </TabsTrigger>
            <TabsTrigger value="sistema" className="text-sm md:text-base py-2 md:py-2.5 px-2 md:px-4">
              🖥 Sistema
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div>
          <TabsContent value="venda" className="space-y-4">
            <PDVSale />
          </TabsContent>
          
          <TabsContent value="pedidos" className="space-y-4">
            <PDVOrders />
          </TabsContent>
          
          <TabsContent value="caixa" className="space-y-4">
            <PDVCashier />
          </TabsContent>
          
          <TabsContent value="dashboard" className="space-y-4">
            <RealTimeDashboard />
          </TabsContent>
          
          <TabsContent value="agenda" className="space-y-4">
            <EventCalendar 
              events={mockEvents}
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
              onCreateEvent={handleCreateEvent}
            />
          </TabsContent>
          
          <TabsContent value="relatorios" className="space-y-4">
            <PDVReports />
          </TabsContent>
          
          <TabsContent value="sistema" className="space-y-4">
            <SystemManagement />
          </TabsContent>
        </div>
      </Tabs>
      
      {/* Test Order Wizard */}
      <TestOrderWizard 
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />
    </div>
  );
};

export default PDV;
