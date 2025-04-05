
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const CashFlow = () => {
  const [timeRange, setTimeRange] = useState("month");
  
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

  // Projection data
  const projectionData = [
    { month: 'Abr', esperado: 65000, realizado: 42000 },
    { month: 'Mai', esperado: 70000, realizado: 0 },
    { month: 'Jun', esperado: 75000, realizado: 0 },
    { month: 'Jul', esperado: 80000, realizado: 0 },
    { month: 'Ago', esperado: 85000, realizado: 0 },
    { month: 'Set', esperado: 90000, realizado: 0 },
  ];

  // Monthly flow
  const monthlyFlow = [
    { month: 'Jan', receita: 52000, despesa: 35000, resultado: 17000 },
    { month: 'Fev', receita: 58000, despesa: 38000, resultado: 20000 },
    { month: 'Mar', receita: 61000, despesa: 36000, resultado: 25000 },
    { month: 'Abr', receita: 65000, despesa: 42000, resultado: 23000 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Fluxo de Caixa</h2>
        <div className="flex gap-2">
          <Select 
            value={timeRange}
            onValueChange={(value) => setTimeRange(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
              <SelectItem value="quarter">Último Trimestre</SelectItem>
              <SelectItem value="year">Último Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
      </div>

      <Tabs defaultValue="projection" className="w-full">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="projection">Projeção Financeira</TabsTrigger>
          <TabsTrigger value="history">Histórico Consolidado</TabsTrigger>
        </TabsList>

        <TabsContent value="projection" className="mt-6">
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
        </TabsContent>

        <TabsContent value="history" className="mt-6">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CashFlow;
