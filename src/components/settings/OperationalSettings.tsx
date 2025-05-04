
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
              <span className="hidden sm:inline">Dados da Loja</span>
              <span className="sm:hidden">Loja</span>
            </TabsTrigger>
            <TabsTrigger value="scheduling" className="flex items-center gap-2">
              <Calendar size={16} />
              <span className="hidden sm:inline">Agendamento</span>
              <span className="sm:hidden">Agenda</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <DollarSign size={16} />
              <span className="hidden sm:inline">Financeiro</span>
              <span className="sm:hidden">Financ.</span>
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="max-h-[600px]">
            <TabsContent value="store" className="space-y-6 pr-2">
              <StoreSettings />
            </TabsContent>
            
            <TabsContent value="scheduling" className="space-y-6 pr-2">
              <SchedulingSettings />
            </TabsContent>
            
            <TabsContent value="financial" className="space-y-6 pr-2">
              <FinancialSettings />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default OperationalSettings;
