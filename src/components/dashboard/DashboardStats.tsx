
import React from "react";
import { ShoppingBag, Shirt, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const DashboardStats = () => {
  // In a real app, this would come from an API or context
  const stats = [
    {
      title: "Vendas Hoje",
      value: 5,
      icon: <ShoppingBag className="text-marsala" size={24} />,
      change: "+20%",
      positive: true,
    },
    {
      title: "Aluguéis Ativos",
      value: 12,
      icon: <Shirt className="text-blue-500" size={24} />,
      change: "+5%",
      positive: true,
    },
    {
      title: "Provas Agendadas",
      value: 8,
      icon: <Calendar className="text-amber-500" size={24} />,
      change: "-2%",
      positive: false,
    },
    {
      title: "Saldo em Caixa",
      value: "R$ 3.850,00",
      icon: <DollarSign className="text-emerald-500" size={24} />,
      change: "+12%",
      positive: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card 
          key={index}
          className="stat-card animate-fade-in hover:shadow-md transition-all duration-300"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-base font-medium text-neutral-600">
                {stat.title}
              </span>
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
                {stat.icon}
              </div>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-semibold">{stat.value}</span>
              <span
                className={`text-base ${
                  stat.positive ? "text-green-600" : "text-red-600"
                } flex items-center`}
              >
                {stat.change}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
