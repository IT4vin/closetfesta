
import React from "react";
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  AlertCircle,
  CalendarClock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

// Definindo os tipos para as métricas financeiras
interface FinancialMetric {
  title: string;
  value: string;
  change: number;
  period: string;
  icon: React.ReactNode;
  color: string;
}

const FinancialResults = () => {
  // Dados de exemplo (seriam substituídos por dados reais do backend)
  const financialData: FinancialMetric[] = [
    {
      title: "Total em Atrasos",
      value: "R$ 3.450,00",
      change: 12.5,
      period: "vs mês anterior",
      icon: <AlertCircle size={24} className="text-white" />,
      color: "bg-red-500"
    },
    {
      title: "Receita do Mês",
      value: "R$ 28.790,00",
      change: 8.3,
      period: "vs mês anterior",
      icon: <DollarSign size={24} className="text-white" />,
      color: "bg-marsala"
    },
    {
      title: "Pedidos Ativos",
      value: "42",
      change: -3.5,
      period: "vs mês anterior",
      icon: <CalendarClock size={24} className="text-white" />,
      color: "bg-blue-500"
    },
    {
      title: "Contas a Receber",
      value: "R$ 15.320,00",
      change: 5.2,
      period: "vs mês anterior",
      icon: <TrendingUp size={24} className="text-white" />,
      color: "bg-green-500"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {financialData.map((metric, index) => (
        <div key={index} className="premium-card p-6 h-full">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg ${metric.color} flex items-center justify-center`}>
              {metric.icon}
            </div>
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${metric.change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {metric.change >= 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
              <span>{Math.abs(metric.change)}%</span>
            </div>
          </div>
          
          <h3 className="text-gray-500 text-sm mb-1">{metric.title}</h3>
          <p className="text-2xl font-semibold">{metric.value}</p>
          <p className="text-gray-500 text-xs mt-1">{metric.period}</p>
        </div>
      ))}
    </div>
  );
};

export default FinancialResults;
