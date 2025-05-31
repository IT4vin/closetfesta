import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Building, 
  Clock, 
  DollarSign, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  Save,
  Globe,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface BusinessFormData {
  // Informações da Empresa
  company_name: string;
  company_document: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  company_city: string;
  company_state: string;
  company_zip: string;
  company_description: string;
  
  // Horários de Funcionamento
  opening_hours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  
  // Políticas de Negócio
  min_rental_days: number;
  max_rental_days: number;
  advance_booking_days: number;
  cancellation_hours: number;
  require_deposit: boolean;
  deposit_percentage: number;
  late_fee_daily: number;
  
  // Configurações de Serviço
  delivery_available: boolean;
  delivery_fee: number;
  free_delivery_minimum: number;
  pickup_available: boolean;
  fitting_duration_minutes: number;
}

const BusinessSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'hours' | 'policies' | 'services'>('company');
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BusinessFormData>({
    defaultValues: {
      company_name: "Closet Festa",
      company_document: "12.345.678/0001-90",
      company_email: "contato@closetfesta.com",
      company_phone: "(11) 99999-0000",
      company_address: "Rua das Festas, 123",
      company_city: "São Paulo",
      company_state: "SP",
      company_zip: "01234-567",
      company_description: "Aluguel de roupas para festas e eventos especiais",
      
      opening_hours: {
        monday: { open: "09:00", close: "18:00", closed: false },
        tuesday: { open: "09:00", close: "18:00", closed: false },
        wednesday: { open: "09:00", close: "18:00", closed: false },
        thursday: { open: "09:00", close: "18:00", closed: false },
        friday: { open: "09:00", close: "18:00", closed: false },
        saturday: { open: "09:00", close: "17:00", closed: false },
        sunday: { open: "10:00", close: "16:00", closed: true },
      },
      
      min_rental_days: 1,
      max_rental_days: 7,
      advance_booking_days: 30,
      cancellation_hours: 24,
      require_deposit: true,
      deposit_percentage: 30,
      late_fee_daily: 10,
      
      delivery_available: true,
      delivery_fee: 15,
      free_delivery_minimum: 100,
      pickup_available: true,
      fitting_duration_minutes: 60,
    }
  });

  const watchRequireDeposit = watch("require_deposit");
  const watchDeliveryAvailable = watch("delivery_available");

  const onSubmit = async (data: BusinessFormData) => {
    setIsLoading(true);
    
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Configurações de negócio salvas com sucesso!");
      console.log("Dados salvos:", data);
      
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsLoading(false);
    }
  };

  const dayNames = {
    monday: "Segunda-feira",
    tuesday: "Terça-feira", 
    wednesday: "Quarta-feira",
    thursday: "Quinta-feira",
    friday: "Sexta-feira",
    saturday: "Sábado",
    sunday: "Domingo"
  };

  const tabs = [
    { id: 'company', label: 'Empresa', icon: Building },
    { id: 'hours', label: 'Horários', icon: Clock },
    { id: 'policies', label: 'Políticas', icon: Calendar },
    { id: 'services', label: 'Serviços', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      {/* Navegação das Abas */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-marsala-600 text-marsala-600'
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
        {/* Aba Empresa */}
        {activeTab === 'company' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-marsala-600" />
                Informações da Empresa
              </CardTitle>
              <CardDescription>
                Dados cadastrais e informações de contato da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nome da Empresa *</Label>
                  <Input
                    id="company_name"
                    {...register("company_name", { required: "Nome é obrigatório" })}
                  />
                  {errors.company_name && (
                    <p className="text-sm text-red-600">{errors.company_name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company_document">CNPJ</Label>
                  <Input
                    id="company_document"
                    placeholder="00.000.000/0000-00"
                    {...register("company_document")}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company_email">E-mail *</Label>
                  <Input
                    id="company_email"
                    type="email"
                    {...register("company_email", { required: "E-mail é obrigatório" })}
                  />
                  {errors.company_email && (
                    <p className="text-sm text-red-600">{errors.company_email.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company_phone">Telefone *</Label>
                  <Input
                    id="company_phone"
                    placeholder="(11) 99999-0000"
                    {...register("company_phone", { required: "Telefone é obrigatório" })}
                  />
                  {errors.company_phone && (
                    <p className="text-sm text-red-600">{errors.company_phone.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company_address">Endereço</Label>
                <Input
                  id="company_address"
                  {...register("company_address")}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_city">Cidade</Label>
                  <Input
                    id="company_city"
                    {...register("company_city")}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company_state">Estado</Label>
                  <Select onValueChange={(value) => setValue("company_state", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SP">São Paulo</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                      <SelectItem value="MG">Minas Gerais</SelectItem>
                      {/* Adicionar outros estados */}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company_zip">CEP</Label>
                  <Input
                    id="company_zip"
                    placeholder="00000-000"
                    {...register("company_zip")}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company_description">Descrição do Negócio</Label>
                <Textarea
                  id="company_description"
                  placeholder="Descreva seu negócio..."
                  className="min-h-[100px]"
                  {...register("company_description")}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aba Horários */}
        {activeTab === 'hours' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-marsala-600" />
                Horários de Funcionamento
              </CardTitle>
              <CardDescription>
                Configure os horários de atendimento da sua loja
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(dayNames).map(([day, dayLabel]) => (
                <div key={day} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-32">
                    <Label className="font-medium">{dayLabel}</Label>
                  </div>
                  
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={!watch(`opening_hours.${day as keyof typeof dayNames}.closed`)}
                        onCheckedChange={(checked) => 
                          setValue(`opening_hours.${day as keyof typeof dayNames}.closed`, !checked)
                        }
                      />
                      <Label className="text-sm">Aberto</Label>
                    </div>
                    
                    {!watch(`opening_hours.${day as keyof typeof dayNames}.closed`) && (
                      <>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Abertura:</Label>
                          <Input
                            type="time"
                            className="w-32"
                            {...register(`opening_hours.${day as keyof typeof dayNames}.open`)}
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Fechamento:</Label>
                          <Input
                            type="time"
                            className="w-32"
                            {...register(`opening_hours.${day as keyof typeof dayNames}.close`)}
                          />
                        </div>
                      </>
                    )}
                    
                    {watch(`opening_hours.${day as keyof typeof dayNames}.closed`) && (
                      <Badge variant="secondary">Fechado</Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Aba Políticas */}
        {activeTab === 'policies' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-marsala-600" />
                Políticas de Negócio
              </CardTitle>
              <CardDescription>
                Regras de aluguel, cancelamento e taxas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="min_rental_days">Mínimo de dias de aluguel</Label>
                  <Input
                    id="min_rental_days"
                    type="number"
                    min="1"
                    {...register("min_rental_days", { valueAsNumber: true })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_rental_days">Máximo de dias de aluguel</Label>
                  <Input
                    id="max_rental_days"
                    type="number"
                    min="1"
                    {...register("max_rental_days", { valueAsNumber: true })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="advance_booking_days">Antecedência para reserva (dias)</Label>
                  <Input
                    id="advance_booking_days"
                    type="number"
                    min="0"
                    {...register("advance_booking_days", { valueAsNumber: true })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cancellation_hours">Prazo para cancelamento (horas)</Label>
                  <Input
                    id="cancellation_hours"
                    type="number"
                    min="0"
                    {...register("cancellation_hours", { valueAsNumber: true })}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Exigir Depósito</Label>
                    <p className="text-sm text-gray-500">Solicitar depósito caução nos aluguéis</p>
                  </div>
                  <Switch
                    checked={watchRequireDeposit}
                    onCheckedChange={(checked) => setValue("require_deposit", checked)}
                  />
                </div>
                
                {watchRequireDeposit && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor="deposit_percentage">Percentual do depósito (%)</Label>
                    <Input
                      id="deposit_percentage"
                      type="number"
                      min="0"
                      max="100"
                      {...register("deposit_percentage", { valueAsNumber: true })}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="late_fee_daily">Taxa de atraso (R$ por dia)</Label>
                  <Input
                    id="late_fee_daily"
                    type="number"
                    min="0"
                    step="0.01"
                    {...register("late_fee_daily", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aba Serviços */}
        {activeTab === 'services' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-marsala-600" />
                Configurações de Serviços
              </CardTitle>
              <CardDescription>
                Entrega, retirada e outros serviços oferecidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Retirada na loja</Label>
                    <p className="text-sm text-gray-500">Permitir retirada no estabelecimento</p>
                  </div>
                  <Switch
                    checked={watch("pickup_available")}
                    onCheckedChange={(checked) => setValue("pickup_available", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Serviço de entrega</Label>
                    <p className="text-sm text-gray-500">Oferecer entrega dos produtos</p>
                  </div>
                  <Switch
                    checked={watchDeliveryAvailable}
                    onCheckedChange={(checked) => setValue("delivery_available", checked)}
                  />
                </div>
                
                {watchDeliveryAvailable && (
                  <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="delivery_fee">Taxa de entrega (R$)</Label>
                      <Input
                        id="delivery_fee"
                        type="number"
                        min="0"
                        step="0.01"
                        {...register("delivery_fee", { valueAsNumber: true })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="free_delivery_minimum">Valor mínimo para frete grátis (R$)</Label>
                      <Input
                        id="free_delivery_minimum"
                        type="number"
                        min="0"
                        step="0.01"
                        {...register("free_delivery_minimum", { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="fitting_duration_minutes">Duração da prova (minutos)</Label>
                  <Input
                    id="fitting_duration_minutes"
                    type="number"
                    min="15"
                    step="15"
                    {...register("fitting_duration_minutes", { valueAsNumber: true })}
                  />
                  <p className="text-sm text-gray-500">Tempo reservado para cada prova de roupa</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-marsala-600 hover:bg-marsala-700"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BusinessSettings; 