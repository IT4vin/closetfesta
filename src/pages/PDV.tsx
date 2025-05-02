
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PDVSale from "@/components/pdv/PDVSale";
import PDVCashier from "@/components/pdv/PDVCashier";
import PDVReports from "@/components/pdv/PDVReports";

const PDV = () => {
  return (
    <div className="page-transition h-full">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Ponto de Venda</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-lg">
            Gestão de vendas, caixa e relatórios
          </p>
        </div>
      </header>

      <Tabs defaultValue="venda" className="w-full">
        <TabsList className="w-full md:w-auto grid grid-cols-3 mb-8">
          <TabsTrigger value="venda" className="text-base py-3 px-6">Venda</TabsTrigger>
          <TabsTrigger value="caixa" className="text-base py-3 px-6">Caixa</TabsTrigger>
          <TabsTrigger value="relatorios" className="text-base py-3 px-6">Relatórios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="venda" className="space-y-4">
          <PDVSale />
        </TabsContent>
        
        <TabsContent value="caixa" className="space-y-4">
          <PDVCashier />
        </TabsContent>
        
        <TabsContent value="relatorios" className="space-y-4">
          <PDVReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PDV;
