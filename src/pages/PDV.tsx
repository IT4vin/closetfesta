
import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PDVSale from "@/components/pdv/PDVSale";
import PDVCashier from "@/components/pdv/PDVCashier";
import PDVReports from "@/components/pdv/PDVReports";

const PDV = () => {
  return (
    <div className="page-transition h-full">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">Ponto de Venda</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-base">
            Gestão de vendas, caixa e relatórios
          </p>
        </div>
      </header>

      <Tabs defaultValue="venda" className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-4 md:mb-6 overflow-x-auto">
          <TabsTrigger value="venda" className="text-sm md:text-base py-2 md:py-2.5 px-2 md:px-4">
            Venda
          </TabsTrigger>
          <TabsTrigger value="caixa" className="text-sm md:text-base py-2 md:py-2.5 px-2 md:px-4">
            Caixa
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="text-sm md:text-base py-2 md:py-2.5 px-2 md:px-4">
            Relatórios
          </TabsTrigger>
        </TabsList>
        
        <div className="overflow-x-auto">
          <TabsContent value="venda" className="space-y-4 min-w-[500px] md:min-w-0">
            <PDVSale />
          </TabsContent>
          
          <TabsContent value="caixa" className="space-y-4 min-w-[500px] md:min-w-0">
            <PDVCashier />
          </TabsContent>
          
          <TabsContent value="relatorios" className="space-y-4">
            <PDVReports />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default PDV;
