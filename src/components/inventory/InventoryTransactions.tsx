
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Calendar as CalendarIcon,
  Search,
  ArrowDownUp,
  ArrowDown,
  ArrowUp,
  Filter,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Mock de dados para transações
const mockTransactions = [
  {
    id: 1,
    date: "2025-04-01T10:30:00",
    type: "entrada",
    productSku: "VEST-001",
    productName: "Vestido de Noiva Elegance",
    quantity: 2,
    reason: "Compra de fornecedor",
    user: "Ana Silva"
  },
  {
    id: 2,
    date: "2025-04-02T14:15:00",
    type: "saida",
    productSku: "VEST-001",
    productName: "Vestido de Noiva Elegance",
    quantity: 1,
    reason: "Aluguel para cliente",
    user: "Carlos Santos"
  },
  {
    id: 3,
    date: "2025-04-02T16:45:00",
    type: "entrada",
    productSku: "TERN-002",
    productName: "Smoking Azul Marinho",
    quantity: 1,
    reason: "Devolução de aluguel",
    user: "Maria Oliveira"
  },
  {
    id: 4,
    date: "2025-04-03T09:20:00",
    type: "saida",
    productSku: "VEST-002",
    productName: "Vestido Madrinha Rose",
    quantity: 1,
    reason: "Aluguel para cliente",
    user: "Ana Silva"
  },
  {
    id: 5,
    date: "2025-04-03T11:10:00",
    type: "saida",
    productSku: "TERN-001",
    productName: "Terno Preto Classic",
    quantity: 1,
    reason: "Manutenção",
    user: "Paulo Costa"
  }
];

const InventoryTransactions = () => {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  
  // Filtrar transações
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      transaction.productSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reason.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesType = typeFilter === "" || transaction.type === typeFilter;
    
    const transactionDate = new Date(transaction.date);
    const matchesDateFrom = !dateFrom || transactionDate >= dateFrom;
    const matchesDateTo = !dateTo || transactionDate <= dateTo;
    
    return matchesSearch && matchesType && matchesDateFrom && matchesDateTo;
  });
  
  // Registrar nova movimentação (apenas simulação)
  const handleNewTransaction = () => {
    // Este seria um modal ou formulário para registrar uma nova movimentação
    console.log("Abrir formulário para nova movimentação");
  };
  
  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
    setDateFrom(undefined);
    setDateTo(undefined);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transações..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="entrada">Entrada</SelectItem>
              <SelectItem value="saida">Saída</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-[130px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Data inicial"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-[130px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "dd/MM/yyyy") : "Data final"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="icon" onClick={clearFilters}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            onClick={handleNewTransaction} 
            className="bg-marsala hover:bg-marsala-700"
          >
            <ArrowDownUp className="h-4 w-4 mr-2" />
            Nova Movimentação
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Histórico de Movimentações</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Qtde</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Usuário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map(transaction => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {format(new Date(transaction.date), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {transaction.type === 'entrada' ? (
                        <ArrowDown className="h-4 w-4 text-green-600 mr-2" />
                      ) : (
                        <ArrowUp className="h-4 w-4 text-red-600 mr-2" />
                      )}
                      {transaction.type === 'entrada' ? 'Entrada' : 'Saída'}
                    </div>
                  </TableCell>
                  <TableCell>{transaction.productSku}</TableCell>
                  <TableCell>{transaction.productName}</TableCell>
                  <TableCell>{transaction.quantity}</TableCell>
                  <TableCell>{transaction.reason}</TableCell>
                  <TableCell>{transaction.user}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryTransactions;
