
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Palette, Moon, Sun, Eye } from "lucide-react";

const SystemPersonalization = () => {
  const { toast } = useToast();
  const [theme, setTheme] = useState("light");
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState("medium");
  const [colorScheme, setColorScheme] = useState("marsala");

  // Load saved settings on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
    
    const savedHighContrast = localStorage.getItem('highContrast');
    if (savedHighContrast) {
      setHighContrast(savedHighContrast === 'true');
      applyHighContrast(savedHighContrast === 'true');
    }
    
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
      setFontSize(savedFontSize);
      applyFontSize(savedFontSize);
    }
    
    const savedColorScheme = localStorage.getItem('colorScheme');
    if (savedColorScheme) {
      setColorScheme(savedColorScheme);
      applyColorScheme(savedColorScheme);
    } else {
      // Default to marsala if no preference saved
      setColorScheme("marsala");
      localStorage.setItem('colorScheme', 'marsala');
      applyColorScheme("marsala");
    }
  }, []);

  // Apply theme change
  const handleThemeChange = (value: string) => {
    setTheme(value);
    localStorage.setItem('theme', value);
    applyTheme(value);
    
    toast({
      title: "Tema alterado",
      description: `O tema foi alterado para ${value === 'dark' ? 'escuro' : 'claro'}.`,
    });
  };

  const applyTheme = (themeValue: string) => {
    if (themeValue === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Apply high contrast change
  const handleHighContrastChange = (checked: boolean) => {
    setHighContrast(checked);
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

  // Apply font size change
  const handleFontSizeChange = (value: string) => {
    setFontSize(value);
    localStorage.setItem('fontSize', value);
    applyFontSize(value);
    
    toast({
      title: "Tamanho da fonte alterado",
      description: "O tamanho da fonte foi alterado com sucesso.",
    });
  };

  const applyFontSize = (fontSizeValue: string) => {
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

  // Apply color scheme change
  const handleColorSchemeChange = (value: string) => {
    setColorScheme(value);
    localStorage.setItem('colorScheme', value);
    applyColorScheme(value);
    
    toast({
      title: "Esquema de cores alterado",
      description: `O esquema de cores foi alterado para ${value}.`,
    });
  };

  const applyColorScheme = (colorSchemeValue: string) => {
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Palette className="h-6 w-6 text-marsala" />
          <CardTitle>Personalização do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Theme Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tema</h3>
            <div className="flex items-center space-x-4">
              <RadioGroup 
                value={theme} 
                onValueChange={handleThemeChange}
                className="flex space-x-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="flex items-center gap-2">
                    <Sun size={18} /> Claro
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="flex items-center gap-2">
                    <Moon size={18} /> Escuro
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          {/* High Contrast Mode */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Acessibilidade</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye size={18} />
                <Label htmlFor="high-contrast">Modo de alto contraste</Label>
              </div>
              <Switch 
                id="high-contrast" 
                checked={highContrast} 
                onCheckedChange={handleHighContrastChange} 
              />
            </div>
          </div>
          
          {/* Font Size */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tamanho da Fonte</h3>
            <RadioGroup 
              value={fontSize} 
              onValueChange={handleFontSizeChange}
              className="grid grid-cols-2 gap-4 sm:grid-cols-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="small" id="small" />
                <Label htmlFor="small">Pequeno</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium">Médio</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="large" id="large" />
                <Label htmlFor="large">Grande</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xlarge" id="xlarge" />
                <Label htmlFor="xlarge">Extra Grande</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Color Scheme */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Esquema de Cores</h3>
            <RadioGroup 
              value={colorScheme} 
              onValueChange={handleColorSchemeChange}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="marsala" id="marsala" />
                <Label htmlFor="marsala" className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-marsala"></div>
                  Marsala (padrão)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="blue" id="blue" />
                <Label htmlFor="blue" className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-blue-600"></div>
                  Azul
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="green" id="green" />
                <Label htmlFor="green" className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-emerald-600"></div>
                  Verde
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="purple" id="purple" />
                <Label htmlFor="purple" className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-purple-600"></div>
                  Roxo
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemPersonalization;
