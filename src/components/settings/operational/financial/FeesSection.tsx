
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DollarSign, PiggyBank } from "lucide-react";

const FeesSection = () => {
  const [taxSettings, setTaxSettings] = useState({
    useTax: true,
    taxRate: 5.5,
    useCleaningFee: true,
    cleaningFee: 50,
  });

  const handleTaxChange = (field: string, value: boolean | number) => {
    setTaxSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <DollarSign size={18} className="mr-2" />
        Taxas e Valores
      </h3>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="useTax" className="font-medium">Taxa de Serviço</Label>
              <p className="text-sm text-gray-500">Aplicar taxa de serviço aos aluguéis</p>
            </div>
            <Switch 
              id="useTax"
              checked={taxSettings.useTax}
              onCheckedChange={(checked) => 
                handleTaxChange('useTax', checked)
              }
            />
          </div>
          
          {taxSettings.useTax && (
            <div className="pl-6 border-l-2 border-gray-100">
              <Label htmlFor="taxRate">Porcentagem da Taxa (%)</Label>
              <div className="flex items-center mt-1">
                <Input 
                  id="taxRate"
                  type="number"
                  min="0"
                  step="0.5"
                  value={taxSettings.taxRate}
                  onChange={(e) => 
                    handleTaxChange('taxRate', parseFloat(e.target.value))
                  }
                  className="w-24"
                />
                <span className="ml-2">%</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="useCleaningFee" className="font-medium">Taxa de Limpeza</Label>
              <p className="text-sm text-gray-500">Aplicar taxa para limpeza do produto</p>
            </div>
            <Switch 
              id="useCleaningFee"
              checked={taxSettings.useCleaningFee}
              onCheckedChange={(checked) => 
                handleTaxChange('useCleaningFee', checked)
              }
            />
          </div>
          
          {taxSettings.useCleaningFee && (
            <div className="pl-6 border-l-2 border-gray-100">
              <Label htmlFor="cleaningFee">Valor da Taxa (R$)</Label>
              <div className="flex items-center mt-1">
                <span className="mr-2">R$</span>
                <Input 
                  id="cleaningFee"
                  type="number"
                  min="0"
                  step="5"
                  value={taxSettings.cleaningFee}
                  onChange={(e) => 
                    handleTaxChange('cleaningFee', parseFloat(e.target.value))
                  }
                  className="w-24"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center">
              <PiggyBank size={18} className="mr-2 text-green-600" />
              <span className="font-medium">Valor Total</span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Aluguel + Taxas</div>
              <div className="font-semibold">
                R$ 500,00
                {taxSettings.useTax && <span className="text-sm text-gray-500 ml-1">+ {taxSettings.taxRate}%</span>}
                {taxSettings.useCleaningFee && <span className="text-sm text-gray-500 ml-1">+ R$ {taxSettings.cleaningFee}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeesSection;
