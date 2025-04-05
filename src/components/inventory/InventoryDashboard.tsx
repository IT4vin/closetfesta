
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useProducts } from "@/hooks/useProducts";
import { 
  BarChart, 
  ResponsiveContainer, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from "recharts";
import { ArrowUp, ArrowDown, DollarSign, Package, ShoppingBag, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const InventoryDashboard = () => {
  const { productsList } = useProducts();

  // Calcular estatísticas de estoque
  const availableProducts = productsList.filter(p => p.status === "available").length;
  const rentedProducts = productsList.filter(p => p.status === "rented").length;
  const totalProducts = productsList.length;
  const availabilityRate = totalProducts > 0 ? (availableProducts / totalProducts) * 100 : 0;
  
  // Dados para os gráficos
  const productsByType = Object.entries(
    productsList.reduce((acc: Record<string, number>, product) => {
      acc[product.type] = (acc[product.type] || 0) + 1;
      return acc;
    }, {})
  ).map(([type, count]) => ({ type, count }));
  
  const productsByStatus = [
    { name: "Disponível", value: availableProducts },
    { name: "Alugado", value: rentedProducts },
    { name: "Manutenção", value: totalProducts - availableProducts - rentedProducts }
  ];
  
  const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];
  
  // Top 5 produtos mais alugados (simulação)
  const topRentedProducts = [...productsList]
    .sort(() => Math.random() - 0.5)
    .slice(0, 5)
    .map(product => ({
      name: product.name,
      rentals: Math.floor(Math.random() * 10) + 1
    }));
    
  // Dados de entrada e saída (simulados)
  const stockMovementData = [
    { date: '01/04', entrada: 5, saida: 3 },
    { date: '02/04', entrada: 3, saida: 2 },
    { date: '03/04', entrada: 4, saida: 6 },
    { date: '04/04', entrada: 7, saida: 4 },
    { date: '05/04', entrada: 2, saida: 5 }
  ];
  
  // KPIs para exibir no dashboard
  const stockKPIs = [
    {
      title: "Valor Total em Estoque",
      value: "R$ 58.450,00",
      change: 12.5,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      positive: true
    },
    {
      title: "Itens em Estoque",
      value: totalProducts.toString(),
      change: 5.2,
      icon: <Package className="h-4 w-4 text-muted-foreground" />,
      positive: true
    },
    {
      title: "Taxa de Ocupação",
      value: `${Math.round((rentedProducts / totalProducts) * 100)}%`,
      change: 3.8,
      icon: <ShoppingBag className="h-4 w-4 text-muted-foreground" />,
      positive: true
    },
    {
      title: "Tempo Médio de Aluguel",
      value: "4.2 dias",
      change: -1.5,
      icon: <CalendarClock className="h-4 w-4 text-muted-foreground" />,
      positive: false
    }
  ];
  
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stockKPIs.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                  {kpi.icon}
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${kpi.positive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {kpi.positive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                  {Math.abs(kpi.change)}%
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                <h3 className="text-2xl font-bold">{kpi.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Estatísticas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Taxa de Disponibilidade</span>
              <Badge variant="outline" className={availabilityRate > 50 ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200'}>
                {availabilityRate.toFixed(1)}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Progress value={availabilityRate} className="h-2" />
              <div className="pt-2 grid grid-cols-3 text-center text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-medium">{totalProducts}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Disponíveis</p>
                  <p className="font-medium">{availableProducts}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Alugados</p>
                  <p className="font-medium">{rentedProducts}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Movimentação de Estoque */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Movimentação Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stockMovementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="entrada" stroke="#22c55e" name="Entrada" />
                  <Line type="monotone" dataKey="saida" stroke="#ef4444" name="Saída" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Produtos por tipo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Produtos por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productsByType}>
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Status dos produtos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Status dos Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {productsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Produtos mais alugados */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Produtos Mais Alugados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRentedProducts} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={150} />
                <Tooltip />
                <Bar dataKey="rentals" fill="#be123c" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryDashboard;
