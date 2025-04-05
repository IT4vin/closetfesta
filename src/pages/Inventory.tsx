
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import InventoryOverview from "@/components/inventory/InventoryOverview";

const Inventory = () => {
  return (
    <MainLayout>
      <div className="page-transition">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Controle de Estoque</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-lg">
            Gerencie seu estoque, entrada/saída e receba alertas de inventário
          </p>
        </header>
        
        <InventoryOverview />
      </div>
    </MainLayout>
  );
};

export default Inventory;
