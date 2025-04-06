
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

// Revenue chart component
const RevenueChart = () => {
  // Mock data for revenue chart
  const revenueData = [
    { name: 'Jan', alugueis: 4000, vendas: 2400 },
    { name: 'Fev', alugueis: 3000, vendas: 1398 },
    { name: 'Mar', alugueis: 5000, vendas: 3800 },
    { name: 'Abr', alugueis: 2780, vendas: 3908 },
    { name: 'Mai', alugueis: 4890, vendas: 4800 },
    { name: 'Jun', alugueis: 3390, vendas: 3800 },
  ];

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Receita: Aluguéis vs Vendas</CardTitle>
        <CardDescription>
          Comparativo de receita entre aluguéis e vendas dos últimos 6 meses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={revenueData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`R$ ${value}`, '']} />
              <Legend />
              <Bar dataKey="alugueis" name="Receita de Aluguéis" fill="#be123c" />
              <Bar dataKey="vendas" name="Receita de Vendas" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
