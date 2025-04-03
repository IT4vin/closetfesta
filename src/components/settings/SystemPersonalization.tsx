
import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Palette, 
  Monitor, 
  Sliders, 
  Bell,
  Sun,
  Moon,
  Languages,
  Check,
  SaveIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const themeColors = [
  { name: "Marsala", primary: "#800020", secondary: "#CC5A71" }, // Added Marsala as first (default) option
  { name: "Bordô", primary: "#8B0A50", secondary: "#CC5A71" },
  { name: "Marinho", primary: "#003366", secondary: "#336699" },
  { name: "Esmeralda", primary: "#2E8B57", secondary: "#66CDAA" },
  { name: "Roxo", primary: "#663399", secondary: "#9966CC" },
  { name: "Laranja", primary: "#FF6600", secondary: "#FF9966" },
  { name: "Turquesa", primary: "#008080", secondary: "#66CDAA" },
];

const SystemPersonalization = () => {
  const [activeTheme, setActiveTheme] = useState("light");
  const [primaryColor, setPrimaryColor] = useState(themeColors[0]);
  const [fontSize, setFontSize] = useState("medium");
  const [highContrast, setHighContrast] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const { toast } = useToast();
  
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sms: false,
    whatsapp: true
  });

  // Load saved settings when component mounts
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedColor = localStorage.getItem('primaryColor');
    const savedFontSize = localStorage.getItem('fontSize');
    const savedHighContrast = localStorage.getItem('highContrast');
    
    if (savedTheme) setActiveTheme(savedTheme);
    if (savedColor) {
      const colorObj = themeColors.find(c => c.name === savedColor);
      if (colorObj) setPrimaryColor(colorObj);
    }
    if (savedFontSize) setFontSize(savedFontSize);
    if (savedHighContrast) setHighContrast(savedHighContrast === 'true');
    
    // Apply theme to document
    applyTheme(savedTheme || 'light');
    applyColor(savedColor ? themeColors.find(c => c.name === savedColor) || themeColors[0] : themeColors[0]);
  }, []);

  // Apply theme and color changes to document
  const applyTheme = (theme: string) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      // Apply dark theme variables
      document.documentElement.style.setProperty('--background', '240 10% 3.9%');
      document.documentElement.style.setProperty('--foreground', '0 0% 98%');
      document.documentElement.style.setProperty('--card', '240 10% 3.9%');
      document.documentElement.style.setProperty('--card-foreground', '0 0% 98%');
    } else {
      document.documentElement.classList.remove('dark');
      // Reset to light theme variables
      document.documentElement.style.setProperty('--background', '0 0% 100%');
      document.documentElement.style.setProperty('--foreground', '0 0% 20%');
      document.documentElement.style.setProperty('--card', '0 0% 100%');
      document.documentElement.style.setProperty('--card-foreground', '0 0% 20%');
    }
  };

  const applyColor = (color: typeof themeColors[0]) => {
    // Apply color CSS variables to document
    const hslPrimary = hexToHSL(color.primary);
    const hslSecondary = hexToHSL(color.secondary);
    
    if (hslPrimary) {
      document.documentElement.style.setProperty('--primary', `${hslPrimary.h} ${hslPrimary.s}% ${hslPrimary.l}%`);
      document.documentElement.style.setProperty('--marsala', `${hslPrimary.h} ${hslPrimary.s}% ${hslPrimary.l}%`);
    }
    
    if (hslSecondary) {
      // Set secondary color as a lighter version of primary
      document.documentElement.style.setProperty('--secondary', `${hslSecondary.h} ${hslSecondary.s}% ${hslSecondary.l}%`);
    }
  };

  // Helper function to convert hex to HSL
  const hexToHSL = (hex: string): { h: number, s: number, l: number } | null => {
    // Remove the # if present
    hex = hex.replace(/^#/, '');
    
    // Parse the hex values
    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
        case g: h = ((b - r) / d + 2) * 60; break;
        case b: h = ((r - g) / d + 4) * 60; break;
      }
    }
    
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const handleThemeChange = (theme: string) => {
    setActiveTheme(theme);
    applyTheme(theme);
    setSettingsChanged(true);
  };

  const handleColorChange = (color: typeof themeColors[0]) => {
    setPrimaryColor(color);
    applyColor(color);
    setSettingsChanged(true);
  };

  const handleHighContrastChange = (checked: boolean) => {
    setHighContrast(checked);
    // Apply high contrast styles
    if (checked) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    setSettingsChanged(true);
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    // Apply font size to body
    switch (size) {
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
    setSettingsChanged(true);
  };

  const saveSettings = () => {
    // Save all settings to localStorage
    localStorage.setItem('theme', activeTheme);
    localStorage.setItem('primaryColor', primaryColor.name);
    localStorage.setItem('fontSize', fontSize);
    localStorage.setItem('highContrast', highContrast.toString());
    
    toast({
      title: "Configurações salvas",
      description: "Suas preferências de aparência foram salvas com sucesso.",
    });
    
    setSettingsChanged(false);
  };
  
  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle>Personalização do Sistema</CardTitle>
        <CardDescription>
          Customize a aparência e as preferências do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="mb-6 grid grid-cols-2">
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette size={16} />
              Aparência
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Sliders size={16} />
              Preferências
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance" className="space-y-6">
            <div className="space-y-6">
              <div className="grid gap-6">
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Monitor size={18} className="mr-2" />
                    Tema do Sistema
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 flex items-center gap-3 ${
                        activeTheme === "light" ? "border-primary ring-2 ring-primary/20" : ""
                      }`}
                      onClick={() => handleThemeChange("light")}
                    >
                      <div className="h-12 w-12 bg-white border rounded-full flex items-center justify-center">
                        <Sun size={20} className="text-amber-500" />
                      </div>
                      <div>
                        <div className="font-medium">Tema Claro</div>
                        <div className="text-sm text-gray-500">Fundo branco, ideal para uso diurno</div>
                      </div>
                      {activeTheme === "light" && (
                        <div className="ml-auto">
                          <Check size={18} className="text-primary" />
                        </div>
                      )}
                    </div>
                    
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 flex items-center gap-3 ${
                        activeTheme === "dark" ? "border-primary ring-2 ring-primary/20" : ""
                      }`}
                      onClick={() => handleThemeChange("dark")}
                    >
                      <div className="h-12 w-12 bg-gray-900 border rounded-full flex items-center justify-center">
                        <Moon size={20} className="text-indigo-300" />
                      </div>
                      <div>
                        <div className="font-medium">Tema Escuro</div>
                        <div className="text-sm text-gray-500">Fundo escuro, reduz cansaço visual</div>
                      </div>
                      {activeTheme === "dark" && (
                        <div className="ml-auto">
                          <Check size={18} className="text-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <h4 className="font-medium mb-3">Contraste Alto</h4>
                  <div className="flex items-center justify-between mb-6">
                    <div className="space-y-0.5">
                      <p className="text-sm text-gray-500">Aumenta o contraste para melhorar a legibilidade</p>
                    </div>
                    <Switch 
                      checked={highContrast}
                      onCheckedChange={handleHighContrastChange}
                    />
                  </div>
                  
                  <h4 className="font-medium mb-3">Cores do Sistema</h4>
                  <p className="text-sm text-gray-500 mb-4">Selecione uma paleta de cores para personalizar a interface</p>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {themeColors.map((color) => (
                      <div 
                        key={color.name}
                        className={`border rounded-lg p-3 cursor-pointer hover:bg-gray-50 ${
                          primaryColor.name === color.name ? "border-primary ring-2 ring-primary/20" : ""
                        }`}
                        onClick={() => handleColorChange(color)}
                      >
                        <div className="flex gap-2 mb-2">
                          <div 
                            className="h-8 w-8 rounded-full" 
                            style={{ backgroundColor: color.primary }}
                          ></div>
                          <div 
                            className="h-8 w-8 rounded-full" 
                            style={{ backgroundColor: color.secondary }}
                          ></div>
                        </div>
                        <div className="font-medium text-sm">{color.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">Ajustes de Texto</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block">Tamanho da Fonte</Label>
                      <Select 
                        value={fontSize} 
                        onValueChange={handleFontSizeChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione um tamanho" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Pequeno</SelectItem>
                          <SelectItem value="medium">Médio (Padrão)</SelectItem>
                          <SelectItem value="large">Grande</SelectItem>
                          <SelectItem value="xlarge">Extra Grande</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="pt-2">
                      <div className="border rounded-lg p-4">
                        <p className={`mb-2 ${
                          fontSize === "small" ? "text-sm" :
                          fontSize === "medium" ? "text-base" :
                          fontSize === "large" ? "text-lg" :
                          "text-xl"
                        }`}>
                          Exemplo de texto
                        </p>
                        <p className={`text-gray-500 ${
                          fontSize === "small" ? "text-xs" :
                          fontSize === "medium" ? "text-sm" :
                          fontSize === "large" ? "text-base" :
                          "text-lg"
                        }`}>
                          Este é um exemplo de como o texto aparecerá com este tamanho de fonte.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {settingsChanged && (
                <div className="flex justify-end">
                  <Button 
                    onClick={saveSettings}
                    className="flex items-center gap-2"
                  >
                    <SaveIcon size={16} />
                    Salvar Alterações
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="preferences" className="space-y-6">
            <div className="space-y-6">
              <div className="grid gap-6">
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Bell size={18} className="mr-2" />
                    Notificações
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Notificações por E-mail</Label>
                        <p className="text-sm text-gray-500">Receber alertas importantes por e-mail</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.email}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({...notificationSettings, email: checked})
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Notificações Push</Label>
                        <p className="text-sm text-gray-500">Receber alertas no navegador</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.push}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({...notificationSettings, push: checked})
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Notificações por SMS</Label>
                        <p className="text-sm text-gray-500">Receber alertas por mensagem de texto</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.sms}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({...notificationSettings, sms: checked})
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Notificações por WhatsApp</Label>
                        <p className="text-sm text-gray-500">Receber alertas via WhatsApp</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.whatsapp}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({...notificationSettings, whatsapp: checked})
                        }
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Languages size={18} className="mr-2" />
                    Idioma e Formato
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block">Idioma do Sistema</Label>
                      <Select defaultValue="pt-BR">
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione um idioma" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="es-ES">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="mb-2 block">Formato de Data</Label>
                      <Select defaultValue="dd/mm/yyyy">
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione um formato" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dd/mm/yyyy">DD/MM/AAAA (31/12/2023)</SelectItem>
                          <SelectItem value="mm/dd/yyyy">MM/DD/AAAA (12/31/2023)</SelectItem>
                          <SelectItem value="yyyy-mm-dd">AAAA-MM-DD (2023-12-31)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="mb-2 block">Formato de Moeda</Label>
                      <Select defaultValue="brl">
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione um formato" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="brl">Real Brasileiro (R$ 1.234,56)</SelectItem>
                          <SelectItem value="usd">Dólar Americano ($ 1,234.56)</SelectItem>
                          <SelectItem value="eur">Euro (€ 1.234,56)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">Dashboard Padrão</h3>
                  <p className="text-sm text-gray-500 mb-4">Selecione a visualização inicial ao fazer login no sistema</p>
                  
                  <Select defaultValue="summary">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o dashboard" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Resumo Geral</SelectItem>
                      <SelectItem value="financial">Resultados Financeiros</SelectItem>
                      <SelectItem value="calendar">Agenda do Dia</SelectItem>
                      <SelectItem value="returns">Devoluções Pendentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>Salvar Preferências</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SystemPersonalization;
