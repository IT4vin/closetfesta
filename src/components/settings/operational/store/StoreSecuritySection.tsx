
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
import { Shield, Key, Smartphone, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

// Create form schema with validations
const securitySchema = z.object({
  enableTwoFactor: z.boolean().default(false),
  twoFactorMethod: z.enum(["app", "sms", "email"]).default("app"),
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .regex(/[A-Z]/, "A senha deve incluir pelo menos uma letra maiúscula")
    .regex(/[0-9]/, "A senha deve incluir pelo menos um número")
    .regex(/[^a-zA-Z0-9]/, "A senha deve incluir pelo menos um símbolo"),
  confirmPassword: z.string(),
})
.refine(data => data.newPassword === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"], 
});

type SecurityFormValues = z.infer<typeof securitySchema>;

const StoreSecuritySection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { toast } = useToast();

  const defaultValues: Partial<SecurityFormValues> = {
    enableTwoFactor: true,
    twoFactorMethod: "app",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };

  const form = useForm<SecurityFormValues>({
    resolver: zodResolver(securitySchema),
    defaultValues,
  });

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    if (!password) return 0;
    
    let score = 0;
    
    // Length
    if (password.length >= 8) score += 20;
    
    // Uppercase
    if (/[A-Z]/.test(password)) score += 20;
    
    // Lowercase
    if (/[a-z]/.test(password)) score += 20;
    
    // Numbers
    if (/[0-9]/.test(password)) score += 20;
    
    // Special characters
    if (/[^a-zA-Z0-9]/.test(password)) score += 20;
    
    return score;
  };

  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "newPassword") {
        setPasswordStrength(calculatePasswordStrength(value.newPassword || ""));
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const getStrengthColor = (strength: number) => {
    if (strength <= 20) return "bg-red-500";
    if (strength <= 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthText = (strength: number) => {
    if (strength <= 20) return "Fraca";
    if (strength <= 60) return "Média";
    return "Forte";
  };

  const onSubmit = (data: SecurityFormValues) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log(data);
      
      toast({
        title: "Configurações de segurança atualizadas",
        description: "As alterações foram salvas com sucesso.",
      });
      
      form.reset({
        ...data,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordStrength(0);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Shield className="h-6 w-6 text-primary" />
        <CardTitle>Segurança</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Key size={18} className="mr-2" />
                Autenticação de Dois Fatores
              </h3>
              
              <FormField
                control={form.control}
                name="enableTwoFactor"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Ativar 2FA</FormLabel>
                      <FormDescription>
                        Aumenta a segurança com verificação adicional ao login
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {form.watch("enableTwoFactor") && (
                <div className="pl-6 border-l-2 border-gray-200 dark:border-gray-800 ml-3 space-y-4">
                  <FormField
                    control={form.control}
                    name="twoFactorMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método de verificação</FormLabel>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div 
                            className={`border rounded-md p-3 cursor-pointer flex items-center ${field.value === "app" ? "border-primary bg-primary/5" : ""}`} 
                            onClick={() => form.setValue("twoFactorMethod", "app")}
                          >
                            <Smartphone className="h-5 w-5 mr-2" />
                            <span>Aplicativo (Google Authenticator)</span>
                          </div>
                          <div 
                            className={`border rounded-md p-3 cursor-pointer flex items-center ${field.value === "sms" ? "border-primary bg-primary/5" : ""}`}
                            onClick={() => form.setValue("twoFactorMethod", "sms")}
                          >
                            <Smartphone className="h-5 w-5 mr-2" />
                            <span>SMS</span>
                          </div>
                          <div 
                            className={`border rounded-md p-3 cursor-pointer flex items-center ${field.value === "email" ? "border-primary bg-primary/5" : ""}`}
                            onClick={() => form.setValue("twoFactorMethod", "email")}
                          >
                            <Smartphone className="h-5 w-5 mr-2" />
                            <span>E-mail</span>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Shield size={18} className="mr-2" />
                Alteração de Senha
              </h3>
              
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha Atual*</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={passwordVisible ? "text" : "password"}
                          placeholder="Digite sua senha atual"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setPasswordVisible(!passwordVisible)}
                        >
                          {passwordVisible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {passwordVisible ? "Ocultar senha" : "Mostrar senha"}
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha*</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={passwordVisible ? "text" : "password"}
                          placeholder="Digite sua nova senha"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setPasswordVisible(!passwordVisible)}
                        >
                          {passwordVisible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    {field.value && (
                      <div className="mt-2">
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Força da senha:</span>
                          <span className={passwordStrength > 60 ? "text-green-500" : passwordStrength > 20 ? "text-yellow-500" : "text-red-500"}>
                            {getStrengthText(passwordStrength)}
                          </span>
                        </div>
                        <Progress 
                          value={passwordStrength} 
                          className={`${getStrengthColor(passwordStrength)} h-2`}
                        />
                      </div>
                    )}
                    {field.value && (
                      <div className="text-sm space-y-1 mt-2">
                        <p className={/[A-Z]/.test(field.value) ? "text-green-500" : "text-gray-500"}>
                          ✓ Pelo menos uma letra maiúscula
                        </p>
                        <p className={/[0-9]/.test(field.value) ? "text-green-500" : "text-gray-500"}>
                          ✓ Pelo menos um número
                        </p>
                        <p className={/[^a-zA-Z0-9]/.test(field.value) ? "text-green-500" : "text-gray-500"}>
                          ✓ Pelo menos um símbolo
                        </p>
                        <p className={field.value.length >= 8 ? "text-green-500" : "text-gray-500"}>
                          ✓ Mínimo de 8 caracteres
                        </p>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirme a Nova Senha*</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={passwordVisible ? "text" : "password"}
                          placeholder="Confirme sua nova senha"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setPasswordVisible(!passwordVisible)}
                        >
                          {passwordVisible ? (
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
              
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-4 text-sm flex mt-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                <p>
                  Por questões de segurança, você será desconectado do sistema após alterar sua senha.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                )}
                Atualizar Configurações de Segurança
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default StoreSecuritySection;
