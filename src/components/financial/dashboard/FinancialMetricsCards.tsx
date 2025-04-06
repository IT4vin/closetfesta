
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

// Financial metrics cards component
const FinancialMetricsCards = () => {
  // Mock data for financial metrics
  const financialMetrics = [
    {
      title: "Receita Total",
      value: "R$ 38.520,00",
      change: 8.5,
      icon: <DollarSign className="text-white" size={20} />,
      color: "bg-green-500"
    },
    {
      title: "Despesas Totais",
      value: "R$ 20.145,00",
      change: -3.2,
      icon: <TrendingDown className="text-white" size={20} />,
      color: "bg-red-500"
    },
    {
      title: "Lucro Líquido",
      value: "R$ 18.375,00",
      change: 12.4,
      icon: <TrendingUp className="text-white" size={20} />,
      color: "bg-marsala"
    },
    {
      title: "Ticket Médio",
      value: "R$ 245,30",
      change: 5.7,
      icon: <CreditCard className="text-white" size={20} />,
      color: "bg-blue-500"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {financialMetrics.map((metric, index) => (
        <Card key={index} className="shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg ${metric.color} flex items-center justify-center`}>
                {metric.icon}
              </div>
              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${metric.change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {metric.change >= 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                <span>{Math.abs(metric.change)}%</span>
              </div>
            </div>
            <h3 className="text-gray-500 text-sm mb-1">{metric.title}</h3>
            <p className="text-2xl font-semibold">{metric.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FinancialMetricsCards;
