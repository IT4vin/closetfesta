
import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import FinancialOverview from "@/components/financial/FinancialOverview";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import TransactionForm from "@/components/financial/TransactionForm";

const Financial = () => {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  
  return (
    <MainLayout>
      <div className="page-transition">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Gestão Financeira</h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-lg">
              Controle de contas a pagar, receber e análise financeira
            </p>
          </div>
          
          <Button 
            onClick={() => setIsAddTransactionOpen(true)} 
            className="bg-marsala hover:bg-marsala-700 text-white"
          >
            <Plus size={18} className="mr-2" />
            Nova Transação
          </Button>
        </header>
        
        <FinancialOverview />
        
        <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Registrar Nova Transação</DialogTitle>
            </DialogHeader>
            <TransactionForm transaction={null} onClose={() => setIsAddTransactionOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Financial;
