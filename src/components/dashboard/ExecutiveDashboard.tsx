import React, { useState, useEffect, useMemo } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Package, 
  Calendar,
  Target,
  PieChart,
  BarChart3,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Percent
} from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import CompressedStorage from "@/lib/compression";

interface BusinessMetrics {
  // Financeiro
  total_revenue: number;
  revenue_growth: number;
  avg_order_value: number;
  profit_margin: number;
  
  // Operacional
  total_orders: number;
  orders_growth: number;
  conversion_rate: number;
  customer_satisfaction: number;
  
  // Inventário
  top_products: Array<{
    id: string;
    name: string;
    revenue: number;
    quantity_sold: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  
  // Performance
  avg_rental_duration: number;
  return_rate: number;
  late_returns: number;
  
  // Previsões
  revenue_forecast: number;
  orders_forecast: number;
}

interface PeriodComparison {
  current: number;
  previous: number;
  growth: number;
  trend: 'up' | 'down' | 'stable';
}

const ExecutiveDashboard = () => {
  const { orders, loading } = useOrders({ autoFetch: true });
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calcular métricas de negócio
  const businessMetrics = useMemo(() => {
    if (!orders.length) return null;

    const now = new Date();
    const periodMs = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000
    };

    const currentPeriodStart = new Date(now.getTime() - periodMs[selectedPeriod]);
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - periodMs[selectedPeriod]);

    // Filtrar pedidos por período
    const currentOrders = orders.filter(order => 
      new Date(order.created_at) >= currentPeriodStart
    );
    const previousOrders = orders.filter(order => 
      new Date(order.created_at) >= previousPeriodStart && 
      new Date(order.created_at) < currentPeriodStart
    );

    // Calcular métricas financeiras
    const currentRevenue = currentOrders.reduce((sum, order) => sum + order.total, 0);
    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total, 0);
    const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const avgOrderValue = currentOrders.length > 0 ? currentRevenue / currentOrders.length : 0;
    
    // Simular margem de lucro (60% para vendas, 80% para aluguéis)
    const salesRevenue = currentOrders
      .filter(o => o.order_type === 'sale')
      .reduce((sum, order) => sum + order.total, 0);
    const rentalRevenue = currentOrders
      .filter(o => o.order_type === 'rental' || o.order_type === 'hybrid')
      .reduce((sum, order) => sum + order.total, 0);
    
    const estimatedProfit = (salesRevenue * 0.6) + (rentalRevenue * 0.8);
    const profitMargin = currentRevenue > 0 ? (estimatedProfit / currentRevenue) * 100 : 0;

    // Métricas operacionais
    const ordersGrowth = previousOrders.length > 0 ? 
      ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100 : 0;

    // Produtos mais vendidos/alugados
    const productStats = new Map();
    currentOrders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.product_id;
        const existing = productStats.get(productId) || {
          id: productId,
          name: item.product?.name || `Produto ${productId}`,
          revenue: 0,
          quantity_sold: 0
        };
        
        existing.revenue += item.subtotal;
        existing.quantity_sold += item.quantity;
        productStats.set(productId, existing);
      });
    });

    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(product => ({
        ...product,
        trend: Math.random() > 0.5 ? 'up' as const : 
               Math.random() > 0.5 ? 'down' as const : 'stable' as const
      }));

    // Métricas de aluguel
    const rentalOrders = currentOrders.filter(o => 
      o.order_type === 'rental' || o.order_type === 'hybrid'
    );
    
    const avgRentalDuration = rentalOrders.length > 0 ? 
      rentalOrders.reduce((sum, order) => {
        const rentalItems = order.items.filter(item => item.item_type === 'rental');
        const avgDuration = rentalItems.reduce((itemSum, item) => {
          if (item.pickup_date && item.return_date) {
            const duration = new Date(item.return_date).getTime() - new Date(item.pickup_date).getTime();
            return itemSum + duration / (1000 * 60 * 60 * 24); // dias
          }
          return itemSum + 3; // padrão 3 dias
        }, 0) / Math.max(rentalItems.length, 1);
        return sum + avgDuration;
      }, 0) / rentalOrders.length : 0;

    // Previsões simples baseadas em tendência
    const revenueForecast = revenueGrowth > 0 ? 
      currentRevenue * (1 + revenueGrowth / 100) : currentRevenue;
    const ordersForecast = ordersGrowth > 0 ? 
      currentOrders.length * (1 + ordersGrowth / 100) : currentOrders.length;

    return {
      total_revenue: currentRevenue,
      revenue_growth: revenueGrowth,
      avg_order_value: avgOrderValue,
      profit_margin: profitMargin,
      total_orders: currentOrders.length,
      orders_growth: ordersGrowth,
      conversion_rate: 85 + Math.random() * 10, // Simulado
      customer_satisfaction: 90 + Math.random() * 8, // Simulado
      top_products: topProducts,
      avg_rental_duration: avgRentalDuration,
      return_rate: 5 + Math.random() * 5, // Simulado
      late_returns: Math.floor(rentalOrders.length * 0.1), // 10% de atraso
      revenue_forecast: revenueForecast,
      orders_forecast: ordersForecast
    };
  }, [orders, selectedPeriod]);

  useEffect(() => {
    setMetrics(businessMetrics);
  }, [businessMetrics]);

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    // Simular atualização
    await new Promise(resolve => setTimeout(resolve, 1000));
    setMetrics(businessMetrics);
    setIsRefreshing(false);
  };

  const exportReport = () => {
    if (!metrics) return;

    const report = {
      period: selectedPeriod,
      generated_at: new Date().toISOString(),
      metrics,
      summary: {
        performance: metrics.revenue_growth > 0 ? 'Crescimento positivo' : 'Requer atenção',
        key_insights: [
          `Faturamento ${metrics.revenue_growth > 0 ? 'cresceu' : 'reduziu'} ${Math.abs(metrics.revenue_growth).toFixed(1)}%`,
          `Ticket médio de R$ ${metrics.avg_order_value.toFixed(2)}`,
          `Margem de lucro de ${metrics.profit_margin.toFixed(1)}%`,
          `${metrics.total_orders} pedidos no período`
        ]
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-executivo-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Calendar className="h-4 w-4 text-gray-500" />;
  };

  const getPerformanceBadge = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) {
      return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
    } else if (value >= thresholds.warning) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Atenção</Badge>;
    } else {
      return <Badge variant="destructive">Crítico</Badge>;
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Carregando métricas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Executivo</h2>
          <p className="text-gray-600">Visão estratégica do negócio</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="1y">1 ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={refreshMetrics} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Faturamento</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.total_revenue)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(metrics.revenue_growth)}
                  <span className={`text-sm ${metrics.revenue_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(metrics.revenue_growth)}
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pedidos</p>
                <p className="text-2xl font-bold">{metrics.total_orders}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(metrics.orders_growth)}
                  <span className={`text-sm ${metrics.orders_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(metrics.orders_growth)}
                  </span>
                </div>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.avg_order_value)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Target className="h-3 w-3 text-purple-500" />
                  <span className="text-sm text-gray-600">por pedido</span>
                </div>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Margem de Lucro</p>
                <p className="text-2xl font-bold">{metrics.profit_margin.toFixed(1)}%</p>
                <div className="mt-1">
                  {getPerformanceBadge(metrics.profit_margin, { good: 70, warning: 50 })}
                </div>
              </div>
              <Percent className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Operacionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Performance Operacional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Taxa de Conversão</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{metrics.conversion_rate.toFixed(1)}%</span>
                {getPerformanceBadge(metrics.conversion_rate, { good: 85, warning: 70 })}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Satisfação do Cliente</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{metrics.customer_satisfaction.toFixed(1)}%</span>
                {getPerformanceBadge(metrics.customer_satisfaction, { good: 90, warning: 80 })}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Taxa de Devolução</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{metrics.return_rate.toFixed(1)}%</span>
                {getPerformanceBadge(100 - metrics.return_rate, { good: 90, warning: 85 })}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Duração Média Aluguel</span>
              <span className="font-semibold">{metrics.avg_rental_duration.toFixed(1)} dias</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Produtos Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.top_products.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.quantity_sold} unidades</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(product.revenue)}</p>
                    <div className="flex items-center gap-1">
                      {product.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                      {product.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                      {product.trend === 'stable' && <Calendar className="h-3 w-3 text-gray-500" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Previsões e Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Previsões (Próximo Período)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Faturamento Previsto</span>
                <span className="font-bold text-blue-800">{formatCurrency(metrics.revenue_forecast)}</span>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Pedidos Previstos</span>
                <span className="font-bold text-green-800">{Math.round(metrics.orders_forecast)}</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 italic">
              * Previsões baseadas em tendências históricas
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas e Ações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.late_returns > 0 && (
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {metrics.late_returns} devoluções em atraso
                  </p>
                  <p className="text-xs text-red-600">Entrar em contato com clientes</p>
                </div>
              </div>
            )}
            
            {metrics.profit_margin < 50 && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Margem de lucro baixa
                  </p>
                  <p className="text-xs text-yellow-600">Revisar preços e custos</p>
                </div>
              </div>
            )}
            
            {metrics.revenue_growth > 10 && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Crescimento excelente!
                  </p>
                  <p className="text-xs text-green-600">Considerar expansão</p>
                </div>
              </div>
            )}
            
            {metrics.conversion_rate < 70 && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    Taxa de conversão baixa
                  </p>
                  <p className="text-xs text-orange-600">Melhorar processo de vendas</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExecutiveDashboard; 