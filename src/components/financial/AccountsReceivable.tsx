
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Download, 
  Filter, 
  MoreHorizontal, 
  Search, 
  User, 
  X 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AccountsReceivable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Mock data
  const receivables = [
    {
      id: "REC-001",
      client: "Maria Silva",
      description: "Aluguel de Vestido #V-2354",
      amount: "R$ 350,00",
      dueDate: "10/04/2025",
      status: "pending",
      daysLeft: -5,
      paymentMethod: "Cartão de Crédito"
    },
    {
      id: "REC-002",
      client: "João Pereira",
      description: "Aluguel de Terno #T-1122",
      amount: "R$ 280,00",
      dueDate: "15/04/2025",
      status: "pending",
      daysLeft: 3,
      paymentMethod: "PIX"
    },
    {
      id: "REC-003",
      client: "Carla Mendes",
      description: "Venda de Acessórios",
      amount: "R$ 150,00",
      dueDate: "22/03/2025",
      status: "paid",
      daysLeft: 0,
      paymentMethod: "Dinheiro"
    },
    {
      id: "REC-004",
      client: "Paulo Santos",
      description: "Aluguel de Vestidos (3 itens)",
      amount: "R$ 780,00",
      dueDate: "30/04/2025",
      status: "pending",
      daysLeft: 18,
      paymentMethod: "Boleto"
    },
    {
      id: "REC-005",
      client: "Amanda Oliveira",
      description: "Venda de Vestido #V-4562",
      amount: "R$ 1.200,00",
      dueDate: "05/04/2025",
      status: "overdue",
      daysLeft: -10,
      paymentMethod: "Parcelado (3x)"
    },
  ];
  
  // Filter receivables based on search and filters
  const filteredReceivables = receivables.filter(rec => {
    // Search filter
    if (searchTerm && !rec.client.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !rec.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !rec.id.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (statusFilter && rec.status !== statusFilter) {
      return false;
    }
    
    return true;
  });
  
  // Status badge styling
  const getStatusBadge = (status: string, daysLeft: number) => {
    if (status === 'paid') {
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Pago</Badge>;
    } else if (status === 'pending') {
      return daysLeft < 0 
        ? <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Em Atraso</Badge>
        : <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Pendente</Badge>;
    } else if (status === 'overdue') {
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Em Atraso</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Contas a Receber</CardTitle>
              <CardDescription>
                Gerencie todos os valores pendentes de recebimento
              </CardDescription>
            </div>
            <div>
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="mr-2">
                <Filter size={16} className="mr-2" />
                Filtros
              </Button>
              <Button size="sm">
                <Download size={16} className="mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="pb-0 border-b">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm mb-2">Pesquisar</p>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                  <Input
                    type="text"
                    placeholder="Cliente, descrição ou ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="w-[180px]">
                <p className="text-sm mb-2">Status</p>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="overdue">Em Atraso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-[180px]">
                <p className="text-sm mb-2">Vencimento</p>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Esta semana</SelectItem>
                    <SelectItem value="month">Este mês</SelectItem>
                    <SelectItem value="overdue">Em atraso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-[180px]">
                <p className="text-sm mb-2">Forma de Pagamento</p>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="credit">Cartão de Crédito</SelectItem>
                    <SelectItem value="debit">Cartão de Débito</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="bank">Transferência</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end mb-1">
                <Button variant="ghost" size="sm" onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  // Reset other filters
                }}>
                  <X size={14} className="mr-1" />
                  Limpar filtros
                </Button>
              </div>
            </div>
          </CardContent>
        )}
        
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden sm:table-cell">Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="hidden md:table-cell">Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Forma de Pagamento</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceivables.length > 0 ? (
                  filteredReceivables.map((receivable) => (
                    <TableRow key={receivable.id}>
                      <TableCell>{receivable.id}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-neutral-400" />
                          {receivable.client}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{receivable.description}</TableCell>
                      <TableCell className="font-medium">{receivable.amount}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1 text-neutral-400" />
                          {receivable.dueDate}
                          {receivable.daysLeft !== 0 && (
                            <span className={`text-xs ml-2 ${receivable.daysLeft < 0 ? 'text-red-500' : 'text-neutral-500'}`}>
                              {receivable.daysLeft < 0 
                                ? `${Math.abs(receivable.daysLeft)} dias de atraso` 
                                : `em ${receivable.daysLeft} dias`}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(receivable.status, receivable.daysLeft)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{receivable.paymentMethod}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer">
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              <span>Marcar como pago</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Clock className="mr-2 h-4 w-4" />
                              <span>Adiar vencimento</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer text-destructive">
                              <X className="mr-2 h-4 w-4" />
                              <span>Excluir</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-neutral-500">
                      Nenhuma conta a receber encontrada com os filtros selecionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-neutral-500">
              Mostrando {filteredReceivables.length} de {receivables.length} registros
            </p>
            
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
              <Button variant="outline" size="sm" className="bg-neutral-100">
                1
              </Button>
              <Button variant="outline" size="sm">
                Próximo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountsReceivable;
