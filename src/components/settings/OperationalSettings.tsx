
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Building, 
  Calendar, 
  DollarSign, 
  CreditCard,
  Clock,
  Store
} from "lucide-react";

import SchedulingSettings from "./operational/SchedulingSettings";
import FinancialSettings from "./operational/FinancialSettings";
import StoreSettings from "./operational/StoreSettings";

const OperationalSettings = () => {
  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle>Configurações Operacionais</CardTitle>
        <CardDescription>
          Configure os aspectos operacionais do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="store" className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Store size={16} />
              Dados da Loja
            </TabsTrigger>
            <TabsTrigger value="scheduling" className="flex items-center gap-2">
              <Calendar size={16} />
              Agendamento
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <DollarSign size={16} />
              Financeiro
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="store" className="space-y-6">
            <StoreSettings />
          </TabsContent>
          
          <TabsContent value="scheduling" className="space-y-6">
            <SchedulingSettings />
          </TabsContent>
          
          <TabsContent value="financial" className="space-y-6">
            <FinancialSettings />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default OperationalSettings;
