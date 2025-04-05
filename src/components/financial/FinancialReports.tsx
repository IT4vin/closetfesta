
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
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Download,
  FileBarChart,
  ArrowDownToLine,
  Printer,
  Mail
} from "lucide-react";

const FinancialReports = () => {
  const [timeRange, setTimeRange] = useState("month");
  const [reportType, setReportType] = useState("revenue");
  
  // Mock data for revenue report
  const revenueData = [
    { month: 'Jan', alugueis: 42500, vendas: 15800, total: 58300 },
    { month: 'Fev', alugueis: 38200, vendas: 19600, total: 57800 },
    { month: 'Mar', alugueis: 45100, vendas: 16200, total: 61300 },
    { month: 'Abr', alugueis: 48500, vendas: 17800, total: 66300 },
  ];
  
  // Mock data for expense report
  const expenseData = [
    { month: 'Jan', operacional: 18500, produtos: 12800, marketing: 4200, total: 35500 },
    { month: 'Fev', operacional: 19200, produtos: 14000, marketing: 4800, total: 38000 },
    { month: 'Mar', operacional: 18800, produtos: 12500, marketing: 4700, total: 36000 },
    { month: 'Abr', operacional: 19500, produtos: 16800, marketing: 5700, total: 42000 },
  ];
  
  // Mock data for profit margin
  const profitMarginData = [
    { month: 'Jan', alugueis: 68, vendas: 42, media: 58 },
    { month: 'Fev', alugueis: 65, vendas: 48, media: 59 },
    { month: 'Mar', alugueis: 72, vendas: 45, media: 62 },
    { month: 'Abr', alugueis: 70, vendas: 38, media: 60 },
  ];
  
  // Mock data for revenue by category
  const categoryData = [
    { name: 'Vestidos', value: 28500 },
    { name: 'Ternos', value: 15200 },
    { name: 'Acessórios', value: 8500 },
    { name: 'Roupas Infantis', value: 6800 },
    { name: 'Outros', value: 4100 },
  ];
  
  // Colors for pie chart
  const COLORS = ['#be123c', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-semibold">Relatórios Financeiros</h2>
        <div className="flex gap-3">
          <Select 
            value={timeRange}
            onValueChange={(value) => setTimeRange(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Últimos 4 Meses</SelectItem>
              <SelectItem value="quarter">Último Ano (trimestres)</SelectItem>
              <SelectItem value="year">Últimos 2 Anos</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download size={16} className="mr-2" />
            Exportar
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="profitability">Lucratividade</TabsTrigger>
          <TabsTrigger value="category">Por Categoria</TabsTrigger>
        </TabsList>
        
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Receitas</CardTitle>
              <CardDescription>
                Análise de receitas dividida entre aluguéis e vendas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`R$ ${value}`, '']} />
                    <Legend />
                    <Bar dataKey="alugueis" name="Receita de Aluguéis" fill="#be123c" stackId="a" />
                    <Bar dataKey="vendas" name="Receita de Vendas" fill="#3b82f6" stackId="a" />
                    <Line dataKey="total" name="Total" stroke="#000" strokeWidth={2} dot={{ r: 4 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h3 className="text-sm text-gray-500 mb-1">Total de Receitas</h3>
                    <div className="text-2xl font-semibold">R$ 243.700,00</div>
                    <div className="text-sm text-gray-500 mt-2">+8,4% comparado ao mesmo período do ano anterior</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h3 className="text-sm text-gray-500 mb-1">Receita de Aluguéis</h3>
                    <div className="text-2xl font-semibold text-marsala">R$ 174.300,00</div>
                    <div className="text-sm text-gray-500 mt-2">71,5% do faturamento total</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h3 className="text-sm text-gray-500 mb-1">Receita de Vendas</h3>
                    <div className="text-2xl font-semibold text-blue-500">R$ 69.400,00</div>
                    <div className="text-sm text-gray-500 mt-2">28,5% do faturamento total</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Despesas</CardTitle>
              <CardDescription>
                Análise de despesas por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={expenseData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`R$ ${value}`, '']} />
                    <Legend />
                    <Bar dataKey="operacional" name="Despesas Operacionais" fill="#f59e0b" stackId="a" />
                    <Bar dataKey="produtos" name="Compra de Produtos" fill="#8b5cf6" stackId="a" />
                    <Bar dataKey="marketing" name="Marketing" fill="#22c55e" stackId="a" />
                    <Line dataKey="total" name="Total" stroke="#000" strokeWidth={2} dot={{ r: 4 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h3 className="text-sm text-gray-500 mb-1">Total de Despesas</h3>
                    <div className="text-2xl font-semibold">R$ 151.500,00</div>
                    <div className="text-sm text-gray-500 mt-2">+5,2% vs período anterior</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h3 className="text-sm text-gray-500 mb-1">Despesas Operacionais</h3>
                    <div className="text-2xl font-semibold text-amber-500">R$ 76.000,00</div>
                    <div className="text-sm text-gray-500 mt-2">50,2% do total</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h3 className="text-sm text-gray-500 mb-1">Compra de Produtos</h3>
                    <div className="text-2xl font-semibold text-purple-500">R$ 56.100,00</div>
                    <div className="text-sm text-gray-500 mt-2">37,0% do total</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h3 className="text-sm text-gray-500 mb-1">Marketing</h3>
                    <div className="text-2xl font-semibold text-green-500">R$ 19.400,00</div>
                    <div className="text-sm text-gray-500 mt-2">12,8% do total</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="profitability">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Lucratividade</CardTitle>
              <CardDescription>
                Margem de lucro por tipo de operação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={profitMarginData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, '']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="alugueis" 
                      name="Margem em Aluguéis" 
                      stroke="#be123c" 
                      strokeWidth={2} 
                      dot={{ r: 4 }} 
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="vendas" 
                      name="Margem em Vendas" 
                      stroke="#3b82f6" 
                      strokeWidth={2} 
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}  
                    />
                    <Line 
                      type="monotone" 
                      dataKey="media" 
                      name="Margem Média" 
                      stroke="#000" 
                      strokeWidth={2} 
                      strokeDasharray="5 5"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-2">Resumo de Lucratividade</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">Receita Total</span>
                      <span className="font-medium">R$ 243.700,00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">Custos Totais</span>
                      <span className="font-medium">R$ 151.500,00</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between items-center">
                      <span className="text-neutral-500 font-medium">Lucro Líquido</span>
                      <span className="font-semibold text-marsala">R$ 92.200,00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">Margem de Lucro</span>
                      <span className="font-medium text-marsala">37,8%</span>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-neutral-500">
                    * Margem média do setor: 32,5%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="category">
          <Card>
            <CardHeader>
              <CardTitle>Receita por Categoria</CardTitle>
              <CardDescription>
                Distribuição de receita por categoria de produtos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-[400px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        innerRadius={80}
                        outerRadius={140}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`R$ ${value}`, 'Receita']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-6">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Detalhamento por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {categoryData.map((category, idx) => (
                          <div key={idx} className="flex items-center">
                            <div 
                              className="w-4 h-4 rounded-full mr-3" 
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="font-medium">{category.name}</span>
                                <span className="font-medium">R$ {category.value.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="h-2 rounded-full" 
                                  style={{ 
                                    width: `${(category.value / categoryData.reduce((acc, curr) => acc + curr.value, 0) * 100)}%`,
                                    backgroundColor: COLORS[idx % COLORS.length]
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Ações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Button variant="outline" className="flex items-center justify-center">
                          <ArrowDownToLine size={16} className="mr-2" />
                          Excel
                        </Button>
                        <Button variant="outline" className="flex items-center justify-center">
                          <Printer size={16} className="mr-2" />
                          Imprimir
                        </Button>
                        <Button variant="outline" className="flex items-center justify-center">
                          <Mail size={16} className="mr-2" />
                          Email
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialReports;
