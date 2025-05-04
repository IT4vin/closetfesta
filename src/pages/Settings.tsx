
import React from "react";
import SettingsTabs from "@/components/settings/SettingsTabs";
import UserProfileSettings from "@/components/settings/UserProfileSettings";

const Settings = () => {
  return (
    <div className="page-transition w-full max-w-full">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold mb-2">Configurações</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-lg">Personalize o sistema de acordo com suas preferências</p>
      </header>
      
      <div className="space-y-8 pb-8">
        <UserProfileSettings />
        <SettingsTabs />
      </div>
    </div>
  );
};

export default Settings;
