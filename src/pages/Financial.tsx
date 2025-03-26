
import React from "react";
import MainLayout from "@/components/layout/MainLayout";

const Financial = () => {
  return (
    <MainLayout>
      <div className="page-transition">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold mb-2">Financeiro</h1>
          <p className="text-neutral-500 text-lg">Gerencie suas finanças e transações</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="premium-card p-8">
            <h2 className="text-xl font-medium mb-6">Resumo Financeiro</h2>
            <p className="text-neutral-600 text-base mb-4">Esta seção permitirá visualizar o resumo financeiro, incluindo:</p>
            <ul className="list-disc list-inside text-neutral-600 space-y-3 text-base">
              <li>Abertura e fechamento de caixa</li>
              <li>Registro de transações</li>
              <li>Balanço diário</li>
            </ul>
          </div>
          <div className="premium-card p-8">
            <h2 className="text-xl font-medium mb-6">Transações Recentes</h2>
            <p className="text-neutral-600 text-base">Aqui serão exibidas as transações mais recentes com status, valores e métodos de pagamento.</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Financial;
