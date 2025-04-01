
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building } from "lucide-react";

const BankDetailsSection = () => {
  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <Building size={18} className="mr-2" />
        Dados Bancários
      </h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bank-name">Banco</Label>
          <Input 
            id="bank-name"
            placeholder="Nome do banco"
            defaultValue="Banco do Brasil"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="agency">Agência</Label>
            <Input 
              id="agency"
              placeholder="Número da agência"
              defaultValue="1234"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="account">Conta</Label>
            <Input 
              id="account"
              placeholder="Número da conta"
              defaultValue="56789-0"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="account-holder">Titular</Label>
          <Input 
            id="account-holder"
            placeholder="Nome do titular da conta"
            defaultValue="Empresa de Vestidos Ltda."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input 
            id="cnpj"
            placeholder="CNPJ da empresa"
            defaultValue="12.345.678/0001-90"
          />
        </div>
      </div>
    </div>
  );
};

export default BankDetailsSection;
