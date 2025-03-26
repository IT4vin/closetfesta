
import React from "react";
import MainLayout from "@/components/layout/MainLayout";

const Reports = () => {
  return (
    <MainLayout>
      <div className="page-transition">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold mb-2">Relatórios</h1>
          <p className="text-neutral-500 text-lg">Visualize e analise os dados do seu negócio</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="premium-card p-8">
            <h2 className="text-xl font-medium mb-6">Relatórios Disponíveis</h2>
            <p className="text-neutral-600 text-base mb-4">Nesta seção você poderá gerar relatórios de:</p>
            <ul className="list-disc list-inside text-neutral-600 space-y-3 text-base">
              <li>Vendas por período</li>
              <li>Desempenho de produtos</li>
              <li>Histórico de clientes</li>
              <li>Análise financeira</li>
            </ul>
          </div>
          <div className="premium-card p-8">
            <h2 className="text-xl font-medium mb-6">Gráficos e Análises</h2>
            <p className="text-neutral-600 text-base">Visualizações gráficas de dados importantes para análise de desempenho e tomada de decisões.</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Reports;
