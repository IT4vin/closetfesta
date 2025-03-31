
import React from "react";
import { Calendar, Scissors, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MaintenanceHistoryTableProps {
  productId: number;
}

// Sample maintenance history data (would come from an API in a real app)
const maintenanceHistory = [
  {
    id: 1,
    productId: 1,
    type: "Limpeza",
    date: "2023-10-05",
    description: "Limpeza a seco completa",
    cost: 150,
    performedBy: "Limpeza Express"
  },
  {
    id: 2,
    productId: 1,
    type: "Reparo",
    date: "2023-08-10",
    description: "Reparo na barra do vestido",
    cost: 80,
    performedBy: "Maria Costura"
  }
];

const MaintenanceHistoryTable: React.FC<MaintenanceHistoryTableProps> = ({ productId }) => {
  // In a real app, you would fetch maintenance history for this product from an API
  const productMaintenance = maintenanceHistory.filter(item => item.productId === productId);
  
  if (productMaintenance.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-neutral-500 mb-4">Nenhum histórico de manutenção encontrado para este produto.</p>
        <Button className="bg-marsala hover:bg-marsala-700">
          <Scissors size={18} className="mr-2" />
          <span>Agendar Manutenção</span>
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button className="bg-marsala hover:bg-marsala-700">
          <Scissors size={18} className="mr-2" />
          <span>Agendar Manutenção</span>
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th className="p-3 text-left font-medium text-neutral-600">Tipo</th>
              <th className="p-3 text-left font-medium text-neutral-600">Data</th>
              <th className="p-3 text-left font-medium text-neutral-600">Descrição</th>
              <th className="p-3 text-left font-medium text-neutral-600">Custo</th>
              <th className="p-3 text-left font-medium text-neutral-600">Realizado por</th>
              <th className="p-3 text-right font-medium text-neutral-600">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {productMaintenance.map((item) => (
              <tr key={item.id} className="hover:bg-neutral-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Scissors size={16} className="text-neutral-400" />
                    <span>{item.type}</span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-neutral-400" />
                    <span>{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                </td>
                <td className="p-3">{item.description}</td>
                <td className="p-3">R$ {item.cost.toFixed(2)}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-neutral-400" />
                    <span>{item.performedBy}</span>
                  </div>
                </td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="sm">
                    Detalhes
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaintenanceHistoryTable;
