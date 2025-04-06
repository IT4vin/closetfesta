
import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Line
} from 'recharts';

const CashFlowChart = () => {
  // Mock data for cash flow
  const cashFlowData = [
    { date: '01/04', entrada: 2500, saida: 1800, saldo: 700 },
    { date: '02/04', entrada: 1800, saida: 1200, saldo: 1300 },
    { date: '03/04', entrada: 3200, saida: 2800, saldo: 1700 },
    { date: '04/04', entrada: 2300, saida: 1500, saldo: 2500 },
    { date: '05/04', entrada: 1900, saida: 2200, saldo: 2200 },
    { date: '06/04', entrada: 0, saida: 500, saldo: 1700 },
    { date: '07/04', entrada: 3400, saida: 1800, saldo: 3300 },
    { date: '08/04', entrada: 2800, saida: 1600, saldo: 4500 },
    { date: '09/04', entrada: 1500, saida: 2100, saldo: 3900 },
    { date: '10/04', entrada: 2700, saida: 1900, saldo: 4700 },
    { date: '11/04', entrada: 3100, saida: 2500, saldo: 5300 },
    { date: '12/04', entrada: 2200, saida: 3200, saldo: 4300 },
    { date: '13/04', entrada: 1800, saida: 1400, saldo: 4700 },
    { date: '14/04', entrada: 2400, saida: 2000, saldo: 5100 },
  ];

  return (
    <Card className="col-span-1 lg:col-span-2 shadow-md">
      <CardHeader>
        <CardTitle>Entradas e Saídas</CardTitle>
        <CardDescription>Fluxo de caixa diário dos últimos 14 dias</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={cashFlowData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`R$ ${value}`, '']} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="entrada" 
                stackId="1"
                stroke="#22c55e" 
                fill="#22c55e"
                fillOpacity={0.6} 
                name="Entradas"
              />
              <Area 
                type="monotone" 
                dataKey="saida" 
                stackId="2"
                stroke="#ef4444" 
                fill="#ef4444"
                fillOpacity={0.6}
                name="Saídas"
              />
              <Line 
                type="monotone" 
                dataKey="saldo" 
                stroke="#be123c" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Saldo"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="text-sm text-neutral-500">Total Entradas</div>
            <div className="font-semibold text-green-600">R$ 32.100,00</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-lg">
            <div className="text-sm text-neutral-500">Total Saídas</div>
            <div className="font-semibold text-red-600">R$ 25.500,00</div>
          </div>
          <div className="text-center p-2 bg-marsala-50 rounded-lg">
            <div className="text-sm text-neutral-500">Saldo Período</div>
            <div className="font-semibold text-marsala">R$ 6.600,00</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CashFlowChart;
