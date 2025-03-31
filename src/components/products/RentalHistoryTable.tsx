
import React from "react";
import { Calendar, User, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RentalHistoryTableProps {
  productId: number;
}

// Sample rental history data (would come from an API in a real app)
const rentalHistory = [
  {
    id: 1,
    productId: 1,
    client: "Maria Oliveira",
    startDate: "2023-09-15",
    endDate: "2023-09-18",
    returnDate: "2023-09-18",
    value: 900,
    status: "completed"
  },
  {
    id: 2,
    productId: 1,
    client: "João Costa",
    startDate: "2023-08-20",
    endDate: "2023-08-22",
    returnDate: "2023-08-23",
    value: 600,
    status: "late"
  },
  {
    id: 3,
    productId: 1,
    client: "Ana Silva",
    startDate: "2023-07-05",
    endDate: "2023-07-07",
    returnDate: "2023-07-07",
    value: 600,
    status: "completed"
  }
];

const RentalHistoryTable: React.FC<RentalHistoryTableProps> = ({ productId }) => {
  // In a real app, you would fetch rental history for this product from an API
  const productRentals = rentalHistory.filter(rental => rental.productId === productId);
  
  if (productRentals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-neutral-500 mb-4">Nenhum histórico de aluguel encontrado para este produto.</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-neutral-50">
          <tr>
            <th className="p-3 text-left font-medium text-neutral-600">Cliente</th>
            <th className="p-3 text-left font-medium text-neutral-600">Período</th>
            <th className="p-3 text-left font-medium text-neutral-600">Devolução</th>
            <th className="p-3 text-left font-medium text-neutral-600">Valor</th>
            <th className="p-3 text-left font-medium text-neutral-600">Status</th>
            <th className="p-3 text-right font-medium text-neutral-600">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {productRentals.map((rental) => (
            <tr key={rental.id} className="hover:bg-neutral-50">
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-neutral-400" />
                  <span>{rental.client}</span>
                </div>
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-neutral-400" />
                  <span>
                    {new Date(rental.startDate).toLocaleDateString('pt-BR')} - {new Date(rental.endDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </td>
              <td className="p-3">
                {new Date(rental.returnDate).toLocaleDateString('pt-BR')}
                {rental.status === 'late' && (
                  <span className="text-red-500 text-xs ml-2">
                    (Atraso: 1 dia)
                  </span>
                )}
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-neutral-400" />
                  <span>R$ {rental.value.toFixed(2)}</span>
                </div>
              </td>
              <td className="p-3">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  rental.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : rental.status === 'late'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {rental.status === 'completed' 
                    ? 'Concluído' 
                    : rental.status === 'late'
                    ? 'Atraso'
                    : 'Ativo'}
                </span>
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
  );
};

export default RentalHistoryTable;
