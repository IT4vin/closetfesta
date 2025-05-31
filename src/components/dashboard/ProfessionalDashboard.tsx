import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Users,
  Package,
  AlertTriangle,
  Clock,
  BarChart3,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
  Zap,
  Award,
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/stores/authStore";
import DashboardDataService, { DashboardMetrics, FinancialSummary } from "@/lib/dashboardData";
import PermissionManager from "@/lib/permissions";

// Mini Gráfico de Linha Simples
const MiniLineChart: React.FC<{ data: number[], color: string }> = ({ data, color }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 60;
    const y = 20 - ((value - min) / range) * 20;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width="60" height="20" className="opacity-80">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        className="drop-shadow-sm"
      />
    </svg>
  );
};

// Card Financeiro Principal
const FinancialCard: React.FC<{
  title: string;
  value: string;
  target?: string;
  progress?: number;
  change: number;
  trend: 'up' | 'down';
  permission: boolean;
}> = ({ title, value, target, progress, change, trend, permission }) => {
  if (!permission) {
    return (
      <Card className="col-span-2 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
        <CardContent className="p-8">
          <div className="flex items-center justify-center h-32">
            <div className="text-center text-gray-400">
              <EyeOff className="h-12 w-12 mx-auto mb-3" />
              <p className="text-lg font-medium">Acesso Restrito</p>
              <p className="text-sm">Dados financeiros requerem permissão</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2 bg-gradient-to-br from-marsala-600 via-marsala-700 to-marsala-800 text-white border-0 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
      
      <CardContent className="p-8 relative">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-white/80 text-lg font-medium mb-2">{title}</h3>
            <div className="flex items-end gap-4">
              <span className="text-4xl font-bold">{value}</span>
              {target && (
                <span className="text-white/70 text-lg mb-1">de {target}</span>
              )}
            </div>
          </div>
          <div className="bg-white/20 rounded-full p-4">
            <DollarSign size={32} className="text-white" />
          </div>
        </div>
        
        {progress !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/80 text-sm">Progresso da Meta</span>
              <span className="text-white font-semibold">{progress}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-white to-yellow-200 h-3 rounded-full transition-all duration-700 shadow-lg" 
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {trend === 'up' ? (
              <TrendingUp size={20} className="text-green-300" />
            ) : (
              <TrendingDown size={20} className="text-red-300" />
            )}
            <span className={`font-semibold ${trend === 'up' ? 'text-green-300' : 'text-red-300'}`}>
              {change > 0 ? '+' : ''}{change}% vs mês anterior
            </span>
          </div>
          <MiniLineChart 
            data={[10, 25, 15, 40, 30, 55, 45]} 
            color={trend === 'up' ? '#86efac' : '#fca5a5'} 
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Card de Métrica Operacional
const OperationalCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  change?: number;
  permission: boolean;
}> = ({ title, value, subtitle, icon, color, change, permission }) => {
  if (!permission) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-6">
          <div className="text-center text-gray-400">
            <EyeOff className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Sem acesso</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-1 ${color}`}></div>
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-14 h-14 rounded-2xl ${color.replace('bg-', 'bg-').replace('-600', '-100')} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <div className={`${color.replace('bg-', 'text-')}`}>
              {icon}
            </div>
          </div>
          {change !== undefined && (
            <Badge variant={change >= 0 ? "default" : "destructive"} className="text-xs">
              {change >= 0 ? '+' : ''}{change}%
            </Badge>
          )}
        </div>
        
        <div>
          <h3 className="text-gray-600 text-sm font-medium mb-2">{title}</h3>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        
        <div className="mt-4 flex items-center gap-2">
          <Activity size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">Atualizado agora</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Card de Alerta
const AlertCard: React.FC<{
  title: string;
  value: string;
  description: string;
  type: 'danger' | 'warning' | 'success';
  icon: React.ReactNode;
  permission: boolean;
}> = ({ title, value, description, type, icon, permission }) => {
  if (!permission) return null;

  const styles = {
    danger: {
      bg: 'bg-gradient-to-br from-red-500 to-red-600',
      text: 'text-white',
      iconBg: 'bg-white/20'
    },
    warning: {
      bg: 'bg-gradient-to-br from-yellow-400 to-orange-500',
      text: 'text-white',
      iconBg: 'bg-white/20'
    },
    success: {
      bg: 'bg-gradient-to-br from-green-500 to-emerald-600',
      text: 'text-white',
      iconBg: 'bg-white/20'
    }
  };

  const style = styles[type];

  return (
    <Card className={`${style.bg} ${style.text} border-0 shadow-lg relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
      
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${style.iconBg} flex items-center justify-center`}>
            {icon}
          </div>
          <span className="text-2xl font-bold">{value}</span>
        </div>
        
        <div>
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm opacity-90">{description}</p>
        </div>
        
        <div className="mt-4 flex items-center gap-1">
          <Zap size={12} className="opacity-80" />
          <span className="text-xs opacity-80">Requer atenção</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Card de Performance
const PerformanceCard: React.FC<{
  title: string;
  value: string;
  percentage: number;
  icon: React.ReactNode;
  color: string;
  permission: boolean;
}> = ({ title, value, percentage, icon, color, permission }) => {
  if (!permission) return null;

  return (
    <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center`}>
            {icon}
          </div>
          <Badge variant="outline" className="text-xs">
            {percentage}%
          </Badge>
        </div>
        
        <h3 className="text-gray-600 text-sm font-medium mb-2">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 mb-4">{value}</p>
        
        {/* Circular Progress */}
        <div className="relative w-16 h-16 mx-auto">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-gray-200"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={`${percentage * 1.76} 176`}
              className={color.replace('bg-', 'text-')}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-gray-700">{percentage}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ProfessionalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [financial, setFinancial] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      try {
        const dashboardMetrics = DashboardDataService.getDashboardMetrics();
        setMetrics(dashboardMetrics);
      } catch (err) {
        console.warn('Sem permissão para métricas do dashboard:', err);
      }

      try {
        const financialSummary = DashboardDataService.getFinancialSummary();
        setFinancial(financialSummary);
      } catch (err) {
        console.warn('Sem permissão para dados financeiros:', err);
      }

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const hasFinancialPermission = PermissionManager.hasPermission('financial', 'read');
  const hasDashboardPermission = PermissionManager.hasPermission('dashboard', 'read');
  const hasInventoryPermission = PermissionManager.hasPermission('inventory', 'read');
  const hasClientsPermission = PermissionManager.hasPermission('clients', 'read');

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-gray-200 rounded w-80 mb-2 animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        
        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-800 mb-2">Erro ao carregar dashboard</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <Button onClick={loadDashboardData} className="bg-red-600 hover:bg-red-700">
            <Award className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Melhorado */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-gray-200">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-marsala-600 to-marsala-800 bg-clip-text text-transparent mb-2">
            Dashboard Executivo
          </h2>
          <p className="text-gray-600 text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-marsala-500" />
            Visão geral completa do seu negócio • Atualizado em tempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 px-4 py-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Sistema Online
          </Badge>
          <Button
            variant="outline"
            onClick={loadDashboardData}
            className="bg-marsala-50 text-marsala-700 border-marsala-300 hover:bg-marsala-100 px-6 py-2"
          >
            <Zap className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Seção de Alertas */}
      <div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          Alertas e Ações
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AlertCard
            title="Aluguéis em Atraso"
            value={metrics?.alugueis_atrasados?.toString() || '0'}
            description="Requer ação imediata de cobrança"
            type="danger"
            icon={<AlertCircle size={20} />}
            permission={hasDashboardPermission}
          />
          
          <AlertCard
            title="Devoluções Hoje"
            value={metrics?.devolucoes_hoje?.toString() || '0'}
            description="Agendadas para hoje"
            type="warning"
            icon={<Clock size={20} />}
            permission={hasDashboardPermission}
          />
          
          <AlertCard
            title="Sistema Operacional"
            value="100%"
            description="Todos os serviços funcionando"
            type="success"
            icon={<CheckCircle2 size={20} />}
            permission={true}
          />
          
          <OperationalCard
            title="Produtos Disponíveis"
            value={metrics?.produtos_disponivel?.toString() || 'N/A'}
            subtitle="Pronto para locação"
            icon={<Package size={24} />}
            color="bg-gray-600"
            permission={hasInventoryPermission}
          />
        </div>
      </div>

      {/* Seção Financeira */}
      <div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-marsala-600 rounded-lg flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          Resumo Financeiro
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <FinancialCard
            title="Receita Mensal"
            value={financial ? `R$ ${financial.entrada_mes.toLocaleString('pt-BR')}` : 'N/A'}
            target={financial ? `R$ ${financial.meta_mensal.toLocaleString('pt-BR')}` : undefined}
            progress={financial?.percentual_meta}
            change={financial ? Math.round(((financial.entrada_mes - financial.meta_mensal * 0.8) / (financial.meta_mensal * 0.8)) * 100) : 0}
            trend={financial && financial.entrada_mes > financial.meta_mensal * 0.8 ? 'up' : 'down'}
            permission={hasFinancialPermission}
          />
          
          <OperationalCard
            title="Receita Diária"
            value={financial ? `R$ ${financial.entrada_dia.toLocaleString('pt-BR')}` : 'N/A'}
            subtitle="Entrada do dia atual"
            icon={<TrendingUp size={24} />}
            color="bg-green-600"
            change={12.5}
            permission={hasFinancialPermission}
          />
          
          <OperationalCard
            title="Lucro Mensal"
            value={financial ? `R$ ${financial.lucro_mes.toLocaleString('pt-BR')}` : 'N/A'}
            subtitle="Após custos fixos"
            icon={<BarChart3 size={24} />}
            color="bg-purple-600"
            change={8.2}
            permission={hasFinancialPermission}
          />
        </div>
      </div>

      {/* Seção Operacional */}
      <div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          Métricas Operacionais
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <OperationalCard
            title="Aluguéis Ativos"
            value={metrics?.alugueis_ativos?.toString() || 'N/A'}
            subtitle="Locações em andamento"
            icon={<Calendar size={24} />}
            color="bg-blue-600"
            change={5.4}
            permission={hasDashboardPermission}
          />
          
          <OperationalCard
            title="Vendas no Mês"
            value={metrics?.vendas_mes?.toString() || 'N/A'}
            subtitle="Vendas realizadas"
            icon={<ShoppingCart size={24} />}
            color="bg-indigo-600"
            change={-3.6}
            permission={hasDashboardPermission}
          />
          
          <PerformanceCard
            title="Taxa de Ocupação"
            value={metrics ? `${metrics.taxa_ocupacao}%` : 'N/A'}
            percentage={metrics?.taxa_ocupacao || 0}
            icon={<Target size={20} className="text-white" />}
            color="bg-green-600"
            permission={hasInventoryPermission}
          />
          
          <OperationalCard
            title="Clientes Ativos"
            value={metrics?.clientes_ativos?.toString() || 'N/A'}
            subtitle="Base de clientes"
            icon={<Users size={24} />}
            color="bg-orange-600"
            change={15.3}
            permission={hasClientsPermission}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboard; 