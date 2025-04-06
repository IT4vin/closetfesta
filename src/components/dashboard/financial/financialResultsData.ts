
import { 
  AlertCircle, 
  DollarSign, 
  TrendingUp,
  CalendarClock
} from "lucide-react";
import React from "react";
import { FinancialMetricProps } from "./FinancialMetricCard";

// Define the data structure
interface FinancialDataByPeriod {
  day: FinancialMetricProps[];
  week: FinancialMetricProps[];
  month: FinancialMetricProps[];
}

// Export the financial data
export const financialDataByPeriod: FinancialDataByPeriod = {
  day: [
    {
      title: "Total em Atrasos",
      value: "R$ 850,00",
      change: 5.2,
      period: "vs dia anterior",
      icon: React.createElement(AlertCircle, { size: 24, className: "text-white" }),
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
      icon: React.createElement(DollarSign, { size: 24, className: "text-white" }),
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
      icon: React.createElement(CalendarClock, { size: 24, className: "text-white" }),
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
      icon: React.createElement(TrendingUp, { size: 24, className: "text-white" }),
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
      icon: React.createElement(AlertCircle, { size: 24, className: "text-white" }),
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
      icon: React.createElement(DollarSign, { size: 24, className: "text-white" }),
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
      icon: React.createElement(CalendarClock, { size: 24, className: "text-white" }),
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
      icon: React.createElement(TrendingUp, { size: 24, className: "text-white" }),
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
      icon: React.createElement(AlertCircle, { size: 24, className: "text-white" }),
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
      icon: React.createElement(DollarSign, { size: 24, className: "text-white" }),
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
      icon: React.createElement(CalendarClock, { size: 24, className: "text-white" }),
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
      icon: React.createElement(TrendingUp, { size: 24, className: "text-white" }),
      color: "bg-green-500",
      details: [
        { label: "Para este mês", value: "R$ 8.750,00" },
        { label: "Para próximo mês", value: "R$ 6.570,00" },
        { label: "Em negociação", value: "R$ 0,00" }
      ]
    }
  ]
};
