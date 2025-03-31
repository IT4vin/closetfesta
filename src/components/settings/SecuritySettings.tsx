
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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Shield, 
  Key, 
  FileText, 
  Download,
  AlertTriangle,
  Lock,
  Smartphone,
  Eye,
  EyeOff
} from "lucide-react";

// Dados de exemplo para logs de atividade
const activityLogs = [
  { 
    id: 1, 
    date: "12/05/2023 14:30:22", 
    user: "Ana Silva", 
    action: "Login", 
    ip: "192.168.1.1", 
    device: "Chrome / Windows" 
  },
  { 
    id: 2, 
    date: "12/05/2023 13:15:45", 
    user: "Carlos Santos", 
    action: "Alterou produto #1234", 
    ip: "192.168.1.5", 
    device: "Firefox / Mac" 
  },
  { 
    id: 3, 
    date: "12/05/2023 11:45:10", 
    user: "Ana Silva", 
    action: "Exportou relatório", 
    ip: "192.168.1.1", 
    device: "Chrome / Windows" 
  },
  { 
    id: 4, 
    date: "12/05/2023 10:22:36", 
    user: "Mariana Souza", 
    action: "Cadastrou cliente", 
    ip: "192.168.1.8", 
    device: "Safari / iPad" 
  },
  { 
    id: 5, 
    date: "12/05/2023 09:15:50", 
    user: "Paulo Oliveira", 
    action: "Falha no login", 
    ip: "192.168.1.12", 
    device: "Chrome / Android" 
  },
];

const SecuritySettings = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  
  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle>Configurações de Segurança</CardTitle>
        <CardDescription>
          Gerencie as configurações de autenticação e segurança do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="authentication" className="w-full">
          <TabsList className="mb-6 grid grid-cols-2">
            <TabsTrigger value="authentication" className="flex items-center gap-2">
              <Shield size={16} />
              Autenticação
            </TabsTrigger>
            <TabsTrigger value="activityLogs" className="flex items-center gap-2">
              <FileText size={16} />
              Registro de Atividades
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="authentication" className="space-y-6">
            <div className="space-y-6">
              <div className="grid gap-6">
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Key size={18} className="mr-2" />
                    Política de Senhas
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Exigir letras maiúsculas</Label>
                        <p className="text-sm text-gray-500">As senhas devem conter pelo menos uma letra maiúscula</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Exigir caracteres especiais</Label>
                        <p className="text-sm text-gray-500">As senhas devem conter pelo menos um caractere especial (!@#$%^&*)</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Exigir números</Label>
                        <p className="text-sm text-gray-500">As senhas devem conter pelo menos um número</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Tamanho mínimo da senha</Label>
                        <p className="text-sm text-gray-500">Quantidade mínima de caracteres para uma senha</p>
                      </div>
                      <Select defaultValue="8">
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="8">8</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="12">12</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Expiração de senha</Label>
                        <p className="text-sm text-gray-500">Forçar usuários a alterarem suas senhas periodicamente</p>
                      </div>
                      <Select defaultValue="90">
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 dias</SelectItem>
                          <SelectItem value="60">60 dias</SelectItem>
                          <SelectItem value="90">90 dias</SelectItem>
                          <SelectItem value="0">Nunca</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Histórico de senhas</Label>
                        <p className="text-sm text-gray-500">Impedir a reutilização das últimas senhas</p>
                      </div>
                      <Select defaultValue="5">
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 senhas</SelectItem>
                          <SelectItem value="5">5 senhas</SelectItem>
                          <SelectItem value="10">10 senhas</SelectItem>
                          <SelectItem value="0">Desativado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Lock size={18} className="mr-2" />
                    Configurações de Login
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Autenticação de dois fatores (2FA)</Label>
                        <p className="text-sm text-gray-500">Requer verificação adicional além da senha</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="ml-6 p-4 border-l">
                      <div className="flex items-center justify-between mb-4">
                        <Label>Método 2FA</Label>
                        <Select defaultValue="app">
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="app">
                              <div className="flex items-center">
                                <Smartphone size={16} className="mr-2" />
                                Authenticator App
                              </div>
                            </SelectItem>
                            <SelectItem value="whatsapp">
                              <div className="flex items-center">
                                <Smartphone size={16} className="mr-2" />
                                WhatsApp
                              </div>
                            </SelectItem>
                            <SelectItem value="sms">
                              <div className="flex items-center">
                                <Smartphone size={16} className="mr-2" />
                                SMS
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Captcha após tentativas falhas</Label>
                        <p className="text-sm text-gray-500">Ativar captcha após várias tentativas de login incorretas</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Número de tentativas antes do captcha</Label>
                        <p className="text-sm text-gray-500">Quantidade de tentativas falhas permitidas</p>
                      </div>
                      <Select defaultValue="3">
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Bloqueio temporário de conta</Label>
                        <p className="text-sm text-gray-500">Bloquear conta após múltiplas tentativas falhas de login</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Tempo de sessão (em minutos)</Label>
                        <p className="text-sm text-gray-500">Tempo até o logout automático por inatividade</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          defaultValue="30" 
                          min="5" 
                          max="120" 
                          className="w-[100px]" 
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Permitir login múltiplo</Label>
                        <p className="text-sm text-gray-500">Permitir o mesmo usuário logado em múltiplos dispositivos</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="activityLogs" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <Select defaultValue="today">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecione um período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="yesterday">Ontem</SelectItem>
                    <SelectItem value="week">Última semana</SelectItem>
                    <SelectItem value="month">Último mês</SelectItem>
                    <SelectItem value="custom">Período personalizado</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo de atividade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as atividades</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="edit">Edições</SelectItem>
                    <SelectItem value="export">Exportações</SelectItem>
                    <SelectItem value="error">Erros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="outline" className="gap-2">
                <Download size={16} />
                Exportar Logs
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data e Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Endereço IP</TableHead>
                    <TableHead>Dispositivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLogs.map((log) => (
                    <TableRow key={log.id} className={log.action === "Falha no login" ? "bg-red-50" : ""}>
                      <TableCell>{log.date}</TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell>
                        {log.action === "Falha no login" ? (
                          <span className="flex items-center text-red-600">
                            <AlertTriangle size={14} className="mr-1" />
                            {log.action}
                          </span>
                        ) : (
                          log.action
                        )}
                      </TableCell>
                      <TableCell>{log.ip}</TableCell>
                      <TableCell>{log.device}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-between items-center text-sm text-gray-500">
              <div>Mostrando 5 de 155 registros</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Anterior
                </Button>
                <Button variant="outline" size="sm">
                  Próxima
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SecuritySettings;
