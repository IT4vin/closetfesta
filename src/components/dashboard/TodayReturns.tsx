
import React from "react";
import { Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

// Dados de exemplo (seriam substituídos por dados reais do backend)
const todayReturnsData = [
  {
    id: "1",
    dressName: "Vestido Tubinho Preto",
    client: "Juliana Alves",
    scheduledTime: "10:30",
    status: "confirmado",
    imageUrl: "/placeholder.svg"
  },
  {
    id: "2",
    dressName: "Vestido Gode Vermelho",
    client: "Carla Sousa",
    scheduledTime: "14:00",
    status: "pendente",
    imageUrl: "/placeholder.svg"
  },
  {
    id: "3",
    dressName: "Vestido Longo Verde",
    client: "Patrícia Lima",
    scheduledTime: "16:30",
    status: "confirmado",
    imageUrl: "/placeholder.svg"
  }
];

const TodayReturns = () => {
  const { toast } = useToast();

  const handleMarkAsReturned = (id: string) => {
    toast({
      title: "Devolução registrada",
      description: `Vestido ID: ${id} foi marcado como devolvido.`,
    });
  };

  return (
    <div className="premium-card overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock size={20} className="text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold">Entregas para Hoje</h2>
          </div>
          <Button variant="outline" size="sm">Ver todos</Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vestido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {todayReturnsData.map((item) => (
              <TableRow key={item.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-gray-100 overflow-hidden">
                      <img src={item.imageUrl} alt={item.dressName} className="w-full h-full object-cover" />
                    </div>
                    <span>{item.dressName}</span>
                  </div>
                </TableCell>
                <TableCell>{item.client}</TableCell>
                <TableCell>{item.scheduledTime}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === "confirmado" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {item.status === "confirmado" ? "Confirmado" : "Pendente"}
                  </span>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => handleMarkAsReturned(item.id)}
                  >
                    <Check size={14} className="mr-2" />
                    Marcar como Devolvido
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TodayReturns;
