
import React, { useState } from "react";
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
  Check
} from "lucide-react";

const themeColors = [
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
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sms: false,
    whatsapp: true
  });
  
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
                        activeTheme === "light" ? "border-primary-500 ring-2 ring-primary/20" : ""
                      }`}
                      onClick={() => setActiveTheme("light")}
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
                        activeTheme === "dark" ? "border-primary-500 ring-2 ring-primary/20" : ""
                      }`}
                      onClick={() => setActiveTheme("dark")}
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
                    <Switch />
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
                        onClick={() => setPrimaryColor(color)}
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
                        onValueChange={setFontSize}
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
