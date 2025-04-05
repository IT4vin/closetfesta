
import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import InventoryOverview from "@/components/inventory/InventoryOverview";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import InventoryForm from "@/components/inventory/InventoryForm";

const Inventory = () => {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  
  return (
    <MainLayout>
      <div className="page-transition">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Controle de Estoque</h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-lg">
              Gerencie seu estoque, entrada/saída e receba alertas de inventário
            </p>
          </div>
          
          <Button 
            onClick={() => setIsAddProductOpen(true)} 
            className="bg-marsala hover:bg-marsala-700 text-white"
          >
            <Plus size={18} className="mr-2" />
            Adicionar Produto
          </Button>
        </header>
        
        <InventoryOverview />
        
        <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Adicionar Produto ao Estoque</DialogTitle>
            </DialogHeader>
            <InventoryForm product={null} onClose={() => setIsAddProductOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Inventory;
