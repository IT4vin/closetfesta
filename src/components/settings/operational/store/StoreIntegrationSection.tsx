
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CreditCard, Key, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const getExpiryDateFormattedValue = (value: string) => {
  const cleanValue = value.replace(/\D+/g, "");
  const match = cleanValue.match(/^(\d{0,2})(\d{0,2})$/);
  
  if (!match) return value;
  
  const month = match[1];
  const year = match[2];
  
  if (month && year) {
    return `${month}/${year}`;
  } else if (month) {
    return month;
  }
  
  return "";
};

// Create form schema with validations for each payment gateway
const mercadoPagoSchema = z.object({
  enabled: z.boolean().default(false),
  accessToken: z.string().min(1, "Token de acesso é obrigatório").or(z.literal("")),
  clientId: z.string().min(1, "Client ID é obrigatório").or(z.literal("")),
  clientSecret: z.string().min(1, "Client Secret é obrigatório").or(z.literal("")),
  testMode: z.boolean().default(true),
});

const pagarMeSchema = z.object({
  enabled: z.boolean().default(false),
  apiKey: z.string().min(1, "API Key é obrigatória").or(z.literal("")),
  encryptionKey: z.string().min(1, "Chave de criptografia é obrigatória").or(z.literal("")),
  testMode: z.boolean().default(true),
});

const fiscalSchema = z.object({
  enabled: z.boolean().default(false),
  certificateFile: z.any().optional(),
  certificatePassword: z.string().min(1, "Senha do certificado é obrigatória").or(z.literal("")),
  certificateExpiryDate: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/(2[3-9]|[3-9][0-9])$/, "Data inválida (MM/AA)")
    .or(z.literal("")),
});

const integrationSchema = z.object({
  mercadoPago: mercadoPagoSchema,
  pagarMe: pagarMeSchema,
  fiscal: fiscalSchema,
});

type IntegrationFormValues = z.infer<typeof integrationSchema>;

const StoreIntegrationSection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [secretsVisible, setSecretsVisible] = useState<{[key: string]: boolean}>({});
  const [certificate, setCertificate] = useState<File | null>(null);
  const { toast } = useToast();

  const defaultValues: Partial<IntegrationFormValues> = {
    mercadoPago: {
      enabled: false,
      accessToken: "",
      clientId: "",
      clientSecret: "",
      testMode: true,
    },
    pagarMe: {
      enabled: false,
      apiKey: "",
      encryptionKey: "",
      testMode: true,
    },
    fiscal: {
      enabled: false,
      certificatePassword: "",
      certificateExpiryDate: "",
    },
  };

  const form = useForm<IntegrationFormValues>({
    resolver: zodResolver(integrationSchema),
    defaultValues,
  });

  const watchMercadoPagoEnabled = form.watch("mercadoPago.enabled");
  const watchPagarMeEnabled = form.watch("pagarMe.enabled");
  const watchFiscalEnabled = form.watch("fiscal.enabled");

  // Toggle password/key visibility
  const toggleSecretVisibility = (field: string) => {
    setSecretsVisible(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Handle certificate file selection
  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCertificate(file);
    form.setValue("fiscal.certificateFile", file);
  };

  const onSubmit = (data: IntegrationFormValues) => {
    setIsLoading(true);
    
    // Validate required fields based on enabled status
    const errors: string[] = [];
    
    if (data.mercadoPago.enabled) {
      if (!data.mercadoPago.accessToken) errors.push("Token do Mercado Pago");
      if (!data.mercadoPago.clientId) errors.push("Client ID do Mercado Pago");
      if (!data.mercadoPago.clientSecret) errors.push("Client Secret do Mercado Pago");
    }
    
    if (data.pagarMe.enabled) {
      if (!data.pagarMe.apiKey) errors.push("API Key do Pagar.me");
      if (!data.pagarMe.encryptionKey) errors.push("Encryption Key do Pagar.me");
    }
    
    if (data.fiscal.enabled) {
      if (!certificate && !data.fiscal.certificateFile) errors.push("Certificado Digital");
      if (!data.fiscal.certificatePassword) errors.push("Senha do Certificado");
      if (!data.fiscal.certificateExpiryDate) errors.push("Data de Expiração do Certificado");
    }
    
    if (errors.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Por favor, preencha os seguintes campos: ${errors.join(", ")}`,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    // Simulate API call
    setTimeout(() => {
      console.log(data);
      
      toast({
        title: "Integrações atualizadas",
        description: "As configurações de integração foram salvas com sucesso.",
      });
      
      setIsLoading(false);
    }, 1500);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <CreditCard className="h-6 w-6 text-primary" />
        <CardTitle>Integrações</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Accordion type="single" collapsible className="w-full">
              {/* Mercado Pago Integration */}
              <AccordionItem value="mercadopago">
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex items-center space-x-3">
                    <img 
                      src="https://seeklogo.com/images/M/mercado-pago-logo-52B7182205-seeklogo.com.png" 
                      alt="Mercado Pago" 
                      className="w-8 h-8 object-contain"
                    />
                    <span>Mercado Pago</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="mercadoPago.enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0">
                          <FormLabel>Ativar integração com Mercado Pago</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    {watchMercadoPagoEnabled && (
                      <div className="space-y-4 pt-4">
                        <FormField
                          control={form.control}
                          name="mercadoPago.accessToken"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Access Token*</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={secretsVisible.mpToken ? "text" : "password"}
                                    placeholder="APP_USR-1234567890abcdef-123456"
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => toggleSecretVisibility("mpToken")}
                                  >
                                    {secretsVisible.mpToken ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormDescription>
                                Token de acesso obtido do painel do Mercado Pago
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="mercadoPago.clientId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Client ID*</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={secretsVisible.mpClientId ? "text" : "password"}
                                    placeholder="123456789"
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => toggleSecretVisibility("mpClientId")}
                                  >
                                    {secretsVisible.mpClientId ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="mercadoPago.clientSecret"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Client Secret*</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={secretsVisible.mpClientSecret ? "text" : "password"}
                                    placeholder="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => toggleSecretVisibility("mpClientSecret")}
                                  >
                                    {secretsVisible.mpClientSecret ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="mercadoPago.testMode"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Modo de Teste (Sandbox)
                                </FormLabel>
                                <FormDescription>
                                  Transações não serão processadas de verdade
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-4 text-sm flex">
                          <Key className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                          <div>
                            <p className="font-medium mb-1">Onde encontrar minhas credenciais?</p>
                            <p>Acesse o <a href="https://www.mercadopago.com.br/developers" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Portal do Desenvolvedor Mercado Pago</a>, faça login e navegue até "Suas integrações" para obter as credenciais.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {/* Pagar.me Integration */}
              <AccordionItem value="pagarme">
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex items-center space-x-3">
                    <img 
                      src="https://seeklogo.com/images/P/pagarme-logo-1AA2EE1823-seeklogo.com.png" 
                      alt="Pagar.me" 
                      className="w-8 h-8 object-contain"
                    />
                    <span>Pagar.me</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="pagarMe.enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0">
                          <FormLabel>Ativar integração com Pagar.me</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    {watchPagarMeEnabled && (
                      <div className="space-y-4 pt-4">
                        <FormField
                          control={form.control}
                          name="pagarMe.apiKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>API Key*</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={secretsVisible.pagarmeApiKey ? "text" : "password"}
                                    placeholder="ak_test_1234567890abcdef"
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => toggleSecretVisibility("pagarmeApiKey")}
                                  >
                                    {secretsVisible.pagarmeApiKey ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormDescription>
                                API Key encontrada no Dashboard do Pagar.me
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="pagarMe.encryptionKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Encryption Key*</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={secretsVisible.pagarmeEncryptionKey ? "text" : "password"}
                                    placeholder="ek_test_1234567890abcdef"
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => toggleSecretVisibility("pagarmeEncryptionKey")}
                                  >
                                    {secretsVisible.pagarmeEncryptionKey ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormDescription>
                                Chave de criptografia utilizada para segurança dos dados
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="pagarMe.testMode"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Modo de Teste
                                </FormLabel>
                                <FormDescription>
                                  Transações não serão processadas de verdade
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-4 text-sm flex">
                          <Key className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                          <div>
                            <p className="font-medium mb-1">Onde encontrar minhas credenciais?</p>
                            <p>Acesse o <a href="https://dashboard.pagar.me/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Dashboard do Pagar.me</a>, faça login e navegue até "Configurações" > "Chaves de API".</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {/* Fiscal Integration (SEFAZ) */}
              <AccordionItem value="fiscal">
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex items-center space-x-3">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Coat_of_arms_of_Brazil.svg/800px-Coat_of_arms_of_Brazil.svg.png" 
                      alt="SEFAZ" 
                      className="w-8 h-8 object-contain"
                    />
                    <span>Integração Fiscal (SEFAZ)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fiscal.enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0">
                          <FormLabel>Ativar integração com SEFAZ</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    {watchFiscalEnabled && (
                      <div className="space-y-4 pt-4">
                        <div className="border rounded-md p-6">
                          <FormLabel className="block mb-2">Certificado Digital*</FormLabel>
                          <div className="space-y-4">
                            <div className="flex items-center justify-center w-full">
                              <label
                                htmlFor="certificate-upload"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500"
                              >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  {certificate ? (
                                    <>
                                      <Key className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400" />
                                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                        {certificate.name}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {(certificate.size / 1024).toFixed(2)} KB
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      <Key className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400" />
                                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Certificado A1 (PFX, P12) ou A3
                                      </p>
                                    </>
                                  )}
                                </div>
                                <input 
                                  id="certificate-upload" 
                                  type="file" 
                                  accept=".pfx,.p12" 
                                  className="hidden" 
                                  onChange={handleCertificateUpload}
                                />
                              </label>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="fiscal.certificatePassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Senha do Certificado*</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Input
                                          type={secretsVisible.certPassword ? "text" : "password"}
                                          placeholder="Senha do certificado digital"
                                          {...field}
                                        />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                          onClick={() => toggleSecretVisibility("certPassword")}
                                        >
                                          {secretsVisible.certPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                          ) : (
                                            <Eye className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="fiscal.certificateExpiryDate"
                                render={({ field: { onChange, ...field } }) => (
                                  <FormItem>
                                    <FormLabel>Data de Expiração*</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="MM/AA"
                                        {...field}
                                        onChange={(e) => {
                                          onChange(getExpiryDateFormattedValue(e.target.value));
                                        }}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Formato: MM/AA (Ex: 12/25)
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 text-sm flex">
                          <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                          <div>
                            <p className="font-medium mb-1">Informações importantes</p>
                            <p>Seu certificado digital será armazenado de forma segura. Lembre-se de atualizar quando expirar para evitar problemas na emissão de notas fiscais.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                )}
                Salvar Configurações de Integração
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default StoreIntegrationSection;
