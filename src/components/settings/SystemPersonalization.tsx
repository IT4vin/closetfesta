
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
    }
    
    const savedHighContrast = localStorage.getItem('highContrast');
    if (savedHighContrast) {
      setHighContrast(savedHighContrast === 'true');
    }
    
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
      setFontSize(savedFontSize);
    }
    
    const savedColorScheme = localStorage.getItem('colorScheme');
    if (savedColorScheme) {
      setColorScheme(savedColorScheme);
    } else {
      // Default to marsala if no preference saved
      setColorScheme("marsala");
      localStorage.setItem('colorScheme', 'marsala');
    }
  }, []);

  // Apply theme change
  const handleThemeChange = (value: string) => {
    setTheme(value);
    localStorage.setItem('theme', value);
    
    if (value === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    toast({
      title: "Tema alterado",
      description: `O tema foi alterado para ${value === 'dark' ? 'escuro' : 'claro'}.`,
    });
  };

  // Apply high contrast change
  const handleHighContrastChange = (checked: boolean) => {
    setHighContrast(checked);
    localStorage.setItem('highContrast', checked.toString());
    
    if (checked) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    toast({
      title: "Contraste alterado",
      description: `Alto contraste ${checked ? 'ativado' : 'desativado'}.`,
    });
  };

  // Apply font size change
  const handleFontSizeChange = (value: string) => {
    setFontSize(value);
    localStorage.setItem('fontSize', value);
    
    switch (value) {
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
    
    toast({
      title: "Tamanho da fonte alterado",
      description: "O tamanho da fonte foi alterado com sucesso.",
    });
  };

  // Apply color scheme change
  const handleColorSchemeChange = (value: string) => {
    setColorScheme(value);
    localStorage.setItem('colorScheme', value);
    
    // Here we would apply the color scheme change
    // For now, just show a toast as this would require more extensive CSS changes
    toast({
      title: "Esquema de cores alterado",
      description: `O esquema de cores foi alterado para ${value}.`,
    });
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
