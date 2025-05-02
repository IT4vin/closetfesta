
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, FileText, Calendar, Filter, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PDVReports = () => {
  const [dateRange, setDateRange] = useState("today");
  const [reportType, setReportType] = useState("sales");

  // Mock data for sales by payment method
  const paymentMethodData = [
    { name: "Dinheiro", value: 4500 },
    { name: "Cartão de Crédito", value: 12000 },
    { name: "Cartão de Débito", value: 8500 },
    { name: "PIX", value: 9500 },
    { name: "Crediário", value: 3500 },
  ];
  
  // Colors for pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  // Mock data for sales by day
  const dailySalesData = [
    { name: "Seg", value: 3200 },
    { name: "Ter", value: 4500 },
    { name: "Qua", value: 3800 },
    { name: "Qui", value: 4200 },
    { name: "Sex", value: 5800 },
    { name: "Sáb", value: 7500 },
    { name: "Dom", value: 2800 },
  ];

  // Mock data for sales by hour
  const hourlySalesData = [
    { name: "08h", value: 1200 },
    { name: "09h", value: 1800 },
    { name: "10h", value: 2400 },
    { name: "11h", value: 3100 },
    { name: "12h", value: 2600 },
    { name: "13h", value: 2100 },
    { name: "14h", value: 2800 },
    { name: "15h", value: 3300 },
    { name: "16h", value: 3900 },
    { name: "17h", value: 4200 },
    { name: "18h", value: 3600 },
    { name: "19h", value: 2800 },
    { name: "20h", value: 1900 },
  ];

  // Mock transaction data
  const transactionData = [
    {
      id: "1",
      date: "2025-05-02",
      time: "10:45",
      total: 175.90,
      items: 5,
      payment: "Cartão de Crédito",
      operator: "Ana Silva",
      customer: "João Pereira"
    },
    {
      id: "2",
      date: "2025-05-02",
      time: "11:22",
      total: 89.50,
      items: 2,
      payment: "Dinheiro",
      operator: "Carlos Mendes",
      customer: "Maria Oliveira"
    },
    {
      id: "3",
      date: "2025-05-02",
      time: "12:15",
      total: 324.75,
      items: 8,
      payment: "PIX",
      operator: "Ana Silva",
      customer: "Pedro Santos"
    },
    {
      id: "4",
      date: "2025-05-02",
      time: "13:40",
      total: 152.00,
      items: 4,
      payment: "Cartão de Débito",
      operator: "Carlos Mendes",
      customer: "Ana Costa"
    },
    {
      id: "5",
      date: "2025-05-02",
      time: "14:55",
      total: 78.25,
      items: 3,
      payment: "PIX",
      operator: "Ana Silva",
      customer: "Roberto Almeida"
    },
    {
      id: "6",
      date: "2025-05-02",
      time: "16:10",
      total: 215.30,
      items: 6,
      payment: "Cartão de Crédito",
      operator: "Carlos Mendes",
      customer: "Julia Fernandes"
    },
    {
      id: "7",
      date: "2025-05-02",
      time: "17:25",
      total: 65.90,
      items: 2,
      payment: "Dinheiro",
      operator: "Ana Silva",
      customer: "Lucas Martins"
    },
  ];

  // Calculate total sales
  const totalSales = paymentMethodData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-8">
      {/* Report controls */}
      <div className="flex flex-col md:flex-row md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar size={16} className="mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="thisWeek">Esta semana</SelectItem>
              <SelectItem value="lastWeek">Semana passada</SelectItem>
              <SelectItem value="thisMonth">Este mês</SelectItem>
              <SelectItem value="lastMonth">Mês passado</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Filter size={16} />
            <span>Filtros</span>
            <ChevronDown size={14} />
          </Button>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-marsala hover:bg-marsala-700">
              <Download size={16} className="mr-2" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <FileText size={14} className="mr-2" /> PDF
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText size={14} className="mr-2" /> Excel
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Calendar size={14} className="mr-2" /> Programar relatório
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de vendas</CardDescription>
            <CardTitle className="text-2xl">R$ {totalSales.toLocaleString('pt-BR')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-600">+12% em relação à semana passada</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ticket médio</CardDescription>
            <CardTitle className="text-2xl">R$ 158,53</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-600">+3.5% em relação à semana passada</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de transações</CardDescription>
            <CardTitle className="text-2xl">243</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-600">+8% em relação à semana passada</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Itens vendidos</CardDescription>
            <CardTitle className="text-2xl">782</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-600">+15% em relação à semana passada</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="sales" onValueChange={setReportType} className="space-y-6">
        <TabsList>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="operators">Operadores</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Vendas por forma de pagamento</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`R$ ${value}`, 'Valor']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Vendas por dia da semana</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dailySalesData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`R$ ${value}`, 'Vendas']} />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Vendas por hora do dia</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hourlySalesData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`R$ ${value}`, 'Vendas']} />
                    <Bar dataKey="value" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Transações recentes</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead>Cliente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionData.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">#{transaction.id}</TableCell>
                      <TableCell>{new Date(transaction.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{transaction.time}</TableCell>
                      <TableCell>R$ {transaction.total.toFixed(2)}</TableCell>
                      <TableCell>{transaction.items}</TableCell>
                      <TableCell>{transaction.payment}</TableCell>
                      <TableCell>{transaction.operator}</TableCell>
                      <TableCell>{transaction.customer}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                Carregar mais
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Produtos</CardTitle>
              <CardDescription>
                Análise detalhada de vendas por produto, categoria e desempenho
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">
                  Selecione filtros específicos para visualizar relatórios de produtos
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="operators">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Operadores</CardTitle>
              <CardDescription>
                Desempenho dos operadores, vendas realizadas e atividades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">
                  Selecione filtros específicos para visualizar relatórios de operadores
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Clientes</CardTitle>
              <CardDescription>
                Análise de compras por cliente, frequência e ticket médio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">
                  Selecione filtros específicos para visualizar relatórios de clientes
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PDVReports;
