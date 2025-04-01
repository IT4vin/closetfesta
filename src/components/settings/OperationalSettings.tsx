
import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DollarSign, Calendar } from "lucide-react";
import FinancialSettings from "./operational/FinancialSettings";
import SchedulingSettings from "./operational/SchedulingSettings";

const OperationalSettings = () => {
  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle>Configurações Operacionais</CardTitle>
        <CardDescription>
          Defina os parâmetros operacionais do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="financial" className="w-full">
          <TabsList className="mb-6 grid grid-cols-2">
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <DollarSign size={16} />
              Financeiro
            </TabsTrigger>
            <TabsTrigger value="scheduling" className="flex items-center gap-2">
              <Calendar size={16} />
              Agendamento
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="financial" className="space-y-6">
            <FinancialSettings />
          </TabsContent>
          
          <TabsContent value="scheduling" className="space-y-6">
            <SchedulingSettings />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default OperationalSettings;
