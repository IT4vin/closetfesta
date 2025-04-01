
import React, { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import SaleForm from "./SaleForm";
import RentalForm from "./RentalForm";

interface LancamentoTabsProps {
  onClose: () => void;
}

const LancamentoTabs = ({ onClose }: LancamentoTabsProps) => {
  const [activeTab, setActiveTab] = useState("venda");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full grid grid-cols-2">
        <TabsTrigger value="venda">Nova Venda</TabsTrigger>
        <TabsTrigger value="aluguel">Novo Aluguel</TabsTrigger>
      </TabsList>
      
      {/* Sale Form */}
      <TabsContent value="venda" className="space-y-4 py-4">
        <SaleForm onClose={onClose} />
      </TabsContent>
      
      {/* Rental Form */}
      <TabsContent value="aluguel" className="space-y-4 py-4">
        <RentalForm onClose={onClose} />
      </TabsContent>
    </Tabs>
  );
};

export default LancamentoTabs;
