
import React from "react";
import MainLayout from "@/components/layout/MainLayout";

const Financial = () => {
  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Financeiro</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="premium-card p-6">
            <h2 className="text-lg font-medium mb-4">Resumo Financeiro</h2>
            <p className="text-neutral-600 mb-2">Esta seção permitirá visualizar o resumo financeiro, incluindo:</p>
            <ul className="list-disc list-inside text-neutral-600 space-y-1">
              <li>Abertura e fechamento de caixa</li>
              <li>Registro de transações</li>
              <li>Balanço diário</li>
            </ul>
          </div>
          <div className="premium-card p-6">
            <h2 className="text-lg font-medium mb-4">Transações Recentes</h2>
            <p className="text-neutral-600">Aqui serão exibidas as transações mais recentes com status, valores e métodos de pagamento.</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Financial;
