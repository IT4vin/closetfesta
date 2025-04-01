
import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus, Wallet, QrCode, Building, DollarSign } from "lucide-react";

const PaymentMethodsSection = () => {
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, method: "Cartão de Crédito", enabled: true },
    { id: 2, method: "Cartão de Débito", enabled: true },
    { id: 3, method: "Dinheiro", enabled: true },
    { id: 4, method: "Pix", enabled: true },
    { id: 5, method: "Transferência Bancária", enabled: false },
  ]);
  
  const handleTogglePaymentMethod = (id: number) => {
    setPaymentMethods(methods => 
      methods.map(method => 
        method.id === id ? { ...method, enabled: !method.enabled } : method
      )
    );
  };
  
  const PaymentMethodIcon = ({ method }: { method: string }) => {
    switch (method) {
      case "Cartão de Crédito":
        return <CreditCard size={18} />;
      case "Cartão de Débito":
        return <CreditCard size={18} />;
      case "Dinheiro":
        return <Wallet size={18} />;
      case "Pix":
        return <QrCode size={18} />;
      case "Transferência Bancária":
        return <Building size={18} />;
      default:
        return <DollarSign size={18} />;
    }
  };
  
  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <CreditCard size={18} className="mr-2" />
        Formas de Pagamento
      </h3>
      
      <div className="space-y-4">
        {paymentMethods.map((method) => (
          <div key={method.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PaymentMethodIcon method={method.method} />
              <span>{method.method}</span>
            </div>
            <Switch 
              checked={method.enabled}
              onCheckedChange={() => handleTogglePaymentMethod(method.id)}
            />
          </div>
        ))}
        
        <Button variant="outline" className="w-full mt-4">
          <Plus size={16} className="mr-2" />
          Adicionar Nova Forma de Pagamento
        </Button>
      </div>
    </div>
  );
};

export default PaymentMethodsSection;
