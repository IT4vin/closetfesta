
import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown
} from "lucide-react";

// Financial events component
const UpcomingFinancialEvents = () => {
  const events = [
    { 
      title: "Pagamento de Aluguel", 
      value: "R$ 5.000,00", 
      date: "15/04/2025", 
      type: "expense",
      daysLeft: 3
    },
    { 
      title: "Recebimento Cliente #1542", 
      value: "R$ 3.200,00", 
      date: "16/04/2025", 
      type: "income",
      daysLeft: 4
    },
    { 
      title: "Folha de Pagamento", 
      value: "R$ 8.500,00", 
      date: "30/04/2025", 
      type: "expense",
      daysLeft: 18
    },
    { 
      title: "Recebimento Cliente #1498", 
      value: "R$ 1.800,00", 
      date: "05/05/2025", 
      type: "income",
      daysLeft: 23
    }
  ];

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Próximos Eventos Financeiros</CardTitle>
        <CardDescription>
          Pagamentos e recebimentos previstos para os próximos dias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${event.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {event.type === 'income' ? 
                    <ArrowUp size={18} className="text-green-600" /> : 
                    <ArrowDown size={18} className="text-red-600" />
                  }
                </div>
                <div>
                  <h4 className="font-medium">{event.title}</h4>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar size={14} className="mr-1" />
                    {event.date}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${event.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {event.type === 'income' ? '+' : '-'}{event.value}
                </p>
                <div className="flex items-center text-sm text-gray-500 justify-end">
                  <Clock size={14} className="mr-1" />
                  <span>Em {event.daysLeft} dias</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingFinancialEvents;
