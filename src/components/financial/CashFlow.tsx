
import React, { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PeriodSelector from "@/components/common/PeriodSelector";
import { 
  CashFlowChart, 
  CurrentBalanceCard, 
  FinancialProjection,
  MonthlyFlowChart
} from "./cash-flow";

const CashFlow = () => {
  const [timeRange, setTimeRange] = useState("month");
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Fluxo de Caixa</h2>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CurrentBalanceCard />
        <CashFlowChart />
      </div>

      <Tabs defaultValue="projection" className="w-full">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="projection">Projeção Financeira</TabsTrigger>
          <TabsTrigger value="history">Histórico Consolidado</TabsTrigger>
        </TabsList>

        <TabsContent value="projection" className="mt-6">
          <FinancialProjection />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <MonthlyFlowChart />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CashFlow;
