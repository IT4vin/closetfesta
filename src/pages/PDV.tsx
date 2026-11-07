import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, LogOut } from "lucide-react";
import PDVSale from "@/components/pdv/PDVSale";
import PDVCashier from "@/components/pdv/PDVCashier";
import PDVReports from "@/components/pdv/PDVReports";
import PDVOrders from "@/components/pdv/PDVOrders";
import SystemManagement from "@/components/pdv/SystemManagement";
import SyncStatusIndicator from "@/components/pdv/SyncStatusIndicator";
import RealTimeDashboard from "@/components/dashboard/RealTimeDashboard";
import AppointmentManager from "@/components/calendar/AppointmentManager";
import LoginForm from "@/components/auth/LoginForm";
import { usePermissions } from "@/lib/permissions";

const PDV = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") === "pedidos" ? "pedidos" : "venda");
  useEffect(() => {
    if (searchParams.get("tab") === "pedidos") setActiveTab("pedidos");
  }, [searchParams]);
  useEffect(() => {
    const openOrders = () => setActiveTab("pedidos");
    window.addEventListener("closetfesta:open-orders", openOrders);
    return () => window.removeEventListener("closetfesta:open-orders", openOrders);
  }, []);
  const { user, isAuthenticated, logout } = usePermissions();

  const handleLogout = async () => {
    try {
      console.log('🚪 Fazendo logout na página PDV...');
      
      // Mostrar feedback imediato (se necessário, podemos adicionar um estado de loading)
      logout();
      
      console.log('✅ Logout executado com sucesso na página PDV');
      
      // O redirecionamento será gerenciado pelo App.tsx através do evento
      
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      
      // Em caso de erro, tentar forçar o logout manualmente
      try {
        localStorage.removeItem('closetfesta_session');
        window.location.reload();
      } catch (fallbackError) {
        console.error('❌ Erro no fallback de logout:', fallbackError);
        alert('Erro ao fazer logout. A página será recarregada.');
        window.location.reload();
      }
    }
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
  };

  // Se não estiver autenticado ou se login estiver sendo mostrado
  if (!isAuthenticated || showLogin) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="page-transition h-full">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">Balcão de Locações</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-base">
            Atendimento, seleção de trajes e controle de locações
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
          
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
            <AppointmentManager />
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
      
    </div>
  );
};

export default PDV;
