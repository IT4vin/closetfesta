
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
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CreditCard,
  ArrowUp,
  ArrowDown
} from "lucide-react";

const FinancialDashboard = () => {
  const [timeRange, setTimeRange] = useState("month");

  // Mock data for revenue chart
  const revenueData = [
    { name: 'Jan', alugueis: 4000, vendas: 2400 },
    { name: 'Fev', alugueis: 3000, vendas: 1398 },
    { name: 'Mar', alugueis: 5000, vendas: 3800 },
    { name: 'Abr', alugueis: 2780, vendas: 3908 },
    { name: 'Mai', alugueis: 4890, vendas: 4800 },
    { name: 'Jun', alugueis: 3390, vendas: 3800 },
  ];

  // Mock data for expense categories
  const expenseData = [
    { name: 'Aluguel', value: 5000 },
    { name: 'Salários', value: 8000 },
    { name: 'Marketing', value: 3000 },
    { name: 'Manutenção', value: 1500 },
    { name: 'Outros', value: 2500 },
  ];

  // Mock data for financial metrics
  const financialMetrics = [
    {
      title: "Receita Total",
      value: "R$ 38.520,00",
      change: 8.5,
      icon: <DollarSign className="text-white" size={20} />,
      color: "bg-green-500"
    },
    {
      title: "Despesas Totais",
      value: "R$ 20.145,00",
      change: -3.2,
      icon: <TrendingDown className="text-white" size={20} />,
      color: "bg-red-500"
    },
    {
      title: "Lucro Líquido",
      value: "R$ 18.375,00",
      change: 12.4,
      icon: <TrendingUp className="text-white" size={20} />,
      color: "bg-marsala"
    },
    {
      title: "Ticket Médio",
      value: "R$ 245,30",
      change: 5.7,
      icon: <CreditCard className="text-white" size={20} />,
      color: "bg-blue-500"
    }
  ];

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FF8042', '#BE123C', '#8884d8'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Dashboard Financeiro</h2>
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
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {financialMetrics.map((metric, index) => (
          <Card key={index} className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg ${metric.color} flex items-center justify-center`}>
                  {metric.icon}
                </div>
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${metric.change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {metric.change >= 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                  <span>{Math.abs(metric.change)}%</span>
                </div>
              </div>
              <h3 className="text-gray-500 text-sm mb-1">{metric.title}</h3>
              <p className="text-2xl font-semibold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
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

      {/* Expense Breakdown */}
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

      {/* Upcoming Financial Events */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Próximos Eventos Financeiros</CardTitle>
          <CardDescription>
            Pagamentos e recebimentos previstos para os próximos dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { 
                title: "Pagamento de Aluguel", 
                value: "R$ 5.000,00", 
                date: "15/04/2025", 
                type: "expense",
                daysLeft: 3
              },
              { 
                title: "Recebimento Cliente #1542", 
                value: "R$ 3.200,00", 
                date: "16/04/2025", 
                type: "income",
                daysLeft: 4
              },
              { 
                title: "Folha de Pagamento", 
                value: "R$ 8.500,00", 
                date: "30/04/2025", 
                type: "expense",
                daysLeft: 18
              },
              { 
                title: "Recebimento Cliente #1498", 
                value: "R$ 1.800,00", 
                date: "05/05/2025", 
                type: "income",
                daysLeft: 23
              },
            ].map((event, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${event.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {event.type === 'income' ? 
                      <ArrowUp size={18} className="text-green-600" /> : 
                      <ArrowDown size={18} className="text-red-600" />
                    }
                  </div>
                  <div>
                    <h4 className="font-medium">{event.title}</h4>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar size={14} className="mr-1" />
                      {event.date}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${event.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {event.type === 'income' ? '+' : '-'}{event.value}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 justify-end">
                    <Clock size={14} className="mr-1" />
                    <span>Em {event.daysLeft} dias</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialDashboard;
