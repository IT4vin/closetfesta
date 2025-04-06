
import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Expense breakdown component
const ExpenseBreakdown = () => {
  // Mock data for expense categories
  const expenseData = [
    { name: 'Aluguel', value: 5000 },
    { name: 'Salários', value: 8000 },
    { name: 'Marketing', value: 3000 },
    { name: 'Manutenção', value: 1500 },
    { name: 'Outros', value: 2500 },
  ];

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FF8042', '#BE123C', '#8884d8'];

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Distribuição de Despesas</CardTitle>
        <CardDescription>
          Divisão das principais categorias de despesas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseData}
                innerRadius={60}
                outerRadius={120}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`R$ ${value}`, 'Valor']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseBreakdown;
