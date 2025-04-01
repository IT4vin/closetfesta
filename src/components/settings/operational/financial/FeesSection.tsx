
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PiggyBank } from "lucide-react";

const FeesSection = () => {
  const [lateFeePercentage, setLateFeePercentage] = useState(10);
  
  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <PiggyBank size={18} className="mr-2" />
        Configuração de Multas e Taxas
      </h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="late-fee">Percentual de multa por atraso (%)</Label>
          <div className="flex items-center gap-2">
            <Input 
              id="late-fee"
              type="number"
              min="0"
              max="100"
              value={lateFeePercentage}
              onChange={(e) => setLateFeePercentage(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-500">% do valor do aluguel por dia</span>
          </div>
        </div>
        
        <div className="pt-2 pb-2 border-t border-b">
          <div className="text-sm text-gray-500 mt-2 mb-3">
            <strong>Exemplo:</strong> Para um vestido com aluguel de R$ 500,00, a multa por atraso seria de R$ {((500 * lateFeePercentage) / 100).toFixed(2)} por dia.
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cleaning-fee">Taxa de limpeza padrão (R$)</Label>
          <Input 
            id="cleaning-fee"
            type="number"
            min="0"
            defaultValue="50"
            className="w-full"
          />
          <p className="text-sm text-gray-500">Valor cobrado pela limpeza do vestido após devolução</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="damage-fee">Percentual para danos (%)</Label>
          <div className="flex items-center gap-2">
            <Input 
              id="damage-fee"
              type="number"
              min="0"
              max="100"
              defaultValue="30"
              className="w-24"
            />
            <span className="text-sm text-gray-500">% do valor do vestido</span>
          </div>
          <p className="text-sm text-gray-500">Porcentagem cobrada em caso de danos ao vestido</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="deposit">Caução padrão (R$)</Label>
          <Input 
            id="deposit"
            type="number"
            min="0"
            defaultValue="200"
            className="w-full"
          />
          <p className="text-sm text-gray-500">Valor retido como caução e devolvido na entrega do vestido em perfeito estado</p>
        </div>
      </div>
    </div>
  );
};

export default FeesSection;
