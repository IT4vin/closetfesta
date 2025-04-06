
import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

const CurrentBalanceCard = () => {
  return (
    <Card className="col-span-1 shadow-md">
      <CardHeader>
        <CardTitle>Saldo Atual</CardTitle>
        <CardDescription>Posição financeira atual</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-marsala">R$ 52.450,00</div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500">Última atualização:</span>
            <span className="text-sm">05/04/2025 09:30</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500">Banco principal:</span>
            <span className="text-sm">Banco XYZ</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500">Contas bancárias:</span>
            <span className="text-sm">3</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentBalanceCard;
