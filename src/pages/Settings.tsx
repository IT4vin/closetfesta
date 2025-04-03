
import React, { useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import SettingsTabs from "@/components/settings/SettingsTabs";

const Settings = () => {
  // Apply any saved theme settings when the settings page loads
  useEffect(() => {
    // Apply saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Apply saved high contrast setting
    const savedHighContrast = localStorage.getItem('highContrast');
    if (savedHighContrast === 'true') {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    // Apply font size
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
      switch (savedFontSize) {
        case 'small':
          document.documentElement.style.fontSize = '14px';
          break;
        case 'medium':
          document.documentElement.style.fontSize = '16px';
          break;
        case 'large':
          document.documentElement.style.fontSize = '18px';
          break;
        case 'xlarge':
          document.documentElement.style.fontSize = '20px';
          break;
      }
    }
  }, []);

  return (
    <MainLayout>
      <div className="page-transition">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold mb-2">Configurações</h1>
          <p className="text-neutral-500 text-lg">Personalize o sistema de acordo com suas preferências</p>
        </header>
        
        <SettingsTabs />
      </div>
    </MainLayout>
  );
};

export default Settings;
