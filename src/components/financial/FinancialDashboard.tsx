
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  FinancialMetricsCards,
  RevenueChart,
  ExpenseBreakdown,
  UpcomingFinancialEvents,
  PeriodSelector
} from "./dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FinancialDashboard = () => {
  const [timeRange, setTimeRange] = useState("month");
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Dashboard Financeiro</h2>
        <div className="flex gap-2">
          <PeriodSelector 
            timeRange={timeRange} 
            setTimeRange={setTimeRange} 
          />
          <Button variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <FinancialMetricsCards />
      
      {/* Revenue Chart */}
      <RevenueChart />

      <Tabs defaultValue="projection" className="w-full">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="projection">Projeção Financeira</TabsTrigger>
          <TabsTrigger value="history">Histórico Consolidado</TabsTrigger>
        </TabsList>

        <TabsContent value="projection" className="mt-6">
          <ExpenseBreakdown />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <UpcomingFinancialEvents />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialDashboard;
