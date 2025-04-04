
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
    
    // Apply color scheme
    const savedColorScheme = localStorage.getItem('colorScheme');
    if (savedColorScheme) {
      // Remove all current color scheme classes
      document.documentElement.classList.remove('theme-marsala', 'theme-blue', 'theme-green', 'theme-purple');
      
      // Add the new color scheme class
      document.documentElement.classList.add(`theme-${savedColorScheme}`);
      
      // Update the CSS variable for primary color based on the scheme
      switch (savedColorScheme) {
        case 'marsala':
          document.documentElement.style.setProperty('--marsala', '353 69% 25%');
          break;
        case 'blue':
          document.documentElement.style.setProperty('--marsala', '210 100% 50%');
          break;
        case 'green':
          document.documentElement.style.setProperty('--marsala', '142 76% 36%');
          break;
        case 'purple':
          document.documentElement.style.setProperty('--marsala', '271 76% 53%');
          break;
      }
    } else {
      // Default to marsala
      document.documentElement.classList.add('theme-marsala');
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
