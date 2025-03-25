
import React from "react";
import MainLayout from "@/components/layout/MainLayout";

const Reports = () => {
  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Relatórios</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="premium-card p-6">
            <h2 className="text-lg font-medium mb-4">Relatórios Disponíveis</h2>
            <p className="text-neutral-600 mb-2">Nesta seção você poderá gerar relatórios de:</p>
            <ul className="list-disc list-inside text-neutral-600 space-y-1">
              <li>Vendas por período</li>
              <li>Desempenho de produtos</li>
              <li>Histórico de clientes</li>
              <li>Análise financeira</li>
            </ul>
          </div>
          <div className="premium-card p-6">
            <h2 className="text-lg font-medium mb-4">Gráficos e Análises</h2>
            <p className="text-neutral-600">Visualizações gráficas de dados importantes para análise de desempenho e tomada de decisões.</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Reports;
