
import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Send, RotateCcw, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

// Dados de exemplo (seriam substituídos por dados reais do backend)
const lateReturnsData = [
  {
    id: "1",
    dressName: "Vestido Sereia Azul",
    client: "Maria Oliveira",
    expectedReturn: new Date(2023, 5, 15),
    daysLate: 12,
    fineAmount: 480.00,
    imageUrl: "/placeholder.svg"
  },
  {
    id: "2",
    dressName: "Vestido Princesa Rosa",
    client: "Ana Carolina",
    expectedReturn: new Date(2023, 5, 18),
    daysLate: 9,
    fineAmount: 360.00,
    imageUrl: "/placeholder.svg"
  },
  {
    id: "3",
    dressName: "Vestido Longo Dourado",
    client: "Isabela Santos",
    expectedReturn: new Date(2023, 5, 20),
    daysLate: 7,
    fineAmount: 280.00,
    imageUrl: "/placeholder.svg"
  }
];

const LateReturns = () => {
  const { toast } = useToast();

  const handleRegisterReturn = (id: string) => {
    toast({
      title: "Devolução registrada",
      description: `Vestido ID: ${id} foi devolvido com sucesso.`,
    });
  };

  const handleSendReminder = (id: string) => {
    toast({
      title: "Lembrete enviado",
      description: `Lembrete enviado para o cliente do vestido ID: ${id}.`,
    });
  };

  const handleCalculateFine = (id: string) => {
    toast({
      title: "Multa calculada",
      description: `Multa atualizada para o vestido ID: ${id}.`,
    });
  };

  return (
    <div className="premium-card overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Clock size={20} className="text-red-600" />
            </div>
            <h2 className="text-lg font-semibold">Em Atraso</h2>
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
              <TableHead>Data Prevista</TableHead>
              <TableHead>Dias em Atraso</TableHead>
              <TableHead>Multa</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lateReturnsData.map((item) => (
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
                <TableCell>
                  {format(item.expectedReturn, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <span className="text-red-600 font-medium">{item.daysLate} dias</span>
                </TableCell>
                <TableCell>
                  <span className="font-medium">R$ {item.fineAmount.toFixed(2)}</span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handleRegisterReturn(item.id)}
                    >
                      <RotateCcw size={14} />
                      <span className="sr-only sm:not-sr-only sm:ml-2">Devolvido</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handleSendReminder(item.id)}
                    >
                      <Send size={14} />
                      <span className="sr-only sm:not-sr-only sm:ml-2">Lembrete</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handleCalculateFine(item.id)}
                    >
                      <Calculator size={14} />
                      <span className="sr-only sm:not-sr-only sm:ml-2">Calcular</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LateReturns;
