
import React from "react";
import { 
  CreditCard, 
  Calendar, 
  ShoppingBag, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight 
} from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, color }) => {
  return (
    <div className="premium-card p-6 h-full">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          {icon}
        </div>
        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {change >= 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
      
      <h3 className="text-gray-500 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
};

const DashboardMetrics = () => {
  // Dados de exemplo (seriam substituídos por dados reais do backend)
  const metricsData = [
    {
      title: "Receita Mensal",
      value: "R$ 12.450",
      change: 8.2,
      icon: <CreditCard size={24} className="text-white" />,
      color: "bg-marsala"
    },
    {
      title: "Aluguéis Ativos",
      value: "24",
      change: 12.5,
      icon: <Calendar size={24} className="text-white" />,
      color: "bg-blue-500"
    },
    {
      title: "Vendas no Mês",
      value: "15",
      change: -3.6,
      icon: <ShoppingBag size={24} className="text-white" />,
      color: "bg-purple-500"
    },
    {
      title: "Taxa de Ocupação",
      value: "78%",
      change: 5.4,
      icon: <TrendingUp size={24} className="text-white" />,
      color: "bg-green-500"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricsData.map((metric, index) => (
        <MetricCard 
          key={index}
          title={metric.title}
          value={metric.value}
          change={metric.change}
          icon={metric.icon}
          color={metric.color}
        />
      ))}
    </div>
  );
};

export default DashboardMetrics;
