
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
  ResponsiveContainer,
  Line
} from 'recharts';
import { ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const MonthlyFlowChart = () => {
  // Monthly flow
  const monthlyFlow = [
    { month: 'Jan', receita: 52000, despesa: 35000, resultado: 17000 },
    { month: 'Fev', receita: 58000, despesa: 38000, resultado: 20000 },
    { month: 'Mar', receita: 61000, despesa: 36000, resultado: 25000 },
    { month: 'Abr', receita: 65000, despesa: 42000, resultado: 23000 },
  ];

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Histórico Consolidado</CardTitle>
        <CardDescription>
          Fluxo de caixa consolidado por mês
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyFlow}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`R$ ${value}`, '']} />
              <Legend />
              <Bar dataKey="receita" name="Receita" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesa" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Line 
                type="monotone" 
                dataKey="resultado" 
                stroke="#be123c" 
                strokeWidth={2}
                name="Resultado"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-center">
          <Button variant="outline" className="flex items-center">
            <ArrowDownUp size={16} className="mr-2" />
            Visualizar transações detalhadas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyFlowChart;
