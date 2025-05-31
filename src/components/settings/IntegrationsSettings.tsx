import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  CreditCard, 
  DollarSign, 
  Smartphone,
  Globe,
  Key,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  Settings
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PaymentIntegrationData {
  // PIX
  pix_enabled: boolean;
  pix_key: string;
  
  // Cartão de Crédito
  credit_card_enabled: boolean;
  mercadopago_enabled: boolean;
  mercadopago_access_token: string;
  mercadopago_public_key: string;
  pagseguro_enabled: boolean;
  pagseguro_email: string;
  pagseguro_token: string;
  
  // APIs Externas
  whatsapp_enabled: boolean;
  whatsapp_api_token: string;
  whatsapp_phone: string;
  
  email_enabled: boolean;
  email_provider: string;
  email_smtp_host: string;
  email_smtp_port: number;
  email_username: string;
  email_password: string;
  
  // Backup e Armazenamento
  google_drive_enabled: boolean;
  google_drive_credentials: string;
  
  dropbox_enabled: boolean;
  dropbox_token: string;
}

const IntegrationsSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showTokens, setShowTokens] = useState(false);
  const [activeTab, setActiveTab] = useState<'payments' | 'notifications' | 'storage'>('payments');
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PaymentIntegrationData>({
    defaultValues: {
      pix_enabled: true,
      pix_key: "contato@closetfesta.com",
      
      credit_card_enabled: false,
      mercadopago_enabled: false,
      mercadopago_access_token: "",
      mercadopago_public_key: "",
      pagseguro_enabled: false,
      pagseguro_email: "",
      pagseguro_token: "",
      
      whatsapp_enabled: false,
      whatsapp_api_token: "",
      whatsapp_phone: "",
      
      email_enabled: true,
      email_provider: "gmail",
      email_smtp_host: "smtp.gmail.com",
      email_smtp_port: 587,
      email_username: "",
      email_password: "",
      
      google_drive_enabled: false,
      google_drive_credentials: "",
      
      dropbox_enabled: false,
      dropbox_token: "",
    }
  });

  const watchMercadoPago = watch("mercadopago_enabled");
  const watchPagSeguro = watch("pagseguro_enabled");
  const watchWhatsApp = watch("whatsapp_enabled");
  const watchEmail = watch("email_enabled");
  const watchGoogleDrive = watch("google_drive_enabled");
  const watchDropbox = watch("dropbox_enabled");

  const onSubmit = async (data: PaymentIntegrationData) => {
    setIsLoading(true);
    
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Integrações configuradas com sucesso!");
      console.log("Dados de integração salvos:", data);
      
    } catch (error) {
      toast.error("Erro ao salvar configurações de integração");
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (integration: string) => {
    toast.info(`Testando conexão com ${integration}...`);
    
    // Simular teste de conexão
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% de chance de sucesso
      if (success) {
        toast.success(`Conexão com ${integration} estabelecida com sucesso!`);
      } else {
        toast.error(`Falha na conexão com ${integration}. Verifique as credenciais.`);
      }
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header da Seção */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integrações</h2>
          <p className="text-gray-600 mt-1">Configure pagamentos, notificações e integrações externas</p>
        </div>
        <Badge variant="outline" className="text-indigo-700 border-indigo-300 bg-indigo-50">
          <Settings className="w-4 h-4 mr-2" />
          6 integrações disponíveis
        </Badge>
      </div>

      {/* Navegação das Abas */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          {[
            { id: 'payments', label: 'Pagamentos', icon: CreditCard },
            { id: 'notifications', label: 'Notificações', icon: Smartphone },
            { id: 'storage', label: 'Armazenamento', icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Aba Pagamentos */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* PIX */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      PIX
                    </CardTitle>
                    <CardDescription>Receba pagamentos via PIX</CardDescription>
                  </div>
                  <Switch
                    checked={watch("pix_enabled")}
                    onCheckedChange={(checked) => setValue("pix_enabled", checked)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pix_key">Chave PIX</Label>
                  <Input
                    id="pix_key"
                    placeholder="email@exemplo.com ou CPF/CNPJ"
                    {...register("pix_key")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Mercado Pago */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      Mercado Pago
                    </CardTitle>
                    <CardDescription>Cartões de crédito e débito</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {watchMercadoPago && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection("Mercado Pago")}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Testar
                      </Button>
                    )}
                    <Switch
                      checked={watchMercadoPago}
                      onCheckedChange={(checked) => setValue("mercadopago_enabled", checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              {watchMercadoPago && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mercadopago_access_token">Access Token</Label>
                    <div className="relative">
                      <Input
                        id="mercadopago_access_token"
                        type={showTokens ? "text" : "password"}
                        placeholder="APP_USR-..."
                        {...register("mercadopago_access_token")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowTokens(!showTokens)}
                      >
                        {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mercadopago_public_key">Public Key</Label>
                    <Input
                      id="mercadopago_public_key"
                      placeholder="APP_USR-..."
                      {...register("mercadopago_public_key")}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ExternalLink className="w-4 h-4" />
                    <a 
                      href="https://www.mercadopago.com.br/developers/pt/docs" 
                      target="_blank" 
                      className="text-blue-600 hover:underline"
                    >
                      Como obter as credenciais
                    </a>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* PagSeguro */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-orange-600" />
                      PagSeguro
                    </CardTitle>
                    <CardDescription>Cartões e boleto bancário</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {watchPagSeguro && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection("PagSeguro")}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Testar
                      </Button>
                    )}
                    <Switch
                      checked={watchPagSeguro}
                      onCheckedChange={(checked) => setValue("pagseguro_enabled", checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              {watchPagSeguro && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pagseguro_email">E-mail PagSeguro</Label>
                    <Input
                      id="pagseguro_email"
                      type="email"
                      placeholder="seu@email.com"
                      {...register("pagseguro_email")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pagseguro_token">Token</Label>
                    <Input
                      id="pagseguro_token"
                      type={showTokens ? "text" : "password"}
                      placeholder="Token de autorização"
                      {...register("pagseguro_token")}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* Aba Notificações */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* WhatsApp */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-green-600" />
                      WhatsApp Business API
                    </CardTitle>
                    <CardDescription>Envio de mensagens automáticas</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {watchWhatsApp && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection("WhatsApp")}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Testar
                      </Button>
                    )}
                    <Switch
                      checked={watchWhatsApp}
                      onCheckedChange={(checked) => setValue("whatsapp_enabled", checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              {watchWhatsApp && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_api_token">Token da API</Label>
                    <Input
                      id="whatsapp_api_token"
                      type={showTokens ? "text" : "password"}
                      placeholder="Seu token de API"
                      {...register("whatsapp_api_token")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_phone">Número do WhatsApp</Label>
                    <Input
                      id="whatsapp_phone"
                      placeholder="5511999999999"
                      {...register("whatsapp_phone")}
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* E-mail */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-blue-600" />
                      E-mail SMTP
                    </CardTitle>
                    <CardDescription>Envio de e-mails automáticos</CardDescription>
                  </div>
                  <Switch
                    checked={watchEmail}
                    onCheckedChange={(checked) => setValue("email_enabled", checked)}
                  />
                </div>
              </CardHeader>
              {watchEmail && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email_provider">Provedor</Label>
                      <Select onValueChange={(value) => setValue("email_provider", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gmail">Gmail</SelectItem>
                          <SelectItem value="outlook">Outlook</SelectItem>
                          <SelectItem value="sendgrid">SendGrid</SelectItem>
                          <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email_smtp_host">Servidor SMTP</Label>
                      <Input
                        id="email_smtp_host"
                        placeholder="smtp.gmail.com"
                        {...register("email_smtp_host")}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email_smtp_port">Porta</Label>
                      <Input
                        id="email_smtp_port"
                        type="number"
                        placeholder="587"
                        {...register("email_smtp_port", { valueAsNumber: true })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email_username">Usuário</Label>
                      <Input
                        id="email_username"
                        placeholder="seu@email.com"
                        {...register("email_username")}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email_password">Senha</Label>
                    <Input
                      id="email_password"
                      type="password"
                      placeholder="Sua senha ou app password"
                      {...register("email_password")}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* Aba Armazenamento */}
        {activeTab === 'storage' && (
          <div className="space-y-6">
            {/* Google Drive */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-blue-600" />
                      Google Drive
                    </CardTitle>
                    <CardDescription>Backup automático na nuvem</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {watchGoogleDrive && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection("Google Drive")}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Testar
                      </Button>
                    )}
                    <Switch
                      checked={watchGoogleDrive}
                      onCheckedChange={(checked) => setValue("google_drive_enabled", checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              {watchGoogleDrive && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="google_drive_credentials">Credenciais JSON</Label>
                    <textarea
                      id="google_drive_credentials"
                      placeholder="Cole aqui o JSON das credenciais do Google Cloud"
                      className="w-full h-32 p-3 border rounded-md resize-none"
                      {...register("google_drive_credentials")}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ExternalLink className="w-4 h-4" />
                    <a 
                      href="https://console.cloud.google.com" 
                      target="_blank" 
                      className="text-blue-600 hover:underline"
                    >
                      Como configurar as credenciais
                    </a>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Dropbox */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-blue-500" />
                      Dropbox
                    </CardTitle>
                    <CardDescription>Sincronização com Dropbox</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {watchDropbox && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection("Dropbox")}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Testar
                      </Button>
                    )}
                    <Switch
                      checked={watchDropbox}
                      onCheckedChange={(checked) => setValue("dropbox_enabled", checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              {watchDropbox && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dropbox_token">Access Token</Label>
                    <Input
                      id="dropbox_token"
                      type={showTokens ? "text" : "password"}
                      placeholder="Token de acesso do Dropbox"
                      {...register("dropbox_token")}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Integrações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default IntegrationsSettings; 