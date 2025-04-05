
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import InventoryDashboard from "./InventoryDashboard";
import InventoryList from "./InventoryList";
import InventoryTransactions from "./InventoryTransactions";
import InventoryAlerts from "./InventoryAlerts";
import InventoryReports from "./InventoryReports";
import { 
  BarChart3, 
  Package, 
  ArrowRightLeft, 
  AlertTriangle,
  FileBarChart 
} from "lucide-react";

const InventoryOverview = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 size={16} />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package size={16} />
            <span className="hidden sm:inline">Estoque</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <ArrowRightLeft size={16} />
            <span className="hidden sm:inline">Movimentações</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span className="hidden sm:inline">Alertas</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileBarChart size={16} />
            <span className="hidden sm:inline">Relatórios</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <InventoryDashboard />
        </TabsContent>
        
        <TabsContent value="inventory" className="space-y-6">
          <InventoryList />
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-6">
          <InventoryTransactions />
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-6">
          <InventoryAlerts />
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-6">
          <InventoryReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryOverview;
