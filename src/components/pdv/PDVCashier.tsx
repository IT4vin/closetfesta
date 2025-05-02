
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Box, CashRegister, ArrowUp, ArrowDown, LockOpen } from "lucide-react";
import CashierTransactionsTable from "./CashierTransactionsTable";

interface CashierState {
  isOpen: boolean;
  openingBalance: number;
  currentBalance: number;
  openedAt: Date | null;
  closedAt: Date | null;
  openedBy: string | null;
  movements: CashierMovement[];
}

interface CashierMovement {
  id: number;
  type: 'opening' | 'closing' | 'sale' | 'refund' | 'withdrawal' | 'deposit';
  amount: number;
  balance: number;
  description: string;
  createdAt: Date;
  createdBy: string;
}

const PDVCashier = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [cashierState, setCashierState] = useState<CashierState>({
    isOpen: false,
    openingBalance: 0,
    currentBalance: 0,
    openedAt: null,
    closedAt: null,
    openedBy: null,
    movements: []
  });
  const [isOpenCashierDialog, setIsOpenCashierDialog] = useState(false);
  const [isCloseCashierDialog, setIsCloseCashierDialog] = useState(false);
  const [isMovementDialog, setIsMovementDialog] = useState(false);
  const [movementAmount, setMovementAmount] = useState("");
  const [movementDescription, setMovementDescription] = useState("");
  const [movementType, setMovementType] = useState<"withdrawal" | "deposit">("withdrawal");
  const [openingAmount, setOpeningAmount] = useState("");
  const [closingNote, setClosingNote] = useState("");

  // Function to open the cashier
  const handleOpenCashier = () => {
    if (!openingAmount || parseFloat(openingAmount) < 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor inicial válido.",
        variant: "destructive",
      });
      return;
    }

    const opening = parseFloat(openingAmount);
    const newCashierState: CashierState = {
      isOpen: true,
      openingBalance: opening,
      currentBalance: opening,
      openedAt: new Date(),
      closedAt: null,
      openedBy: user?.name || "Operador",
      movements: [
        {
          id: 1,
          type: 'opening',
          amount: opening,
          balance: opening,
          description: 'Abertura de caixa',
          createdAt: new Date(),
          createdBy: user?.name || "Operador"
        }
      ]
    };

    setCashierState(newCashierState);
    setIsOpenCashierDialog(false);
    setOpeningAmount("");

    toast({
      title: "Caixa aberto",
      description: `Caixa aberto com saldo inicial de R$${opening.toFixed(2)}.`
    });
  };

  // Function to close the cashier
  const handleCloseCashier = () => {
    const closingMovement: CashierMovement = {
      id: cashierState.movements.length + 1,
      type: 'closing',
      amount: -cashierState.currentBalance, // Negative because we're taking all money out
      balance: 0,
      description: closingNote || 'Fechamento de caixa',
      createdAt: new Date(),
      createdBy: user?.name || "Operador"
    };

    const finalMovements = [...cashierState.movements, closingMovement];

    setCashierState({
      ...cashierState,
      isOpen: false,
      currentBalance: 0,
      closedAt: new Date(),
      movements: finalMovements
    });

    setIsCloseCashierDialog(false);
    setClosingNote("");

    toast({
      title: "Caixa fechado",
      description: `Caixa fechado com saldo final de R$${cashierState.currentBalance.toFixed(2)}.`
    });
  };

  // Function to add cashier movement (withdrawal or deposit)
  const handleCashierMovement = () => {
    const amount = parseFloat(movementAmount);
    
    if (!amount || amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido.",
        variant: "destructive",
      });
      return;
    }

    // For withdrawal, make sure we have enough balance
    if (movementType === "withdrawal" && amount > cashierState.currentBalance) {
      toast({
        title: "Saldo insuficiente",
        description: "O valor de sangria excede o saldo atual do caixa.",
        variant: "destructive",
      });
      return;
    }

    const finalAmount = movementType === "withdrawal" ? -amount : amount;
    const newBalance = cashierState.currentBalance + finalAmount;

    const newMovement: CashierMovement = {
      id: cashierState.movements.length + 1,
      type: movementType,
      amount: finalAmount,
      balance: newBalance,
      description: movementDescription || (movementType === "withdrawal" ? "Sangria" : "Reforço"),
      createdAt: new Date(),
      createdBy: user?.name || "Operador"
    };

    setCashierState({
      ...cashierState,
      currentBalance: newBalance,
      movements: [...cashierState.movements, newMovement]
    });

    setIsMovementDialog(false);
    setMovementAmount("");
    setMovementDescription("");

    toast({
      title: movementType === "withdrawal" ? "Sangria realizada" : "Reforço realizado",
      description: `${movementType === "withdrawal" ? "Sangria" : "Reforço"} de R$${amount.toFixed(2)} realizado com sucesso.`
    });
  };

  // Mock function to generate test sales
  const generateTestSale = () => {
    const saleAmount = Math.round(Math.random() * 100) + 10;
    
    const newMovement: CashierMovement = {
      id: cashierState.movements.length + 1,
      type: 'sale',
      amount: saleAmount,
      balance: cashierState.currentBalance + saleAmount,
      description: 'Venda #' + Math.floor(Math.random() * 1000),
      createdAt: new Date(),
      createdBy: user?.name || "Operador"
    };

    setCashierState({
      ...cashierState,
      currentBalance: cashierState.currentBalance + saleAmount,
      movements: [...cashierState.movements, newMovement]
    });

    toast({
      title: "Venda registrada",
      description: `Venda de R$${saleAmount.toFixed(2)} registrada no caixa.`
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Status do Caixa</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 space-y-6">
            <div className={`flex justify-between items-center p-4 rounded-md 
              ${cashierState.isOpen 
                ? "bg-green-50 dark:bg-green-900/30 border border-green-200" 
                : "bg-red-50 dark:bg-red-900/30 border border-red-200"}`}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">Status:</span>
                <span className="text-lg font-bold">
                  {cashierState.isOpen ? "Aberto" : "Fechado"}
                </span>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center 
                ${cashierState.isOpen 
                  ? "bg-green-100 text-green-600" 
                  : "bg-red-100 text-red-600"}`}
              >
                {cashierState.isOpen 
                  ? <Box size={24} /> 
                  : <LockOpen size={24} />}
              </div>
            </div>

            {cashierState.isOpen && (
              <>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Saldo Atual:</span>
                    <span className="font-bold">R$ {cashierState.currentBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Saldo Inicial:</span>
                    <span>R$ {cashierState.openingBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Operador:</span>
                    <span>{cashierState.openedBy}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Aberto em:</span>
                    <span>
                      {cashierState.openedAt?.toLocaleDateString('pt-BR')} às {cashierState.openedAt?.toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline"
                    className="border-red-300 hover:bg-red-50 dark:hover:bg-red-900/30" 
                    onClick={() => setIsMovementDialog(true)}
                  >
                    <ArrowUp size={16} className="mr-2 text-red-600" />
                    Sangria
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-green-300 hover:bg-green-50 dark:hover:bg-green-900/30"
                    onClick={() => {
                      setMovementType("deposit");
                      setIsMovementDialog(true);
                    }}
                  >
                    <ArrowDown size={16} className="mr-2 text-green-600" />
                    Reforço
                  </Button>
                </div>
              </>
            )}
            
            {cashierState.isOpen ? (
              <Button 
                variant="destructive" 
                className="w-full" 
                onClick={() => setIsCloseCashierDialog(true)}
              >
                Fechar Caixa
              </Button>
            ) : (
              <Button 
                className="w-full bg-marsala hover:bg-marsala-700" 
                onClick={() => setIsOpenCashierDialog(true)}
              >
                Abrir Caixa
              </Button>
            )}

            {/* Dev tools for testing */}
            {cashierState.isOpen && (
              <Button 
                variant="outline" 
                size="sm"
                className="w-full text-xs" 
                onClick={generateTestSale}
              >
                Gerar venda teste
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Transactions card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Movimentações do Caixa</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CashierTransactionsTable movements={cashierState.movements} />
          </CardContent>
        </Card>
      </div>

      {/* Open Cashier Dialog */}
      <Dialog open={isOpenCashierDialog} onOpenChange={setIsOpenCashierDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Abrir Caixa</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="openingAmount">Saldo Inicial</Label>
              <Input
                id="openingAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpenCashierDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleOpenCashier} className="bg-marsala hover:bg-marsala-700">
              Abrir Caixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Cashier Dialog */}
      <Dialog open={isCloseCashierDialog} onOpenChange={setIsCloseCashierDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Fechar Caixa</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-md">
              <p className="font-medium mb-2">Resumo do Caixa</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span>Saldo inicial:</span>
                <span className="text-right">R$ {cashierState.openingBalance.toFixed(2)}</span>
                <span>Saldo atual:</span>
                <span className="text-right font-bold">R$ {cashierState.currentBalance.toFixed(2)}</span>
                <span>Diferença:</span>
                <span className="text-right">
                  R$ {(cashierState.currentBalance - cashierState.openingBalance).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="closingNote">Observação (opcional)</Label>
              <Input
                id="closingNote"
                placeholder="Observação para o fechamento..."
                value={closingNote}
                onChange={(e) => setClosingNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloseCashierDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCloseCashier} variant="destructive">
              Fechar Caixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog (Sangria/Reforço) */}
      <Dialog open={isMovementDialog} onOpenChange={setIsMovementDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {movementType === "withdrawal" ? "Sangria de Caixa" : "Reforço de Caixa"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="movementAmount">Valor</Label>
              <Input
                id="movementAmount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={movementAmount}
                onChange={(e) => setMovementAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="movementDescription">Descrição (opcional)</Label>
              <Input
                id="movementDescription"
                placeholder="Motivo da movimentação..."
                value={movementDescription}
                onChange={(e) => setMovementDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMovementDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCashierMovement}
              className={movementType === "withdrawal" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PDVCashier;
