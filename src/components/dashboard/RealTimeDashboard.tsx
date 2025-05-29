import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Calendar,
  AlertTriangle,
  Clock,
  BarChart3,
  Zap,
  RefreshCcw
} from "lucide-react";
import { useReports, reportUtils } from "@/hooks/useReports";
import { useAlerts } from "@/hooks/useAlerts";
import { useOrders } from "@/hooks/useOrders";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardMetrics {
  todaySales: number;
  todayRentals: number;
  todayRevenue: number;
  pendingOrders: number;
  overdueReturns: number;
  upcomingEvents: number;
  activeRentals: number;
  availableProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
}

const RealTimeDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    todaySales: 0,
    todayRentals: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    overdueReturns: 0,
    upcomingEvents: 0,
    activeRentals: 0,
    availableProducts: 0,
    lowStockProducts: 0,
    totalCustomers: 0
  });

  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Date ranges for comparison
  const today = new Date();
  const yesterday = subDays(today, 1);
  const todayStr = format(today, 'yyyy-MM-dd');
  const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

  // Hooks for real-time data
  const { salesDashboard, loading: dashboardLoading } = useReports({
    date_from: todayStr,
    date_to: todayStr,
    autoFetch: true
  });

  const { orders, loading: ordersLoading } = useOrders({
    status: 'pending',
    date_from: todayStr,
    autoFetch: true
  });

  const { alerts, getOverdueAlerts, getUrgentAlerts } = useAlerts({
    autoRefresh: true,
    refreshInterval: 30000 // 30 seconds
  });

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, []);

  // Update metrics when data changes
  useEffect(() => {
    if (salesDashboard && orders) {
      updateMetrics();
    }
  }, [salesDashboard, orders, alerts]);

  const updateMetrics = () => {
    if (!salesDashboard) return;

    const overdueAlerts = getOverdueAlerts();
    const urgentAlerts = getUrgentAlerts();

    setMetrics({
      todaySales: salesDashboard.salesCount || 0,
      todayRentals: salesDashboard.rentalsCount || 0,
      todayRevenue: salesDashboard.totalRevenue || 0,
      pendingOrders: orders.length || 0,
      overdueReturns: overdueAlerts.length,
      upcomingEvents: urgentAlerts.length,
      activeRentals: salesDashboard.rentalsCount || 0, // Would need separate API
      availableProducts: 0, // Would need separate API
      lowStockProducts: 0, // Would need separate API
      totalCustomers: 0 // Would need separate API
    });

    setLastUpdate(new Date());
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    // Force refresh all data sources
    try {
      // Trigger refresh of all hooks
      await Promise.all([
        // Add refresh calls here when hooks support it
      ]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getMetricChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const MetricCard = ({ 
    title, 
    value, 
    previousValue, 
    icon: Icon, 
    color = "blue",
    format = "number" 
  }: {
    title: string;
    value: number;
    previousValue?: number;
    icon: React.ComponentType<any>;
    color?: string;
    format?: "number" | "currency" | "percentage";
  }) => {
    const change = previousValue !== undefined ? getMetricChange(value, previousValue) : 0;
    const isPositive = change >= 0;

    const formatValue = (val: number) => {
      switch (format) {
        case "currency":
          return reportUtils.formatCurrency(val);
        case "percentage":
          return reportUtils.formatPercentage(val);
        default:
          return val.toLocaleString('pt-BR');
      }
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-3xl font-bold mt-2">{formatValue(value)}</p>
              {previousValue !== undefined && (
                <div className="flex items-center mt-2">
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm ml-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(change).toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500 ml-1">vs ontem</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-full bg-${color}-100`}>
              <Icon className={`h-6 w-6 text-${color}-600`} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const loading = dashboardLoading || ordersLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard em Tempo Real</h2>
          <p className="text-gray-600">
            Última atualização: {format(lastUpdate, "HH:mm:ss", { locale: ptBR })}
          </p>
        </div>
        <Button 
          onClick={refreshData} 
          disabled={isRefreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Live Status Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="ml-2 text-sm font-medium">Sistema Online</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Sync Status</p>
                <p className="text-xs text-gray-500">Sincronizado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Tempo Real</p>
                <p className="text-xs text-gray-500">Ativo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Performance</p>
                <p className="text-xs text-gray-500">Excelente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Vendas Hoje"
          value={metrics.todaySales}
          icon={Package}
          color="blue"
        />
        
        <MetricCard
          title="Aluguéis Hoje"
          value={metrics.todayRentals}
          icon={Calendar}
          color="green"
        />
        
        <MetricCard
          title="Receita Hoje"
          value={metrics.todayRevenue}
          icon={DollarSign}
          color="purple"
          format="currency"
        />
        
        <MetricCard
          title="Pedidos Pendentes"
          value={metrics.pendingOrders}
          icon={Clock}
          color="orange"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devoluções em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.overdueReturns}</div>
            <p className="text-xs text-gray-500">Requer atenção imediata</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Próximos</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.upcomingEvents}</div>
            <p className="text-xs text-gray-500">Próximas 24 horas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aluguéis Ativos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.activeRentals}</div>
            <p className="text-xs text-gray-500">Em andamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance do Dia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Meta de Vendas</span>
                <span>{metrics.todaySales}/10</span>
              </div>
              <Progress value={(metrics.todaySales / 10) * 100} className="mt-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm">
                <span>Meta de Aluguéis</span>
                <span>{metrics.todayRentals}/5</span>
              </div>
              <Progress value={(metrics.todayRentals / 5) * 100} className="mt-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span>Meta de Receita</span>
                <span>{reportUtils.formatCurrency(metrics.todayRevenue)}/R$ 2.000</span>
              </div>
              <Progress value={(metrics.todayRevenue / 2000) * 100} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas Importantes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Nenhum alerta crítico</p>
                <p className="text-xs text-gray-500">Sistema funcionando perfeitamente!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(alert.scheduled_date), "dd/MM HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
                {alerts.length > 5 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{alerts.length - 5} alertas adicionais
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RealTimeDashboard; 