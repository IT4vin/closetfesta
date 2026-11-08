import React, { useState } from "react";
import { loadClosetSettings, type ClosetSettingValues } from "@/lib/closetSettings";
import { isMethodEnabled, availableInstallments, minimumInitialPayment, validatePaymentLines } from "@/lib/paymentRules";
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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Wallet, 
  CreditCard, 
  Receipt,
  Plug,
  Package,
  BanknoteIcon
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
  onPaymentComplete: (paymentDetails: any) => Promise<void>;
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
  const [paymentMethod, setPaymentMethod] = useState<string>("pix");
  const [receiptMode,setReceiptMode]=useState<"half"|"full"|"custom">("half");
  const [customAmount,setCustomAmount]=useState("");
  const [receivedAmount, setReceivedAmount] = useState<string>("");
  const [installments, setInstallments] = useState<string>("1");
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitPayment, setSplitPayment] = useState(false);
  const [payments, setPayments] = useState<{method: string; value: number; installments:number}[]>([]);
  const [currentPaymentValue, setCurrentPaymentValue] = useState<string>("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentRules, setPaymentRules] = useState<ClosetSettingValues>({});
  const [operationalRules, setOperationalRules] = useState<ClosetSettingValues>({});
  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesError, setRulesError] = useState("");
  React.useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    setRulesLoading(true); setRulesError("");
    void Promise.all([loadClosetSettings("payments"),loadClosetSettings("operations")])
      .then(([payments,operations]) => {
        if (!alive) return;
        setPaymentRules(payments); setOperationalRules(operations);
        const first = ["pix","cash","debit","credit"].find(method=>isMethodEnabled(payments,method));
        if (first) setPaymentMethod(first);
        setRulesLoading(false);
      }).catch(error => {
        if (!alive) return;
        setRulesError(error instanceof Error ? error.message : "Não foi possível carregar as regras financeiras.");
        setRulesLoading(false);
      });
    return () => { alive = false; };
  }, [isOpen]);
  
  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setPaymentMethod("pix");setReceiptMode("half");setCustomAmount("");
      setReceivedAmount("");
      setInstallments("1");
      setIsProcessing(false);
      setSplitPayment(false);
      setPayments([]);
      setCurrentPaymentValue("");
      setPaymentConfirmed(false);
    }
  }, [isOpen]);

  const paymentMethods: PaymentMethod[] = [
    { id: "cash", name: "Dinheiro", icon: <BanknoteIcon className="h-5 w-5" /> },
    { id: "credit", name: "Cartão de Crédito", icon: <CreditCard className="h-5 w-5" /> },
    { id: "debit", name: "Cartão de Débito", icon: <CreditCard className="h-5 w-5" /> },
    { id: "pix", name: "PIX", icon: <Wallet className="h-5 w-5" /> },
  ].filter(method => isMethodEnabled(paymentRules,method.id));
  
  const requiredPayment=minimumInitialPayment(operationalRules,total);
  const half=Math.max(0.01,requiredPayment);
  const target=receiptMode==="half"?half:receiptMode==="full"?total:Number(customAmount);
  const validTarget=Number.isFinite(target)&&target>0&&target<=total&&Math.abs(target*100-Math.round(target*100))<0.0001;
  const allowedInstallments=availableInstallments(paymentRules,target);
  const calculateChange = (): number => {
    const received = parseFloat(receivedAmount);
    if (isNaN(received)) return 0;
    const change = received - target;
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
    if (!Number.isFinite(paymentValue) || paymentValue <= 0 || Math.round(paymentValue*100)!==paymentValue*100) {
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
    if (!isMethodEnabled(paymentRules,paymentMethod) || !availableInstallments(paymentRules,paymentValue).includes(paymentMethod==="credit"?parseInt(installments,10):1)) {
      toast({title:"Método ou parcelas indisponíveis",description:"Confira as regras de pagamento configuradas.",variant:"destructive"});return;
    }
    setPayments([...payments, { 
      method: paymentMethod, 
      value: paymentValue,
      installments:paymentMethod==="credit"?parseInt(installments):1,
    }]);
    
    // Reset fields
    setCurrentPaymentValue("");
  };
  
  const handleFinishPayment = async () => {
    if (!paymentConfirmed || isProcessing || rulesLoading || rulesError) return;
    setIsProcessing(true);
    try {
      // Registro manual: nenhuma cobrança eletrônica é iniciada pelo sistema.
      const paymentDetails = {
        total,
        customer,
        date: new Date().toISOString(),
        payments: splitPayment ? payments : [{
          method: paymentMethod,
          value: target,
          installments: paymentMethod === "credit" ? parseInt(installments) : 1,
        }],
        change: paymentMethod === "cash" ? calculateChange() : 0,
        registration_type: "operator_recorded",
      };
      const problem=validatePaymentLines(paymentRules,paymentDetails.payments,total);
      if (problem) throw new Error(problem);
      const paidNow=paymentDetails.payments.reduce((sum:number,p:{value:number})=>sum+p.value,0);
      if (paidNow+0.005<requiredPayment) {
        throw new Error("O sinal mínimo configurado é R$ "+requiredPayment.toFixed(2)+".");
      }
      await onPaymentComplete(paymentDetails);
    } catch (error) {
      toast({
        title: "Operação não concluída",
        description: error instanceof Error ? error.message : "Não foi possível salvar no banco.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const isPaymentComplete = (): boolean => {
    if (!splitPayment) return validTarget && target+0.005>=requiredPayment && isMethodEnabled(paymentRules,paymentMethod) &&
      (paymentMethod !== "credit" || allowedInstallments.includes(Number(installments))) &&
      (paymentMethod !== "cash" || Number(receivedAmount) >= target);
    const amount = getTotalPaid();
    return amount + 0.005 >= requiredPayment && amount <= total && !validatePaymentLines(paymentRules,payments,total);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onClose()}>
      <DialogContent className="sm:max-w-[590px] max-h-[90vh] overflow-y-auto rounded-xl border-border">
        <DialogHeader>
          <DialogTitle className="text-xl text-marsala-800">Finalização da locação</DialogTitle>
        </DialogHeader>
        
        <div className="my-2">
          {rulesLoading && <p role="status" className="mb-3 text-sm">Carregando regras financeiras do sistema...</p>}
          {rulesError && <p role="alert" className="mb-3 rounded border border-red-200 p-3 text-sm text-red-700">{rulesError}</p>}
          {!rulesLoading && !rulesError && paymentMethods.length===0 && <p role="alert" className="mb-3 text-sm text-red-700">Nenhum método de pagamento está habilitado.</p>}
          <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-md mb-4">
            <span>Total do contrato:</span>
            <span className="font-bold text-xl text-marsala-800">R$ {total.toFixed(2)}</span>
          </div>
          
          {customer && (
            <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-900 rounded-md text-sm">
              <p><strong>Cliente:</strong> {customer.name}</p>
              {customer.document && <p><strong>Documento:</strong> {customer.document}</p>}
            </div>
          )}
          
          {!splitPayment && <div className="mb-5 space-y-3">
            <h3 className="text-sm font-semibold">Valor a registrar agora</h3>
            <div className="grid gap-2 sm:grid-cols-3">
              {([
                ["half","Sinal mínimo configurado",half],
                ["full","Pagamento integral",total],
                ["custom","Outro valor",Number(customAmount)||0],
              ] as const).map(([mode,label,value])=><button key={mode} type="button"
                onClick={()=>setReceiptMode(mode)}
                className={"rounded-xl border p-3 text-left text-xs transition-colors "+
                  (receiptMode===mode?"border-marsala-700 bg-marsala-50 text-marsala-800":"border-border hover:bg-muted")}>
                <strong className="block">{label}</strong>
                <span className="mt-1 block">{mode==="custom"&&!customAmount?"Definir valor":
                  new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(value)}</span>
              </button>)}
            </div>
            {receiptMode==="custom"&&<div className="space-y-1">
              <Label htmlFor="custom-receipt">Valor recebido (R$)</Label>
              <Input id="custom-receipt" type="number" min=".01" max={total} step=".01"
                value={customAmount} onChange={e=>setCustomAmount(e.target.value)}/>
            </div>}
            <p className="text-xs text-muted-foreground">O saldo não recebido permanece em aberto no contrato. Sinal mínimo: R$ {requiredPayment.toFixed(2)}.</p>
          </div>}
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
                <TabsList className="grid grid-cols-2 sm:grid-cols-4">
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
                        min={target}
                        placeholder="0.00" 
                        value={receivedAmount}
                        onChange={(e) => setReceivedAmount(e.target.value)}
                      />
                    </div>
                    
                    {parseFloat(receivedAmount) >= target && (
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
                        {allowedInstallments.map(n=><option value={n} key={n}>{n===1?"À vista":n+"x"}</option>)}
                      </select>
                    </div>
                    
                    {parseInt(installments) > 1 && (
                      <div className="bg-marsala-50 p-3 rounded-md">
                        <p className="font-medium">Valor da parcela:</p>
                        <p className="text-xl font-bold">
                          {parseInt(installments)}x de R$ {(target / parseInt(installments)).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="debit" className="mt-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <p>Confirme a cobrança na maquininha; o sistema só registra o resultado manualmente.</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="pix" className="mt-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <div className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-md mb-3">
                      <Plug className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-center text-gray-500">
                        Confirme o Pix no extrato da loja antes de registrar; não há integração bancária nesta tela.
                      </p>
                    </div>
                    <p className="text-sm">Registro manual: confira o comprovante externo antes de confirmar.</p>
                  </div>
                </TabsContent>
                

              </Tabs>
            </>
          ) : (
            // Split payment method
            <div className="space-y-4">
              <div className="grid gap-2">
                <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
                  <TabsList className="grid grid-cols-2 sm:grid-cols-4">
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
                  
                  <div className="flex justify-between items-center p-3 bg-marsala-50 rounded-md mt-3">
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
        
        <div className="my-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
          <Checkbox id="manual-payment-checked" checked={paymentConfirmed} onCheckedChange={(value) => setPaymentConfirmed(value === true)} />
          <Label htmlFor="manual-payment-checked" className="text-xs leading-relaxed">
            Confirmo que conferi o recebimento na maquininha, dinheiro ou extrato.
            O sistema registra manualmente o pagamento e não executa cobranças. Dinheiro exige caixa aberto.
          </Label>
        </div>
        <div className="mb-4 rounded-xl border border-marsala-100 bg-marsala-50/60 p-3 text-sm">
          <div className="flex justify-between gap-2">
            <span>Recebimento neste atendimento</span>
            <strong>{new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"})
              .format(splitPayment?getTotalPaid():Number.isFinite(target)?target:0)}</strong>
          </div>
          <div className="mt-2 flex justify-between gap-2 text-marsala-800">
            <span>Saldo restante do contrato</span>
            <strong>{new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"})
              .format(Math.max(0,total-(splitPayment?getTotalPaid():Number.isFinite(target)?target:0)))}</strong>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button 
            onClick={handleFinishPayment} 
            disabled={isProcessing || !paymentConfirmed || !isPaymentComplete() || !customer}
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
              "Registrar recebimento e contrato"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PDVPaymentModal;
