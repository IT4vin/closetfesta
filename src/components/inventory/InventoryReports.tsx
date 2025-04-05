
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  BarChart,
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const InventoryReports = () => {
  const [timeRange, setTimeRange] = useState("month");
  
  // Dados de exemplo para os gráficos
  const topProducts = [
    { name: "Vestido de Noiva Clássico", quantity: 48 },
    { name: "Terno Slim Preto", quantity: 36 },
    { name: "Vestido de Festa Longo", quantity: 32 },
    { name: "Smoking Premium", quantity: 28 },
    { name: "Vestido de Debutante", quantity: 22 },
  ];
  
  const categoryData = [
    { name: "Vestidos", value: 120 },
    { name: "Ternos", value: 80 },
    { name: "Acessórios", value: 60 },
    { name: "Trajes Infantis", value: 40 },
    { name: "Outros", value: 20 }
  ];
  
  const profitabilityData = [
    { name: "Jan", rental: 5200, sale: 3800 },
    { name: "Fev", rental: 4800, sale: 4200 },
    { name: "Mar", rental: 6500, sale: 3900 },
    { name: "Abr", rental: 5800, sale: 4500 },
    { name: "Mai", rental: 7200, sale: 5100 },
    { name: "Jun", rental: 6800, sale: 4800 },
  ];
  
  const COLORS = ["#be123c", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Relatórios de Inventário</h2>
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
      
      <Tabs defaultValue="top-products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="top-products">Produtos Mais Alugados</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="profitability">Rentabilidade</TabsTrigger>
        </TabsList>
        
        <TabsContent value="top-products">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Produtos Mais Alugados</CardTitle>
              <CardDescription>
                Baseado no número de aluguéis no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProducts}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantity" fill="#be123c" name="Quantidade de Aluguéis" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Categoria</CardTitle>
              <CardDescription>
                Quantidade de itens por categoria no inventário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      innerRadius={60}
                      outerRadius={120}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} itens`, 'Quantidade']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="profitability">
          <Card>
            <CardHeader>
              <CardTitle>Rentabilidade: Aluguéis vs Vendas</CardTitle>
              <CardDescription>
                Comparativo de receita entre aluguéis e vendas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={profitabilityData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`R$ ${value}`, '']} />
                    <Legend />
                    <Bar dataKey="rental" name="Receita de Aluguéis" fill="#be123c" />
                    <Bar dataKey="sale" name="Receita de Vendas" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryReports;
