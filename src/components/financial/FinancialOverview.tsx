
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import FinancialDashboard from "./FinancialDashboard";
import AccountsPayable from "./AccountsPayable";
import AccountsReceivable from "./AccountsReceivable";
import FinancialReports from "./FinancialReports";
import CashFlow from "./CashFlow";
import { 
  BarChart3, 
  ArrowDown, 
  ArrowUp, 
  FileBarChart,
  LineChart 
} from "lucide-react";

const FinancialOverview = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 size={16} />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="receivable" className="flex items-center gap-2">
            <ArrowUp size={16} />
            <span className="hidden sm:inline">A Receber</span>
          </TabsTrigger>
          <TabsTrigger value="payable" className="flex items-center gap-2">
            <ArrowDown size={16} />
            <span className="hidden sm:inline">A Pagar</span>
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="flex items-center gap-2">
            <LineChart size={16} />
            <span className="hidden sm:inline">Fluxo de Caixa</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileBarChart size={16} />
            <span className="hidden sm:inline">Relatórios</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <FinancialDashboard />
        </TabsContent>
        
        <TabsContent value="receivable" className="space-y-6">
          <AccountsReceivable />
        </TabsContent>
        
        <TabsContent value="payable" className="space-y-6">
          <AccountsPayable />
        </TabsContent>
        
        <TabsContent value="cashflow" className="space-y-6">
          <CashFlow />
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-6">
          <FinancialReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialOverview;
