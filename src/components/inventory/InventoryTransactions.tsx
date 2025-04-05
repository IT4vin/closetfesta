
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CalendarIcon, 
  FilterIcon,
  DownloadIcon,
  PlusIcon,
  SearchIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const InventoryTransactions = () => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();
  const [searchQuery, setSearchQuery] = useState("");
  const [transactionType, setTransactionType] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTransactionType, setNewTransactionType] = useState("entrada");
  const [newTransactionProduct, setNewTransactionProduct] = useState("");
  const [newTransactionQuantity, setNewTransactionQuantity] = useState("1");
  
  // Dados de exemplo (seriam substituídos por dados reais do backend)
  const transactions = [
    { id: 1, type: "entrada", product: "Vestido de Noiva Sereia", sku: "VN-001", quantity: 2, date: "2025-04-01", user: "Ana Silva" },
    { id: 2, type: "saida", product: "Terno Slim Azul Marinho", sku: "TS-042", quantity: 1, date: "2025-04-02", user: "Carlos Mendes" },
    { id: 3, type: "entrada", product: "Vestido de Dama de Honra Rosa", sku: "VD-023", quantity: 3, date: "2025-04-03", user: "Ana Silva" },
    { id: 4, type: "saida", product: "Smoking Premium", sku: "SM-015", quantity: 1, date: "2025-04-03", user: "Paulo Santos" },
    { id: 5, type: "entrada", product: "Acessório Tiara de Cristal", sku: "AC-107", quantity: 5, date: "2025-04-04", user: "Lucia Ferreira" },
    { id: 6, type: "saida", product: "Vestido de Noiva Princesa", sku: "VN-008", quantity: 1, date: "2025-04-05", user: "Paulo Santos" },
  ];
  
  const filteredTransactions = transactions.filter(transaction => 
    (transactionType === "all" || transaction.type === transactionType) &&
    (transaction.product.toLowerCase().includes(searchQuery.toLowerCase()) || 
     transaction.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const handleNewTransaction = () => {
    toast({
      title: "Transação registrada!",
      description: `${newTransactionType === "entrada" ? "Entrada" : "Saída"} de ${newTransactionQuantity} unidade(s) de ${newTransactionProduct} foi registrada com sucesso.`,
      duration: 3000,
    });
    
    setDialogOpen(false);
    setNewTransactionProduct("");
    setNewTransactionQuantity("1");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Movimentações de Estoque</CardTitle>
              <CardDescription>
                Registro de entradas e saídas de produtos do inventário
              </CardDescription>
            </div>
            
            <Button 
              onClick={() => setDialogOpen(true)}
              className="bg-marsala hover:bg-marsala-700"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Nova Movimentação
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por produto ou SKU"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de Transação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-10 p-0">
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Button variant="outline" className="w-10 p-0">
                <DownloadIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Qtd.</TableHead>
                  <TableHead>Responsável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge className={transaction.type === "entrada" 
                          ? "bg-green-100 text-green-800 border-green-200" 
                          : "bg-red-100 text-red-800 border-red-200"
                        }>
                          {transaction.type === "entrada" 
                            ? <ArrowDownLeft className="h-3 w-3 mr-1 inline" /> 
                            : <ArrowUpRight className="h-3 w-3 mr-1 inline" />
                          }
                          {transaction.type === "entrada" ? "Entrada" : "Saída"}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.product}</TableCell>
                      <TableCell className="font-mono text-sm">{transaction.sku}</TableCell>
                      <TableCell>{transaction.quantity}</TableCell>
                      <TableCell>{transaction.user}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            Exibindo {filteredTransactions.length} de {transactions.length} transações
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Anterior</Button>
            <Button variant="outline" size="sm" disabled>Próxima</Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Dialog para nova transação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Movimentação de Estoque</DialogTitle>
            <DialogDescription>
              Registre entradas e saídas de produtos do inventário
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transaction-type" className="text-right">
                Tipo
              </Label>
              <Select 
                value={newTransactionType} 
                onValueChange={setNewTransactionType}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="product" className="text-right">
                Produto
              </Label>
              <Input
                id="product"
                className="col-span-3"
                placeholder="Nome do produto"
                value={newTransactionProduct}
                onChange={(e) => setNewTransactionProduct(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantidade
              </Label>
              <Input
                id="quantity"
                className="col-span-3"
                type="number"
                min="1"
                value={newTransactionQuantity}
                onChange={(e) => setNewTransactionQuantity(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleNewTransaction} 
              className="bg-marsala hover:bg-marsala-700"
              disabled={!newTransactionProduct}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryTransactions;
