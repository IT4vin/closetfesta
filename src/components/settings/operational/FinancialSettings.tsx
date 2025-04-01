
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  DollarSign, 
  Plus, 
  CreditCard, 
  Building, 
  Wallet, 
  QrCode, 
  PiggyBank 
} from "lucide-react";
import FeesSection from "./financial/FeesSection";
import PaymentMethodsSection from "./financial/PaymentMethodsSection";
import BankDetailsSection from "./financial/BankDetailsSection";

const FinancialSettings = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        <FeesSection />
        <PaymentMethodsSection />
        <BankDetailsSection />
      </div>
    </div>
  );
};

export default FinancialSettings;
