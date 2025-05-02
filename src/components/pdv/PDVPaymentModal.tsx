
import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Cash, 
  CreditCard, 
  Wallet,
  Receipt,
  Plug,
  Package
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface PDVPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onPaymentComplete: (paymentDetails: any) => void;
  customer: { name: string; document: string } | null;
}

const PDVPaymentModal: React.FC<PDVPaymentModalProps> = ({
  isOpen,
  onClose,
  total,
  onPaymentComplete,
  customer
}) => {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [receivedAmount, setReceivedAmount] = useState<string>("");
  const [installments, setInstallments] = useState<string>("1");
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitPayment, setSplitPayment] = useState(false);
  const [payments, setPayments] = useState<{method: string; value: number}[]>([]);
  const [currentPaymentValue, setCurrentPaymentValue] = useState<string>("");
  
  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setPaymentMethod("cash");
      setReceivedAmount("");
      setInstallments("1");
      setIsProcessing(false);
      setSplitPayment(false);
      setPayments([]);
      setCurrentPaymentValue("");
    }
  }, [isOpen]);

  const paymentMethods: PaymentMethod[] = [
    { id: "cash", name: "Dinheiro", icon: <Cash className="h-5 w-5" /> },
    { id: "credit", name: "Cartão de Crédito", icon: <CreditCard className="h-5 w-5" /> },
    { id: "debit", name: "Cartão de Débito", icon: <CreditCard className="h-5 w-5" /> },
    { id: "pix", name: "PIX", icon: <Wallet className="h-5 w-5" /> },
    { id: "store", name: "Crediário", icon: <Receipt className="h-5 w-5" /> },
  ];
  
  const calculateChange = (): number => {
    const received = parseFloat(receivedAmount);
    if (isNaN(received)) return 0;
    const change = received - total;
    return Math.max(0, change);
  };
  
  const getTotalPaid = (): number => {
    return payments.reduce((acc, payment) => acc + payment.value, 0);
  };
  
  const getRemainingAmount = (): number => {
    return Math.max(0, total - getTotalPaid());
  };
  
  const handleAddSplitPayment = () => {
    const paymentValue = parseFloat(currentPaymentValue);
    if (isNaN(paymentValue) || paymentValue <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido para o pagamento.",
        variant: "destructive",
      });
      return;
    }
    
    // Don't allow payment larger than remaining amount
    const remaining = getRemainingAmount();
    if (paymentValue > remaining) {
      toast({
        title: "Valor excede o restante",
        description: `O valor máximo para este pagamento é R$${remaining.toFixed(2)}.`,
        variant: "destructive",
      });
      return;
    }
    
    // Add to payments
    setPayments([...payments, { 
      method: paymentMethod, 
      value: paymentValue 
    }]);
    
    // Reset fields
    setCurrentPaymentValue("");
  };
  
  const handleFinishPayment = () => {
    setIsProcessing(true);
    
    // In a real app, this would connect to payment processor API
    setTimeout(() => {
      // Collect payment details for receipt/records
      const paymentDetails = {
        total,
        customer,
        date: new Date(),
        payments: splitPayment ? payments : [{
          method: paymentMethod,
          value: total,
          installments: paymentMethod === "credit" ? parseInt(installments) : 1
        }],
        change: paymentMethod === "cash" ? calculateChange() : 0
      };
      
      onPaymentComplete(paymentDetails);
      setIsProcessing(false);
    }, 1500);
  };
  
  const isPaymentComplete = (): boolean => {
    if (!splitPayment) {
      // For single payment methods
      return paymentMethod === "cash" ? receivedAmount !== "" : true;
    } else {
      // For split payments, ensure total amount is covered
      return Math.abs(getRemainingAmount()) < 0.01;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Pagamento</DialogTitle>
        </DialogHeader>
        
        <div className="my-2">
          <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-md mb-4">
            <span>Total a pagar:</span>
            <span className="font-bold text-xl">R$ {total.toFixed(2)}</span>
          </div>
          
          {customer && (
            <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-900 rounded-md text-sm">
              <p><strong>Cliente:</strong> {customer.name}</p>
              {customer.document && <p><strong>Documento:</strong> {customer.document}</p>}
            </div>
          )}
          
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Forma de Pagamento</h3>
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs h-7"
                onClick={() => setSplitPayment(!splitPayment)}
              >
                {splitPayment ? "Pagamento Único" : "Dividir Pagamento"}
              </Button>
            </div>
          </div>
          
          {!splitPayment ? (
            // Single payment method
            <>
              <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="mb-6">
                <TabsList className="grid grid-cols-3 sm:grid-cols-5">
                  {paymentMethods.map(method => (
                    <TabsTrigger 
                      key={method.id} 
                      value={method.id}
                      className="flex flex-col items-center gap-1 py-3"
                    >
                      {method.icon}
                      <span className="text-xs">{method.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                <TabsContent value="cash" className="mt-4">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="receivedAmount">Valor Recebido</Label>
                      <Input 
                        id="receivedAmount"
                        type="number" 
                        min={total}
                        placeholder="0.00" 
                        value={receivedAmount}
                        onChange={(e) => setReceivedAmount(e.target.value)}
                      />
                    </div>
                    
                    {parseFloat(receivedAmount) >= total && (
                      <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-md">
                        <p className="font-medium">Troco:</p>
                        <p className="text-xl font-bold">R$ {calculateChange().toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="credit" className="mt-4">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="installments">Parcelamento</Label>
                      <select
                        id="installments"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={installments}
                        onChange={(e) => setInstallments(e.target.value)}
                      >
                        <option value="1">À vista</option>
                        <option value="2">2x</option>
                        <option value="3">3x</option>
                        <option value="4">4x</option>
                        <option value="5">5x</option>
                        <option value="6">6x</option>
                        <option value="7">7x</option>
                        <option value="8">8x</option>
                        <option value="9">9x</option>
                        <option value="10">10x</option>
                        <option value="11">11x</option>
                        <option value="12">12x</option>
                      </select>
                    </div>
                    
                    {parseInt(installments) > 1 && (
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md">
                        <p className="font-medium">Valor da parcela:</p>
                        <p className="text-xl font-bold">
                          {parseInt(installments)}x de R$ {(total / parseInt(installments)).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="debit" className="mt-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <p>O valor total será cobrado do cartão de débito.</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="pix" className="mt-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <div className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-md mb-3">
                      <Plug className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-center text-gray-500">
                        Em uma implementação real, o QR code do PIX seria exibido aqui.
                      </p>
                    </div>
                    <p className="text-sm">Aguardando confirmação de pagamento...</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="store" className="mt-4">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="storeInstallments">Parcelamento</Label>
                      <select
                        id="storeInstallments"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={installments}
                        onChange={(e) => setInstallments(e.target.value)}
                      >
                        <option value="1">À vista</option>
                        <option value="2">2x</option>
                        <option value="3">3x</option>
                        <option value="4">4x</option>
                        <option value="5">5x</option>
                        <option value="6">6x</option>
                      </select>
                    </div>
                    
                    {!customer && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-md">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          Cliente não identificado. Para crediário é necessário identificar o cliente.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            // Split payment method
            <div className="space-y-4">
              <div className="grid gap-2">
                <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
                  <TabsList className="grid grid-cols-3 sm:grid-cols-5">
                    {paymentMethods.map(method => (
                      <TabsTrigger 
                        key={method.id} 
                        value={method.id}
                        className="flex flex-col items-center gap-1 py-2"
                      >
                        {method.icon}
                        <span className="text-xs">{method.name}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                
                <div className="flex gap-2 mt-4">
                  <div className="flex-1">
                    <Label htmlFor="paymentValue">Valor</Label>
                    <Input 
                      id="paymentValue"
                      type="number" 
                      min={0.01} 
                      max={getRemainingAmount()}
                      step={0.01}
                      placeholder="0.00" 
                      value={currentPaymentValue}
                      onChange={(e) => setCurrentPaymentValue(e.target.value)}
                    />
                  </div>
                  <div className="pt-6">
                    <Button 
                      onClick={handleAddSplitPayment} 
                      disabled={getRemainingAmount() <= 0}
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Pagamentos</h4>
                  
                  {payments.length === 0 ? (
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <p className="text-gray-500">Nenhum pagamento adicionado</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {payments.map((payment, index) => {
                        const method = paymentMethods.find(m => m.id === payment.method);
                        return (
                          <div 
                            key={index} 
                            className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                          >
                            <div className="flex items-center">
                              {method?.icon}
                              <span className="ml-2">{method?.name}</span>
                            </div>
                            <span className="font-medium">R$ {payment.value.toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md mt-3">
                    <span>Valor pago:</span>
                    <span className="font-medium">R$ {getTotalPaid().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-md mt-1">
                    <span>Restante:</span>
                    <span className="font-medium">R$ {getRemainingAmount().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button 
            onClick={handleFinishPayment} 
            disabled={isProcessing || !isPaymentComplete() || (!customer && paymentMethod === "store")}
            className="bg-marsala hover:bg-marsala-700"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando...
              </>
            ) : (
              "Finalizar Pagamento"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PDVPaymentModal;
