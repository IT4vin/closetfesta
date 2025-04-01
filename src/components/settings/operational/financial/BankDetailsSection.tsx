
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building } from "lucide-react";

const BankDetailsSection = () => {
  const [bankDetails, setBankDetails] = useState({
    bankName: "Banco do Brasil",
    accountType: "Corrente",
    agency: "1234",
    account: "56789-0",
    pixKey: "examplo@email.com"
  });

  const handleBankDetailChange = (field: string, value: string) => {
    setBankDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <Building size={18} className="mr-2" />
        Dados Bancários
      </h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="bankName">Nome do Banco</Label>
          <Input 
            id="bankName"
            value={bankDetails.bankName}
            onChange={(e) => 
              handleBankDetailChange('bankName', e.target.value)
            }
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="accountType">Tipo de Conta</Label>
          <Input 
            id="accountType"
            value={bankDetails.accountType}
            onChange={(e) => 
              handleBankDetailChange('accountType', e.target.value)
            }
            className="mt-1"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="agency">Agência</Label>
            <Input 
              id="agency"
              value={bankDetails.agency}
              onChange={(e) => 
                handleBankDetailChange('agency', e.target.value)
              }
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="account">Conta</Label>
            <Input 
              id="account"
              value={bankDetails.account}
              onChange={(e) => 
                handleBankDetailChange('account', e.target.value)
              }
              className="mt-1"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="pixKey">Chave Pix</Label>
          <Input 
            id="pixKey"
            value={bankDetails.pixKey}
            onChange={(e) => 
              handleBankDetailChange('pixKey', e.target.value)
            }
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
};

export default BankDetailsSection;
