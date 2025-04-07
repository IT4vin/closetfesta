
import React, { useState } from "react";
import { FileText, Download, Filter, FileBarChart, BarChart3, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

const ReportCard = ({ title, description, icon }) => (
  <Card className="cursor-pointer hover:shadow-md transition-all duration-200">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-lg font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <CardDescription>{description}</CardDescription>
    </CardContent>
  </Card>
);

const Reports = () => {
  // Dados de exemplo para os gráficos
  const monthlyData = [
    { name: 'Jan', alugueis: 12, vendas: 4 },
    { name: 'Fev', alugueis: 19, vendas: 3 },
    { name: 'Mar', alugueis: 15, vendas: 5 },
    { name: 'Abr', alugueis: 18, vendas: 2 },
    { name: 'Mai', alugueis: 21, vendas: 6 },
    { name: 'Jun', alugueis: 25, vendas: 8 },
  ];

  const categoryData = [
    { name: 'Vestido', quantidade: 45 },
    { name: 'Terno', quantidade: 32 },
    { name: 'Acessório', quantidade: 18 },
    { name: 'Outro', quantidade: 5 },
  ];

  return (
    <div className="page-transition space-y-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Relatórios</h1>
          <p className="text-neutral-500">Visualize e exporte dados do seu negócio</p>
        </div>
        
        <div className="flex gap-2">
          <Select defaultValue="month">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="quarter">Este Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-marsala hover:bg-marsala-700">
                <Download size={18} className="mr-2" />
                <span>Exportar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <FileText size={16} className="mr-2" />
                <span>PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileBarChart size={16} className="mr-2" />
                <span>Excel</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Filter size={16} className="mr-2" />
                <span>Exportar com filtros</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReportCard 
          title="Relatório de Vendas" 
          description="Resumo de vendas e aluguéis por período"
          icon={<BarChart3 size={20} className="text-marsala" />}
        />
        <ReportCard 
          title="Relatório de Clientes" 
          description="Análise de clientes e frequência de compras"
          icon={<BarChart3 size={20} className="text-blue-500" />}
        />
        <ReportCard 
          title="Relatório Financeiro" 
          description="Receitas, despesas e lucratividade"
          icon={<BarChart3 size={20} className="text-green-500" />}
        />
      </section>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <Card className="p-4">
            <CardHeader>
              <CardTitle>Vendas e Aluguéis por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="alugueis" fill="#8884d8" name="Aluguéis" />
                    <Bar dataKey="vendas" fill="#82ca9d" name="Vendas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <CardHeader>
                <CardTitle>Produtos por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={categoryData}
                      margin={{ top: 20, right: 30, left: 50, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Bar dataKey="quantidade" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="p-4">
              <CardHeader>
                <CardTitle>Tendência de Receita</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="alugueis" stroke="#8884d8" activeDot={{ r: 8 }} name="Aluguéis" />
                      <Line type="monotone" dataKey="vendas" stroke="#82ca9d" name="Vendas" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Produtos</CardTitle>
              <CardDescription>
                Detalhes sobre desempenho de produtos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-6 text-neutral-500">
                Selecione um tipo de relatório para visualizar os dados
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Clientes</CardTitle>
              <CardDescription>
                Detalhes sobre clientes e comportamento de compra
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-6 text-neutral-500">
                Selecione um tipo de relatório para visualizar os dados
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>Análise Financeira</CardTitle>
              <CardDescription>
                Detalhes sobre receitas, despesas e lucratividade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-6 text-neutral-500">
                Selecione um tipo de relatório para visualizar os dados
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
