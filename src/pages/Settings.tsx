
import React from "react";
import MainLayout from "@/components/layout/MainLayout";

const Settings = () => {
  return (
    <MainLayout>
      <div className="page-transition">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold mb-2">Configurações</h1>
          <p className="text-neutral-500 text-lg">Personalize o sistema de acordo com suas preferências</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="premium-card p-8">
            <h2 className="text-xl font-medium mb-6">Configurações da Conta</h2>
            <p className="text-neutral-600 text-base mb-4">Ajuste as configurações de:</p>
            <ul className="list-disc list-inside text-neutral-600 space-y-3 text-base">
              <li>Perfil de usuário</li>
              <li>Notificações</li>
              <li>Segurança</li>
            </ul>
          </div>
          <div className="premium-card p-8">
            <h2 className="text-xl font-medium mb-6">Preferências do Sistema</h2>
            <p className="text-neutral-600 text-base">Configure o comportamento do sistema de acordo com as necessidades do seu negócio.</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
