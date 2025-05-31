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
import { Textarea } from "@/components/ui/textarea";
import { 
  Bell, 
  Mail, 
  Smartphone,
  Calendar,
  DollarSign,
  AlertTriangle,
  Users,
  Clock,
  Save,
  Volume2,
  VolumeX,
  Settings
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface NotificationSettings {
  // Notificações Gerais
  enable_notifications: boolean;
  notification_sound: boolean;
  notification_volume: number;
  
  // E-mail
  email_notifications: boolean;
  email_new_rental: boolean;
  email_payment_received: boolean;
  email_rental_reminder: boolean;
  email_rental_return: boolean;
  email_late_return: boolean;
  email_daily_summary: boolean;
  email_weekly_report: boolean;
  
  // WhatsApp
  whatsapp_notifications: boolean;
  whatsapp_new_rental: boolean;
  whatsapp_payment_received: boolean;
  whatsapp_rental_reminder: boolean;
  whatsapp_rental_return: boolean;
  whatsapp_late_return: boolean;
  
  // Alertas do Sistema
  system_alerts: boolean;
  alert_low_stock: boolean;
  alert_maintenance_due: boolean;
  alert_payment_failed: boolean;
  alert_backup_failed: boolean;
  
  // Configurações de Timing
  reminder_hours_before: number;
  late_alert_hours_after: number;
  daily_summary_time: string;
  weekly_report_day: string;
  
  // Templates de Mensagem
  rental_confirmation_template: string;
  payment_confirmation_template: string;
  reminder_template: string;
  late_return_template: string;
}

const NotificationsSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'general' | 'email' | 'whatsapp' | 'alerts' | 'templates'>('general');
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<NotificationSettings>({
    defaultValues: {
      enable_notifications: true,
      notification_sound: true,
      notification_volume: 70,
      
      email_notifications: true,
      email_new_rental: true,
      email_payment_received: true,
      email_rental_reminder: true,
      email_rental_return: true,
      email_late_return: true,
      email_daily_summary: false,
      email_weekly_report: false,
      
      whatsapp_notifications: false,
      whatsapp_new_rental: false,
      whatsapp_payment_received: false,
      whatsapp_rental_reminder: false,
      whatsapp_rental_return: false,
      whatsapp_late_return: false,
      
      system_alerts: true,
      alert_low_stock: true,
      alert_maintenance_due: true,
      alert_payment_failed: true,
      alert_backup_failed: true,
      
      reminder_hours_before: 24,
      late_alert_hours_after: 2,
      daily_summary_time: "18:00",
      weekly_report_day: "monday",
      
      rental_confirmation_template: "Olá {cliente_nome}! Sua reserva do vestido {produto_nome} foi confirmada para {data_evento}. Total: R$ {valor_total}.",
      payment_confirmation_template: "Pagamento de R$ {valor} recebido com sucesso! Obrigado pela preferência.",
      reminder_template: "Lembrete: Seu aluguel do vestido {produto_nome} deve ser devolvido amanhã ({data_devolucao}).",
      late_return_template: "Atenção! O prazo de devolução do vestido {produto_nome} venceu. Entre em contato conosco.",
    }
  });

  const watchNotifications = watch("enable_notifications");
  const watchEmailNotifications = watch("email_notifications");
  const watchWhatsAppNotifications = watch("whatsapp_notifications");
  const watchSystemAlerts = watch("system_alerts");
  const watchNotificationSound = watch("notification_sound");

  const onSubmit = async (data: NotificationSettings) => {
    setIsLoading(true);
    
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Configurações de notificação salvas com sucesso!");
      console.log("Dados de notificação salvos:", data);
      
    } catch (error) {
      toast.error("Erro ao salvar configurações de notificação");
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = (type: string) => {
    toast.info(`Enviando notificação de teste via ${type}...`);
    
    setTimeout(() => {
      toast.success(`Notificação de teste enviada via ${type} com sucesso!`);
    }, 1500);
  };

  const sections = [
    { id: 'general', label: 'Geral', icon: Settings },
    { id: 'email', label: 'E-mail', icon: Mail },
    { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
    { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
    { id: 'templates', label: 'Templates', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      {/* Header da Seção */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notificações</h2>
          <p className="text-gray-600 mt-1">Configure alertas, emails e comunicações automáticas</p>
        </div>
        <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">
          <Bell className="w-4 h-4 mr-2" />
          Sistema de notificações
        </Badge>
      </div>

      {/* Navegação das Seções */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeSection === section.id
                    ? 'border-yellow-600 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {section.label}
              </button>
            );
          })}
        </nav>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Seção Geral */}
        {activeSection === 'general' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-yellow-600" />
                  Configurações Gerais
                </CardTitle>
                <CardDescription>Configurações básicas do sistema de notificações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Ativar Notificações</Label>
                    <p className="text-sm text-gray-500">Receber notificações do sistema</p>
                  </div>
                  <Switch
                    checked={watchNotifications}
                    onCheckedChange={(checked) => setValue("enable_notifications", checked)}
                  />
                </div>

                {watchNotifications && (
                  <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="text-base font-medium flex items-center gap-2">
                          {watchNotificationSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                          Som das Notificações
                        </Label>
                        <p className="text-sm text-gray-500">Reproduzir som ao receber notificações</p>
                      </div>
                      <Switch
                        checked={watchNotificationSound}
                        onCheckedChange={(checked) => setValue("notification_sound", checked)}
                      />
                    </div>

                    {watchNotificationSound && (
                      <div className="ml-6 space-y-2">
                        <Label>Volume das Notificações: {watch("notification_volume")}%</Label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="10"
                          value={watch("notification_volume")}
                          onChange={(e) => setValue("notification_volume", parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Seção E-mail */}
        {activeSection === 'email' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-blue-600" />
                      Notificações por E-mail
                    </CardTitle>
                    <CardDescription>Configure quando enviar e-mails automáticos</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {watchEmailNotifications && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => testNotification("E-mail")}
                      >
                        Testar
                      </Button>
                    )}
                    <Switch
                      checked={watchEmailNotifications}
                      onCheckedChange={(checked) => setValue("email_notifications", checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              {watchEmailNotifications && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'email_new_rental', label: 'Novo Aluguel', description: 'Quando um novo aluguel é confirmado' },
                      { key: 'email_payment_received', label: 'Pagamento Recebido', description: 'Quando um pagamento é confirmado' },
                      { key: 'email_rental_reminder', label: 'Lembrete de Aluguel', description: 'Lembrete antes do evento' },
                      { key: 'email_rental_return', label: 'Devolução', description: 'Lembrete de devolução' },
                      { key: 'email_late_return', label: 'Atraso na Devolução', description: 'Quando há atraso na devolução' },
                      { key: 'email_daily_summary', label: 'Resumo Diário', description: 'Resumo das atividades do dia' },
                      { key: 'email_weekly_report', label: 'Relatório Semanal', description: 'Relatório semanal de vendas' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">{item.label}</Label>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                        <Switch
                          checked={watch(item.key as keyof NotificationSettings) as boolean}
                          onCheckedChange={(checked) => setValue(item.key as keyof NotificationSettings, checked as any)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* Seção WhatsApp */}
        {activeSection === 'whatsapp' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-green-600" />
                      Notificações por WhatsApp
                    </CardTitle>
                    <CardDescription>Configure mensagens automáticas via WhatsApp</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {watchWhatsAppNotifications && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => testNotification("WhatsApp")}
                      >
                        Testar
                      </Button>
                    )}
                    <Switch
                      checked={watchWhatsAppNotifications}
                      onCheckedChange={(checked) => setValue("whatsapp_notifications", checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              {watchWhatsAppNotifications && (
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      Importante
                    </div>
                    <p className="text-blue-700 text-sm">
                      As notificações por WhatsApp requerem integração com a API do WhatsApp Business. 
                      Configure as credenciais na seção "Integrações".
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'whatsapp_new_rental', label: 'Novo Aluguel', description: 'Confirmação de aluguel' },
                      { key: 'whatsapp_payment_received', label: 'Pagamento Recebido', description: 'Confirmação de pagamento' },
                      { key: 'whatsapp_rental_reminder', label: 'Lembrete', description: 'Lembrete antes do evento' },
                      { key: 'whatsapp_rental_return', label: 'Devolução', description: 'Lembrete de devolução' },
                      { key: 'whatsapp_late_return', label: 'Atraso', description: 'Notificação de atraso' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">{item.label}</Label>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                        <Switch
                          checked={watch(item.key as keyof NotificationSettings) as boolean}
                          onCheckedChange={(checked) => setValue(item.key as keyof NotificationSettings, checked as any)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* Seção Alertas */}
        {activeSection === 'alerts' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Alertas do Sistema
                    </CardTitle>
                    <CardDescription>Notificações sobre eventos importantes do sistema</CardDescription>
                  </div>
                  <Switch
                    checked={watchSystemAlerts}
                    onCheckedChange={(checked) => setValue("system_alerts", checked)}
                  />
                </div>
              </CardHeader>
              {watchSystemAlerts && (
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'alert_low_stock', label: 'Estoque Baixo', description: 'Quando um produto está com estoque baixo', icon: Users },
                      { key: 'alert_maintenance_due', label: 'Manutenção Pendente', description: 'Quando um produto precisa de manutenção', icon: Settings },
                      { key: 'alert_payment_failed', label: 'Falha no Pagamento', description: 'Quando um pagamento falha', icon: DollarSign },
                      { key: 'alert_backup_failed', label: 'Falha no Backup', description: 'Quando o backup automático falha', icon: AlertTriangle },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-start gap-3">
                            <Icon className="w-5 h-5 text-gray-600 mt-0.5" />
                            <div>
                              <Label className="font-medium">{item.label}</Label>
                              <p className="text-sm text-gray-500">{item.description}</p>
                            </div>
                          </div>
                          <Switch
                            checked={watch(item.key as keyof NotificationSettings) as boolean}
                            onCheckedChange={(checked) => setValue(item.key as keyof NotificationSettings, checked as any)}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium text-lg">Configurações de Timing</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="reminder_hours_before">Lembrete (horas antes do evento)</Label>
                        <Select onValueChange={(value) => setValue("reminder_hours_before", parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="6">6 horas</SelectItem>
                            <SelectItem value="12">12 horas</SelectItem>
                            <SelectItem value="24">24 horas (1 dia)</SelectItem>
                            <SelectItem value="48">48 horas (2 dias)</SelectItem>
                            <SelectItem value="72">72 horas (3 dias)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="late_alert_hours_after">Alerta de atraso (horas após vencimento)</Label>
                        <Select onValueChange={(value) => setValue("late_alert_hours_after", parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 hora</SelectItem>
                            <SelectItem value="2">2 horas</SelectItem>
                            <SelectItem value="6">6 horas</SelectItem>
                            <SelectItem value="12">12 horas</SelectItem>
                            <SelectItem value="24">24 horas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="daily_summary_time">Horário do resumo diário</Label>
                        <Input
                          id="daily_summary_time"
                          type="time"
                          {...register("daily_summary_time")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="weekly_report_day">Dia do relatório semanal</Label>
                        <Select onValueChange={(value) => setValue("weekly_report_day", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monday">Segunda-feira</SelectItem>
                            <SelectItem value="tuesday">Terça-feira</SelectItem>
                            <SelectItem value="wednesday">Quarta-feira</SelectItem>
                            <SelectItem value="thursday">Quinta-feira</SelectItem>
                            <SelectItem value="friday">Sexta-feira</SelectItem>
                            <SelectItem value="saturday">Sábado</SelectItem>
                            <SelectItem value="sunday">Domingo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* Seção Templates */}
        {activeSection === 'templates' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-purple-600" />
                  Templates de Mensagem
                </CardTitle>
                <CardDescription>Personalize as mensagens automáticas enviadas aos clientes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-purple-800 mb-2">Variáveis Disponíveis:</h4>
                  <div className="text-sm text-purple-700 space-y-1">
                    <p><code className="bg-purple-100 px-2 py-1 rounded">{"{cliente_nome}"}</code> - Nome do cliente</p>
                    <p><code className="bg-purple-100 px-2 py-1 rounded">{"{produto_nome}"}</code> - Nome do produto</p>
                    <p><code className="bg-purple-100 px-2 py-1 rounded">{"{data_evento}"}</code> - Data do evento</p>
                    <p><code className="bg-purple-100 px-2 py-1 rounded">{"{data_devolucao}"}</code> - Data de devolução</p>
                    <p><code className="bg-purple-100 px-2 py-1 rounded">{"{valor_total}"}</code> - Valor total</p>
                    <p><code className="bg-purple-100 px-2 py-1 rounded">{"{valor}"}</code> - Valor do pagamento</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="rental_confirmation_template">Template - Confirmação de Aluguel</Label>
                    <Textarea
                      id="rental_confirmation_template"
                      placeholder="Mensagem de confirmação de aluguel"
                      className="min-h-[80px]"
                      {...register("rental_confirmation_template")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_confirmation_template">Template - Confirmação de Pagamento</Label>
                    <Textarea
                      id="payment_confirmation_template"
                      placeholder="Mensagem de confirmação de pagamento"
                      className="min-h-[80px]"
                      {...register("payment_confirmation_template")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reminder_template">Template - Lembrete</Label>
                    <Textarea
                      id="reminder_template"
                      placeholder="Mensagem de lembrete"
                      className="min-h-[80px]"
                      {...register("reminder_template")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="late_return_template">Template - Atraso na Devolução</Label>
                    <Textarea
                      id="late_return_template"
                      placeholder="Mensagem de atraso na devolução"
                      className="min-h-[80px]"
                      {...register("late_return_template")}
                    />
                  </div>
                </div>
              </CardContent>
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
            className="bg-yellow-600 hover:bg-yellow-700"
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

export default NotificationsSettings; 