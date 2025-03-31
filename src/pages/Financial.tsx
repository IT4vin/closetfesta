
import React, { useState } from "react";
import { 
  Plus, 
  Download, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Search
} from "lucide-react";
import MainLayout from "../components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Componente para Formulário de Nova Transação
const NewTransactionForm = ({ onClose }) => {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Descrição</label>
        <Input placeholder="Ex: Aluguel de vestido" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Valor</label>
          <Input type="number" placeholder="R$ 0,00" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Data</label>
          <Input type="date" />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Tipo</label>
        <Select defaultValue="income">
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="income">Receita</SelectItem>
            <SelectItem value="expense">Despesa</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Categoria</label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rental">Aluguel</SelectItem>
            <SelectItem value="sale">Venda</SelectItem>
            <SelectItem value="maintenance">Manutenção</SelectItem>
            <SelectItem value="supplies">Suprimentos</SelectItem>
            <SelectItem value="rent">Aluguel do Espaço</SelectItem>
            <SelectItem value="salary">Salários</SelectItem>
            <SelectItem value="other">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Observações</label>
        <Input placeholder="Observações adicionais" />
      </div>
      
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancelar</Button>
        </DialogClose>
        <Button className="bg-marsala hover:bg-marsala-700">Salvar</Button>
      </DialogFooter>
    </div>
  );
};

const Financial = () => {
  const [newTransactionOpen, setNewTransactionOpen] = useState(false);
  
  // Dados de exemplo
  const transactions = [
    { id: 1, description: "Aluguel de Vestido - Maria Silva", type: "income", category: "Aluguel", amount: 950, date: "2023-07-15" },
    { id: 2, description: "Compra de Tecidos", type: "expense", category: "Suprimentos", amount: 450, date: "2023-07-12" },
    { id: 3, description: "Venda de Acessórios", type: "income", category: "Venda", amount: 350, date: "2023-07-10" },
    { id: 4, description: "Manutenção de Vestido", type: "expense", category: "Manutenção", amount: 180, date: "2023-07-08" },
    { id: 5, description: "Aluguel de Terno - João Paulo", type: "income", category: "Aluguel", amount: 750, date: "2023-07-05" },
    { id: 6, description: "Aluguel do Espaço", type: "expense", category: "Aluguel", amount: 1200, date: "2023-07-01" },
  ];
  
  // Cálculo de totais
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = totalIncome - totalExpense;

  return (
    <MainLayout>
      <div className="page-transition space-y-6">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Financeiro</h1>
            <p className="text-neutral-500">Gerencie receitas e despesas</p>
          </div>
          
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="border-marsala text-marsala hover:bg-marsala/10"
              onClick={() => {}}
            >
              <Download size={18} className="mr-2" />
              <span>Exportar</span>
            </Button>
            
            <Button 
              className="bg-marsala hover:bg-marsala-700 text-white"
              onClick={() => setNewTransactionOpen(true)}
            >
              <Plus size={18} className="mr-2" />
              <span>Nova Transação</span>
            </Button>
          </div>
        </header>
        
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">
                Receitas
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalIncome.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">
                Despesas
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalExpense.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">
                Saldo
              </CardTitle>
              <DollarSign className="h-4 w-4 text-marsala" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {balance.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </section>
        
        <section className="space-y-4">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="income">Receitas</TabsTrigger>
                <TabsTrigger value="expense">Despesas</TabsTrigger>
              </TabsList>
              
              <div className="flex w-full md:w-auto gap-2">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-400" />
                  <Input placeholder="Pesquisar transações" className="pl-8" />
                </div>
                
                <Select defaultValue="month">
                  <SelectTrigger className="w-[150px]">
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Esta Semana</SelectItem>
                    <SelectItem value="month">Este Mês</SelectItem>
                    <SelectItem value="quarter">Trimestre</SelectItem>
                    <SelectItem value="year">Este Ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <TabsContent value="all" className="mt-0">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.description}</TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell>{new Date(transaction.date).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell className={`text-right ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="income" className="mt-0">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions
                        .filter(t => t.type === 'income')
                        .map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">{transaction.description}</TableCell>
                            <TableCell>{transaction.category}</TableCell>
                            <TableCell>{new Date(transaction.date).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell className="text-right text-green-600">
                              + R$ {transaction.amount.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="expense" className="mt-0">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions
                        .filter(t => t.type === 'expense')
                        .map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">{transaction.description}</TableCell>
                            <TableCell>{transaction.category}</TableCell>
                            <TableCell>{new Date(transaction.date).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell className="text-right text-red-600">
                              - R$ {transaction.amount.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
        
        {/* Nova Transação Dialog */}
        <Dialog open={newTransactionOpen} onOpenChange={setNewTransactionOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Nova Transação</DialogTitle>
            </DialogHeader>
            <NewTransactionForm onClose={() => setNewTransactionOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Financial;
