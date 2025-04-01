
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  DollarSign, 
  Plus, 
  Trash, 
  CreditCard, 
  Building, 
  Wallet, 
  QrCode 
} from "lucide-react";

const PaymentMethodsSection = () => {
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, name: "Cartão de Crédito", enabled: true, installments: true, maxInstallments: 3 },
    { id: 2, name: "Dinheiro", enabled: true, installments: false },
    { id: 3, name: "Pix", enabled: true, installments: false },
    { id: 4, name: "Transferência Bancária", enabled: false, installments: false }
  ]);

  const PaymentMethodIcon = ({ method }: { method: string }) => {
    switch (method) {
      case "Cartão de Crédito":
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

  const togglePaymentMethod = (id: number, field: string, value: boolean | number) => {
    setPaymentMethods(prevMethods => 
      prevMethods.map(method => 
        method.id === id ? { ...method, [field]: value } : method
      )
    );
  };

  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <CreditCard size={18} className="mr-2" />
        Métodos de Pagamento
      </h3>
      
      <div className="space-y-4">
        {paymentMethods.map(method => (
          <div key={method.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <PaymentMethodIcon method={method.name} />
                <span className="ml-2 font-medium">{method.name}</span>
              </div>
              <Switch 
                checked={method.enabled}
                onCheckedChange={(checked) => 
                  togglePaymentMethod(method.id, 'enabled', checked)
                }
              />
            </div>
            
            {method.installments && method.enabled && (
              <div className="pl-6 mt-3 border-t pt-3">
                <Label htmlFor={`installment-${method.id}`}>Máximo de Parcelas</Label>
                <Input 
                  id={`installment-${method.id}`}
                  type="number"
                  min="1"
                  max="12"
                  value={method.maxInstallments}
                  onChange={(e) => 
                    togglePaymentMethod(method.id, 'maxInstallments', parseInt(e.target.value))
                  }
                  className="w-20 mt-1"
                />
              </div>
            )}
          </div>
        ))}
        
        <Button variant="outline" className="w-full">
          <Plus size={16} className="mr-2" />
          Adicionar Método de Pagamento
        </Button>
      </div>
    </div>
  );
};

export default PaymentMethodsSection;
