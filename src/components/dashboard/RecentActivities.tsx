
import React from "react";
import { Calendar, CreditCard, UserRound, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Activity {
  id: string;
  type: "rental" | "return" | "sale" | "client";
  title: string;
  description: string;
  time: string;
}

const activityIcons = {
  rental: <Calendar size={16} className="text-blue-500" />,
  return: <Calendar size={16} className="text-green-500" />,
  sale: <ShoppingBag size={16} className="text-marsala" />,
  client: <UserRound size={16} className="text-purple-500" />
};

const RecentActivities = () => {
  // Dados de exemplo (seriam substituídos por dados reais do backend)
  const activities: Activity[] = [
    {
      id: "1",
      type: "rental",
      title: "Novo Aluguel",
      description: "Vestido de Noiva para Maria Silva",
      time: "10:25"
    },
    {
      id: "2",
      type: "sale",
      title: "Nova Venda",
      description: "Acessórios para João Paulo",
      time: "09:40"
    },
    {
      id: "3",
      type: "client",
      title: "Cliente Adicionado",
      description: "Fernanda Costa foi cadastrada",
      time: "Ontem"
    },
    {
      id: "4",
      type: "return",
      title: "Devolução",
      description: "Terno devolvido por Carlos Mendes",
      time: "Ontem"
    }
  ];

  return (
    <div className="premium-card overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Atividades Recentes</h2>
          <Button variant="outline" size="sm">Ver todas</Button>
        </div>
      </div>
      
      <div className="divide-y divide-gray-100">
        {activities.map((activity) => (
          <div key={activity.id} className="p-5 hover:bg-gray-50 transition-colors duration-150">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                {activityIcons[activity.type]}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="font-medium">{activity.title}</h3>
                  <span className="text-gray-500 text-sm">{activity.time}</span>
                </div>
                <p className="text-gray-500 text-sm">{activity.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivities;
