
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Palette, Image, Clock, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

const timeOptions = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return { value: `${hour}:00`, label: `${hour}:00` };
});

const colorThemes = [
  { value: "default", label: "Padrão", color: "#8B5CF6" },
  { value: "blue", label: "Azul", color: "#0EA5E9" },
  { value: "green", label: "Verde", color: "#22C55E" },
  { value: "red", label: "Vermelho", color: "#EF4444" },
  { value: "orange", label: "Laranja", color: "#F97316" },
  { value: "pink", label: "Rosa", color: "#D946EF" },
  { value: "custom", label: "Personalizado", color: "" },
];

// Create form schema with validations
const personalizationSchema = z.object({
  logoFile: z.any().optional(),
  colorTheme: z.string(),
  customColor: z.string().optional(),
  businessHoursStart: z.string(),
  businessHoursEnd: z.string(),
  businessDays: z.array(z.string()).min(1, "Selecione pelo menos um dia"),
  maintenanceMode: z.boolean().default(false),
  maintenanceMessage: z.string().optional(),
});

type PersonalizationFormValues = z.infer<typeof personalizationSchema>;

const StorePersonalizationSection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>("https://via.placeholder.com/200x80?text=Logo+da+Loja");
  const { toast } = useToast();

  const defaultValues: Partial<PersonalizationFormValues> = {
    colorTheme: "default",
    businessHoursStart: "08:00",
    businessHoursEnd: "18:00",
    businessDays: ["1", "2", "3", "4", "5"],
    maintenanceMode: false,
    maintenanceMessage: "Estamos em manutenção. Voltaremos em breve!",
  };

  const form = useForm<PersonalizationFormValues>({
    resolver: zodResolver(personalizationSchema),
    defaultValues,
  });

  const watchColorTheme = form.watch("colorTheme");
  const watchMaintenanceMode = form.watch("maintenanceMode");

  // Handle logo upload
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione uma imagem válida",
        variant: "destructive",
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
      form.setValue("logoFile", file);
    };
    reader.readAsDataURL(file);
  };

  // Remove logo
  const removeLogo = () => {
    setLogoPreview(null);
    form.setValue("logoFile", undefined);
  };

  const onSubmit = (data: PersonalizationFormValues) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log(data);
      
      toast({
        title: "Personalização atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
      
      setIsLoading(false);
    }, 1500);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Palette className="h-6 w-6 text-primary" />
        <CardTitle>Personalização</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Logo Upload Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Image size={18} className="mr-2" />
                Logo da Loja
              </h3>
              
              <div className="border rounded-md p-6 flex flex-col items-center justify-center">
                {logoPreview ? (
                  <div className="relative mb-4">
                    <img 
                      src={logoPreview} 
                      alt="Logo Preview" 
                      className="max-h-24 max-w-full object-contain rounded" 
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={removeLogo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md p-8 mb-4 text-center">
                    <Image className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Nenhum logo adicionado</p>
                  </div>
                )}
                
                <div className="flex items-center justify-center">
                  <label 
                    htmlFor="logo-upload" 
                    className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none"
                  >
                    {logoPreview ? "Alterar Logo" : "Adicionar Logo"}
                  </label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleLogoChange}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Formatos aceitos: PNG, JPG, SVG (Tamanho máximo: 2MB)
                </p>
              </div>
            </div>
            
            {/* Color Theme Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Palette size={18} className="mr-2" />
                Tema de Cores
              </h3>
              
              <FormField
                control={form.control}
                name="colorTheme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Esquema de Cores</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        value={field.value}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                      >
                        {colorThemes.map((theme) => (
                          <FormItem key={theme.value}>
                            <FormControl>
                              <div className="space-y-2">
                                <div 
                                  className={`border-2 rounded-md p-4 cursor-pointer flex flex-col items-center ${
                                    field.value === theme.value ? "border-primary" : "border-gray-200 dark:border-gray-800"
                                  }`}
                                  onClick={() => form.setValue("colorTheme", theme.value)}
                                >
                                  {theme.value !== "custom" ? (
                                    <div 
                                      className="h-8 w-8 rounded-full mb-2" 
                                      style={{ backgroundColor: theme.color }}
                                    ></div>
                                  ) : (
                                    <Palette className="h-8 w-8 mb-2" />
                                  )}
                                  <RadioGroupItem 
                                    value={theme.value} 
                                    id={`theme-${theme.value}`} 
                                    className="sr-only" 
                                  />
                                  <FormLabel 
                                    htmlFor={`theme-${theme.value}`}
                                    className="cursor-pointer"
                                  >
                                    {theme.label}
                                  </FormLabel>
                                </div>
                              </div>
                            </FormControl>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {watchColorTheme === "custom" && (
                <FormField
                  control={form.control}
                  name="customColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor Personalizada</FormLabel>
                      <div className="flex gap-4 items-center">
                        <Input 
                          type="color" 
                          {...field} 
                          value={field.value || "#8B5CF6"}
                          className="w-16 h-10 p-1"
                        />
                        <Input 
                          type="text" 
                          {...field} 
                          value={field.value || "#8B5CF6"}
                          placeholder="#HEX"
                          className="w-32"
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            {/* Business Hours Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Clock size={18} className="mr-2" />
                Horário de Funcionamento
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="businessHoursStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Abertura</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            {...field}
                          >
                            {timeOptions.map((time) => (
                              <option key={time.value} value={time.value}>
                                {time.label}
                              </option>
                            ))}
                          </select>
                          <Clock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="businessHoursEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Fechamento</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            {...field}
                          >
                            {timeOptions.map((time) => (
                              <option key={time.value} value={time.value}>
                                {time.label}
                              </option>
                            ))}
                          </select>
                          <Clock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="businessDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dias de Funcionamento</FormLabel>
                    <div className="grid grid-cols-7 gap-2">
                      {[
                        { value: "0", label: "D" },
                        { value: "1", label: "S" },
                        { value: "2", label: "T" },
                        { value: "3", label: "Q" },
                        { value: "4", label: "Q" },
                        { value: "5", label: "S" },
                        { value: "6", label: "S" },
                      ].map((day) => {
                        const isSelected = field.value?.includes(day.value);
                        return (
                          <div
                            key={day.value}
                            className={`
                              flex items-center justify-center h-10 rounded-md cursor-pointer border
                              ${isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background border-input text-foreground hover:bg-accent hover:text-accent-foreground"
                              }
                            `}
                            onClick={() => {
                              const newValue = isSelected
                                ? field.value.filter((v) => v !== day.value)
                                : [...field.value, day.value];
                              form.setValue("businessDays", newValue);
                            }}
                          >
                            {day.label}
                          </div>
                        );
                      })}
                    </div>
                    <FormDescription>
                      Clique nos dias em que sua loja está aberta
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Maintenance Mode Section */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="maintenanceMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <FormLabel className="font-medium text-base">
                          Modo de Manutenção
                        </FormLabel>
                      </div>
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormDescription>
                        Quando ativado, o sistema exibirá uma mensagem de manutenção para todos os usuários
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              {watchMaintenanceMode && (
                <FormField
                  control={form.control}
                  name="maintenanceMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensagem de Manutenção</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Digite a mensagem que será exibida durante a manutenção"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Esta mensagem será exibida quando o modo de manutenção estiver ativo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} className="gap-2">
                {isLoading && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                )}
                <Save size={16} />
                Salvar Configurações
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default StorePersonalizationSection;
