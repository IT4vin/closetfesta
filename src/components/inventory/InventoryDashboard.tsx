
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
  Cell
} from "recharts";

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
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Estatísticas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Taxa de Disponibilidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Disponibilidade</span>
                <span className="font-medium">{availabilityRate.toFixed(1)}%</span>
              </div>
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
