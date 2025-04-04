
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import SettingsTabs from "@/components/settings/SettingsTabs";

const Settings = () => {
  return (
    <MainLayout>
      <div className="page-transition">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold mb-2">Configurações</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-lg">Personalize o sistema de acordo com suas preferências</p>
        </header>
        
        <SettingsTabs />
      </div>
    </MainLayout>
  );
};

export default Settings;
