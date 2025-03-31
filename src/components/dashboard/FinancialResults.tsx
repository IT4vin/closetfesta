
import React, { useState } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  AlertCircle,
  CalendarClock,
  ArrowUpRight,
  ArrowDownRight,
  InfoIcon
} from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";

// Definindo os tipos para as métricas financeiras
interface FinancialMetric {
  title: string;
  value: string;
  change: number;
  period: string;
  icon: React.ReactNode;
  color: string;
  details?: {
    label: string;
    value: string;
  }[];
}

const FinancialResults = () => {
  const [timePeriod, setTimePeriod] = useState<"day" | "week" | "month">("month");
  
  // Dados de exemplo (seriam substituídos por dados reais do backend)
  const financialDataByPeriod = {
    day: [
      {
        title: "Total em Atrasos",
        value: "R$ 850,00",
        change: 5.2,
        period: "vs dia anterior",
        icon: <AlertCircle size={24} className="text-white" />,
        color: "bg-red-500",
        details: [
          { label: "Quantidade de itens", value: "3" },
          { label: "Multa média", value: "R$ 283,33" },
          { label: "Cliente mais atrasado", value: "Maria Silva (5 dias)" }
        ]
      },
      {
        title: "Receita do Dia",
        value: "R$ 1.250,00",
        change: 12.3,
        period: "vs dia anterior",
        icon: <DollarSign size={24} className="text-white" />,
        color: "bg-marsala",
        details: [
          { label: "Aluguéis", value: "R$ 950,00" },
          { label: "Vendas", value: "R$ 300,00" },
          { label: "Transações", value: "4" }
        ]
      },
      {
        title: "Pedidos Ativos",
        value: "12",
        change: 0,
        period: "vs dia anterior",
        icon: <CalendarClock size={24} className="text-white" />,
        color: "bg-blue-500",
        details: [
          { label: "Novos pedidos", value: "2" },
          { label: "Em preparação", value: "5" },
          { label: "Prontos para entrega", value: "5" }
        ]
      },
      {
        title: "Contas a Receber",
        value: "R$ 3.450,00",
        change: 1.8,
        period: "vs dia anterior",
        icon: <TrendingUp size={24} className="text-white" />,
        color: "bg-green-500",
        details: [
          { label: "Para hoje", value: "R$ 750,00" },
          { label: "Para esta semana", value: "R$ 1.800,00" },
          { label: "Para este mês", value: "R$ 900,00" }
        ]
      }
    ],
    week: [
      {
        title: "Total em Atrasos",
        value: "R$ 2.120,00",
        change: 8.4,
        period: "vs semana anterior",
        icon: <AlertCircle size={24} className="text-white" />,
        color: "bg-red-500",
        details: [
          { label: "Quantidade de itens", value: "7" },
          { label: "Multa média", value: "R$ 302,85" },
          { label: "Cliente mais atrasado", value: "Carlos Mendes (8 dias)" }
        ]
      },
      {
        title: "Receita da Semana",
        value: "R$ 8.760,00",
        change: 6.5,
        period: "vs semana anterior",
        icon: <DollarSign size={24} className="text-white" />,
        color: "bg-marsala",
        details: [
          { label: "Aluguéis", value: "R$ 6.540,00" },
          { label: "Vendas", value: "R$ 2.220,00" },
          { label: "Transações", value: "23" }
        ]
      },
      {
        title: "Pedidos Ativos",
        value: "28",
        change: -2.5,
        period: "vs semana anterior",
        icon: <CalendarClock size={24} className="text-white" />,
        color: "bg-blue-500",
        details: [
          { label: "Novos pedidos", value: "8" },
          { label: "Em preparação", value: "12" },
          { label: "Prontos para entrega", value: "8" }
        ]
      },
      {
        title: "Contas a Receber",
        value: "R$ 9.850,00",
        change: 3.2,
        period: "vs semana anterior",
        icon: <TrendingUp size={24} className="text-white" />,
        color: "bg-green-500",
        details: [
          { label: "Para esta semana", value: "R$ 4.250,00" },
          { label: "Para próxima semana", value: "R$ 3.600,00" },
          { label: "Para este mês", value: "R$ 2.000,00" }
        ]
      }
    ],
    month: [
      {
        title: "Total em Atrasos",
        value: "R$ 3.450,00",
        change: 12.5,
        period: "vs mês anterior",
        icon: <AlertCircle size={24} className="text-white" />,
        color: "bg-red-500",
        details: [
          { label: "Quantidade de itens", value: "12" },
          { label: "Multa média", value: "R$ 287,50" },
          { label: "Cliente mais atrasado", value: "Pedro Alvares (15 dias)" }
        ]
      },
      {
        title: "Receita do Mês",
        value: "R$ 28.790,00",
        change: 8.3,
        period: "vs mês anterior",
        icon: <DollarSign size={24} className="text-white" />,
        color: "bg-marsala",
        details: [
          { label: "Aluguéis", value: "R$ 22.450,00" },
          { label: "Vendas", value: "R$ 6.340,00" },
          { label: "Transações", value: "78" }
        ]
      },
      {
        title: "Pedidos Ativos",
        value: "42",
        change: -3.5,
        period: "vs mês anterior",
        icon: <CalendarClock size={24} className="text-white" />,
        color: "bg-blue-500",
        details: [
          { label: "Novos pedidos", value: "15" },
          { label: "Em preparação", value: "18" },
          { label: "Prontos para entrega", value: "9" }
        ]
      },
      {
        title: "Contas a Receber",
        value: "R$ 15.320,00",
        change: 5.2,
        period: "vs mês anterior",
        icon: <TrendingUp size={24} className="text-white" />,
        color: "bg-green-500",
        details: [
          { label: "Para este mês", value: "R$ 8.750,00" },
          { label: "Para próximo mês", value: "R$ 6.570,00" },
          { label: "Em negociação", value: "R$ 0,00" }
        ]
      }
    ]
  };

  const financialData = financialDataByPeriod[timePeriod];

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Resultados Financeiros</h2>
        <div className="flex space-x-2 bg-neutral-100 p-1 rounded-lg">
          <button 
            onClick={() => setTimePeriod("day")} 
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${timePeriod === "day" ? "bg-white shadow-sm" : "text-neutral-500 hover:bg-neutral-200"}`}
          >
            Dia
          </button>
          <button 
            onClick={() => setTimePeriod("week")} 
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${timePeriod === "week" ? "bg-white shadow-sm" : "text-neutral-500 hover:bg-neutral-200"}`}
          >
            Semana
          </button>
          <button 
            onClick={() => setTimePeriod("month")} 
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${timePeriod === "month" ? "bg-white shadow-sm" : "text-neutral-500 hover:bg-neutral-200"}`}
          >
            Mês
          </button>
        </div>
      </div>
      
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
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-gray-500 text-sm mb-1">{metric.title}</h3>
                <p className="text-2xl font-semibold">{metric.value}</p>
                <p className="text-gray-500 text-xs mt-1">{metric.period}</p>
              </div>
              
              {metric.details && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-neutral-400 hover:text-neutral-600 transition-colors mt-1">
                      <InfoIcon size={18} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-60 p-0" align="end" side="top">
                    <div className="p-3 border-b">
                      <p className="text-sm font-medium">{metric.title} - Detalhes</p>
                    </div>
                    <div className="p-3 space-y-2">
                      {metric.details.map((detail, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-sm text-neutral-500">{detail.label}:</span>
                          <span className="text-sm font-medium">{detail.value}</span>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinancialResults;
