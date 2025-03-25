
import React from "react";
import MainLayout from "@/components/layout/MainLayout";

const Settings = () => {
  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Configurações</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="premium-card p-6">
            <h2 className="text-lg font-medium mb-4">Configurações da Conta</h2>
            <p className="text-neutral-600 mb-2">Ajuste as configurações de:</p>
            <ul className="list-disc list-inside text-neutral-600 space-y-1">
              <li>Perfil de usuário</li>
              <li>Notificações</li>
              <li>Segurança</li>
            </ul>
          </div>
          <div className="premium-card p-6">
            <h2 className="text-lg font-medium mb-4">Preferências do Sistema</h2>
            <p className="text-neutral-600">Configure o comportamento do sistema de acordo com as necessidades do seu negócio.</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
