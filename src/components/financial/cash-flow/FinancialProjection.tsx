
import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const FinancialProjection = () => {
  // Projection data
  const projectionData = [
    { month: 'Abr', esperado: 65000, realizado: 42000 },
    { month: 'Mai', esperado: 70000, realizado: 0 },
    { month: 'Jun', esperado: 75000, realizado: 0 },
    { month: 'Jul', esperado: 80000, realizado: 0 },
    { month: 'Ago', esperado: 85000, realizado: 0 },
    { month: 'Set', esperado: 90000, realizado: 0 },
  ];

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Projeção Financeira</CardTitle>
        <CardDescription>
          Valores esperados vs. realizados para os próximos meses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`R$ ${value}`, '']} />
              <Legend />
              <Bar 
                dataKey="esperado" 
                fill="#3b82f6" 
                name="Valor Esperado"
                radius={[4, 4, 0, 0]} 
              />
              <Bar 
                dataKey="realizado" 
                fill="#be123c" 
                name="Valor Realizado" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4">
          <p className="text-sm text-neutral-500">
            * A projeção financeira é baseada no histórico de faturamento e nos contratos já firmados para os próximos períodos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialProjection;
