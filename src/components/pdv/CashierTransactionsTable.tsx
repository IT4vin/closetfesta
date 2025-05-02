
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUp,
  ArrowDown,
  CreditCard,
  ArrowUpDown,
  LockOpen,
} from "lucide-react";

interface CashierMovement {
  id: number;
  type: 'opening' | 'closing' | 'sale' | 'refund' | 'withdrawal' | 'deposit';
  amount: number;
  balance: number;
  description: string;
  createdAt: Date;
  createdBy: string;
}

interface CashierTransactionsTableProps {
  movements: CashierMovement[];
}

const TransactionIcon = ({ type }: { type: CashierMovement['type'] }) => {
  switch (type) {
    case 'opening':
      return <LockOpen size={16} className="text-blue-500" />;
    case 'closing':
      return <LockOpen size={16} className="text-red-500" />;
    case 'sale':
      return <CreditCard size={16} className="text-green-500" />;
    case 'refund':
      return <ArrowUpDown size={16} className="text-orange-500" />;
    case 'withdrawal':
      return <ArrowUp size={16} className="text-red-500" />;
    case 'deposit':
      return <ArrowDown size={16} className="text-green-500" />;
    default:
      return <ArrowUpDown size={16} />;
  }
};

const TransactionBadge = ({ type }: { type: CashierMovement['type'] }) => {
  const styles = {
    opening: "bg-blue-50 text-blue-700 border-blue-200",
    closing: "bg-red-50 text-red-700 border-red-200",
    sale: "bg-green-50 text-green-700 border-green-200",
    refund: "bg-orange-50 text-orange-700 border-orange-200",
    withdrawal: "bg-red-50 text-red-700 border-red-200",
    deposit: "bg-green-50 text-green-700 border-green-200",
  };

  const labels = {
    opening: "Abertura",
    closing: "Fechamento",
    sale: "Venda",
    refund: "Devolução",
    withdrawal: "Sangria",
    deposit: "Reforço",
  };

  return (
    <Badge variant="outline" className={styles[type]}>
      <TransactionIcon type={type} />
      <span className="ml-1">{labels[type]}</span>
    </Badge>
  );
};

const CashierTransactionsTable: React.FC<CashierTransactionsTableProps> = ({ movements }) => {
  if (movements.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md bg-gray-50 dark:bg-gray-800">
        <p className="text-gray-500">Nenhuma movimentação registrada</p>
      </div>
    );
  }

  const reversedMovements = [...movements].reverse(); // Show newest first

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead>Operador</TableHead>
            <TableHead>Data/Hora</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reversedMovements.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell>
                <TransactionBadge type={movement.type} />
              </TableCell>
              <TableCell className="font-medium">{movement.description}</TableCell>
              <TableCell className={`text-right font-medium ${movement.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {movement.amount >= 0 ? '+' : ''}
                {movement.amount.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {movement.balance.toFixed(2)}
              </TableCell>
              <TableCell>{movement.createdBy}</TableCell>
              <TableCell className="text-sm">
                {movement.createdAt.toLocaleDateString('pt-BR')}{' '}
                {movement.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CashierTransactionsTable;
