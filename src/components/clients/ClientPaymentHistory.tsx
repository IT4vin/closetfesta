
import React from "react";
import { DollarSign, Calendar, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClientPaymentHistoryProps {
  clientId: number;
}

// Sample payment history data (would come from an API in a real app)
const paymentHistory = [
  {
    id: 1,
    clientId: 1,
    description: "Aluguel Vestido de Noiva",
    date: "2023-10-15",
    value: 450,
    method: "pix",
    status: "paid",
    reference: "AL12345"
  },
  {
    id: 2,
    clientId: 1,
    description: "Aluguel Vestido de Noiva (2ª parcela)",
    date: "2023-10-18",
    value: 450,
    method: "credit",
    status: "paid",
    reference: "AL12345"
  },
  {
    id: 3,
    clientId: 1,
    description: "Aluguel Terno Preto",
    date: "2023-09-20",
    value: 180,
    method: "credit",
    status: "paid",
    reference: "AL12346"
  },
  {
    id: 4,
    clientId: 1,
    description: "Aluguel Terno Preto (2ª parcela)",
    date: "2023-09-22",
    value: 180,
    method: "credit",
    status: "paid",
    reference: "AL12346"
  }
];

const ClientPaymentHistory: React.FC<ClientPaymentHistoryProps> = ({ clientId }) => {
  // In a real app, you would fetch payment history for this client from an API
  const clientPayments = paymentHistory.filter(payment => payment.clientId === clientId);
  
  if (clientPayments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-neutral-500 mb-4">Este cliente ainda não possui histórico de pagamentos.</p>
      </div>
    );
  }
  
  // Calculate totals for the summary
  const totalPaid = clientPayments.reduce((sum, payment) => 
    payment.status === 'paid' ? sum + payment.value : sum, 0
  );
  
  const totalPending = clientPayments.reduce((sum, payment) => 
    payment.status === 'pending' ? sum + payment.value : sum, 0
  );
  
  return (
    <div>
      {/* Payment Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border border-neutral-200 rounded-md p-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-green-500" />
            <h3 className="font-medium">Total Pago</h3>
          </div>
          <p className="text-xl font-semibold mt-2 text-green-600">R$ {totalPaid.toFixed(2)}</p>
        </div>
        
        <div className="border border-neutral-200 rounded-md p-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-500" />
            <h3 className="font-medium">Pagamentos Pendentes</h3>
          </div>
          <p className="text-xl font-semibold mt-2 text-amber-600">R$ {totalPending.toFixed(2)}</p>
        </div>
      </div>
      
      {/* Payment History Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th className="p-3 text-left font-medium text-neutral-600">Descrição</th>
              <th className="p-3 text-left font-medium text-neutral-600">Data</th>
              <th className="p-3 text-left font-medium text-neutral-600">Valor</th>
              <th className="p-3 text-left font-medium text-neutral-600">Método</th>
              <th className="p-3 text-left font-medium text-neutral-600">Status</th>
              <th className="p-3 text-right font-medium text-neutral-600">Referência</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {clientPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-neutral-50">
                <td className="p-3">
                  {payment.description}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-neutral-400" />
                    <span>{new Date(payment.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-neutral-400" />
                    <span>R$ {payment.value.toFixed(2)}</span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-neutral-400" />
                    <span>
                      {payment.method === 'credit' 
                        ? 'Cartão de Crédito' 
                        : payment.method === 'pix'
                        ? 'PIX'
                        : 'Dinheiro'}
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    payment.status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {payment.status === 'paid' ? 'Pago' : 'Pendente'}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="sm">
                    {payment.reference}
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

export default ClientPaymentHistory;
