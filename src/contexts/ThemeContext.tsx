
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

type ThemeType = "light" | "dark";
type FontSizeType = "small" | "medium" | "large" | "xlarge";
type ColorSchemeType = "marsala" | "blue" | "green" | "purple";

interface ThemeContextType {
  theme: ThemeType;
  highContrast: boolean;
  fontSize: FontSizeType;
  colorScheme: ColorSchemeType;
  setTheme: (theme: ThemeType) => void;
  setHighContrast: (highContrast: boolean) => void;
  setFontSize: (fontSize: FontSizeType) => void;
  setColorScheme: (colorScheme: ColorSchemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [theme, setThemeState] = useState<ThemeType>("light");
  const [highContrast, setHighContrastState] = useState(false);
  const [fontSize, setFontSizeState] = useState<FontSizeType>("medium");
  const [colorScheme, setColorSchemeState] = useState<ColorSchemeType>("marsala");

  // Load saved settings on mount
  useEffect(() => {
    // Apply saved theme
    const savedTheme = localStorage.getItem('theme') as ThemeType | null;
    if (savedTheme) {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    }
    
    // Apply saved high contrast setting
    const savedHighContrast = localStorage.getItem('highContrast');
    if (savedHighContrast) {
      setHighContrastState(savedHighContrast === 'true');
      applyHighContrast(savedHighContrast === 'true');
    }
    
    // Apply font size
    const savedFontSize = localStorage.getItem('fontSize') as FontSizeType | null;
    if (savedFontSize) {
      setFontSizeState(savedFontSize);
      applyFontSize(savedFontSize);
    }
    
    // Apply color scheme
    const savedColorScheme = localStorage.getItem('colorScheme') as ColorSchemeType | null;
    if (savedColorScheme) {
      setColorSchemeState(savedColorScheme);
      applyColorScheme(savedColorScheme);
    } else {
      // Default to marsala if no preference saved
      setColorSchemeState("marsala");
      localStorage.setItem('colorScheme', 'marsala');
      applyColorScheme("marsala");
    }
  }, []);

  // Theme change handler
  const setTheme = (value: ThemeType) => {
    setThemeState(value);
    localStorage.setItem('theme', value);
    applyTheme(value);
    
    toast({
      title: "Tema alterado",
      description: `O tema foi alterado para ${value === 'dark' ? 'escuro' : 'claro'}.`,
    });
  };

  const applyTheme = (themeValue: ThemeType) => {
    if (themeValue === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // High contrast change handler
  const setHighContrast = (checked: boolean) => {
    setHighContrastState(checked);
    localStorage.setItem('highContrast', checked.toString());
    applyHighContrast(checked);
    
    toast({
      title: "Contraste alterado",
      description: `Alto contraste ${checked ? 'ativado' : 'desativado'}.`,
    });
  };

  const applyHighContrast = (highContrastValue: boolean) => {
    if (highContrastValue) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };

  // Font size change handler
  const setFontSize = (value: FontSizeType) => {
    setFontSizeState(value);
    localStorage.setItem('fontSize', value);
    applyFontSize(value);
    
    toast({
      title: "Tamanho da fonte alterado",
      description: "O tamanho da fonte foi alterado com sucesso.",
    });
  };

  const applyFontSize = (fontSizeValue: FontSizeType) => {
    switch (fontSizeValue) {
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
  };

  // Color scheme change handler
  const setColorScheme = (value: ColorSchemeType) => {
    setColorSchemeState(value);
    localStorage.setItem('colorScheme', value);
    applyColorScheme(value);
    
    toast({
      title: "Esquema de cores alterado",
      description: `O esquema de cores foi alterado para ${value}.`,
    });
  };

  const applyColorScheme = (colorSchemeValue: ColorSchemeType) => {
    // Remove all current color scheme classes
    document.documentElement.classList.remove('theme-marsala', 'theme-blue', 'theme-green', 'theme-purple');
    
    // Add the new color scheme class
    document.documentElement.classList.add(`theme-${colorSchemeValue}`);
    
    // Update the CSS variable for primary color based on the scheme
    switch (colorSchemeValue) {
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
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        highContrast,
        fontSize,
        colorScheme,
        setTheme,
        setHighContrast,
        setFontSize,
        setColorScheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
