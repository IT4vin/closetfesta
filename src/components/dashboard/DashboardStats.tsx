
import React from "react";
import { ShoppingBag, Shirt, Calendar, DollarSign } from "lucide-react";

const DashboardStats = () => {
  // In a real app, this would come from an API or context
  const stats = [
    {
      title: "Vendas Hoje",
      value: 5,
      icon: <ShoppingBag className="text-marsala" size={20} />,
      change: "+20%",
      positive: true,
    },
    {
      title: "Aluguéis Ativos",
      value: 12,
      icon: <Shirt className="text-blue-500" size={20} />,
      change: "+5%",
      positive: true,
    },
    {
      title: "Provas Agendadas",
      value: 8,
      icon: <Calendar className="text-green-500" size={20} />,
      change: "-2%",
      positive: false,
    },
    {
      title: "Saldo em Caixa",
      value: "R$ 3.850,00",
      icon: <DollarSign className="text-emerald-500" size={20} />,
      change: "+12%",
      positive: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="stat-card animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-neutral-500">
              {stat.title}
            </span>
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
              {stat.icon}
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-semibold">{stat.value}</span>
            <span
              className={`text-sm ${
                stat.positive ? "text-green-600" : "text-red-600"
              } flex items-center`}
            >
              {stat.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
