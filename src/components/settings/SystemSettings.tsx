import React, { useState, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Activity, 
  Server, 
  HardDrive,
  Cpu,
  MemoryStick,
  Wifi,
  Database,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Save,
  Monitor,
  Settings,
  BarChart3,
  Globe,
  Shield
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_latency: number;
  active_users: number;
  database_connections: number;
  uptime: string;
  last_backup: string;
  system_load: number;
}

interface SystemSettings {
  // Monitoramento
  enable_monitoring: boolean;
  monitoring_interval: number; // em segundos
  performance_alerts: boolean;
  disk_alert_threshold: number;
  memory_alert_threshold: number;
  cpu_alert_threshold: number;
  
  // Logs
  enable_logging: boolean;
  log_level: string; // error, warning, info, debug
  log_retention_days: number;
  log_file_size_mb: number;
  
  // Manutenção
  maintenance_mode: boolean;
  maintenance_message: string;
  auto_cleanup: boolean;
  cleanup_schedule: string;
  
  // Performance
  cache_enabled: boolean;
  cache_ttl_minutes: number;
  database_optimization: boolean;
  compression_enabled: boolean;
}

const SystemSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'status' | 'monitoring' | 'logs' | 'maintenance' | 'performance'>('status');
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu_usage: 45,
    memory_usage: 68,
    disk_usage: 32,
    network_latency: 12,
    active_users: 8,
    database_connections: 15,
    uptime: "15 dias, 4 horas",
    last_backup: "2024-01-15 02:00",
    system_load: 1.2
  });
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SystemSettings>({
    defaultValues: {
      enable_monitoring: true,
      monitoring_interval: 60,
      performance_alerts: true,
      disk_alert_threshold: 85,
      memory_alert_threshold: 80,
      cpu_alert_threshold: 90,
      
      enable_logging: true,
      log_level: "info",
      log_retention_days: 30,
      log_file_size_mb: 10,
      
      maintenance_mode: false,
      maintenance_message: "Sistema em manutenção. Voltaremos em breve.",
      auto_cleanup: true,
      cleanup_schedule: "weekly",
      
      cache_enabled: true,
      cache_ttl_minutes: 60,
      database_optimization: true,
      compression_enabled: true,
    }
  });

  const watchMaintenanceMode = watch("maintenance_mode");
  const watchMonitoring = watch("enable_monitoring");
  const watchLogging = watch("enable_logging");

  // Simular atualização das métricas em tempo real
  useEffect(() => {
    if (!watchMonitoring) return;
    
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        ...prev,
        cpu_usage: Math.max(10, Math.min(90, prev.cpu_usage + (Math.random() - 0.5) * 10)),
        memory_usage: Math.max(20, Math.min(95, prev.memory_usage + (Math.random() - 0.5) * 5)),
        network_latency: Math.max(5, Math.min(50, prev.network_latency + (Math.random() - 0.5) * 5)),
        active_users: Math.max(0, Math.min(50, prev.active_users + Math.floor((Math.random() - 0.5) * 3))),
        database_connections: Math.max(5, Math.min(100, prev.database_connections + Math.floor((Math.random() - 0.5) * 5))),
        system_load: Math.max(0.1, Math.min(5.0, prev.system_load + (Math.random() - 0.5) * 0.2))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [watchMonitoring]);

  const onSubmit = async (data: SystemSettings) => {
    setIsLoading(true);
    
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Configurações do sistema salvas com sucesso!");
      console.log("Dados do sistema salvos:", data);
      
    } catch (error) {
      toast.error("Erro ao salvar configurações do sistema");
    } finally {
      setIsLoading(false);
    }
  };

  const restartService = (serviceName: string) => {
    toast.info(`Reiniciando ${serviceName}...`);
    setTimeout(() => {
      toast.success(`${serviceName} reiniciado com sucesso!`);
    }, 3000);
  };

  const downloadLogs = () => {
    toast.info("Preparando download dos logs...");
    setTimeout(() => {
      toast.success("Download dos logs iniciado!");
    }, 2000);
  };

  const runSystemCleanup = () => {
    toast.info("Executando limpeza do sistema...");
    setTimeout(() => {
      toast.success("Limpeza do sistema concluída!");
    }, 4000);
  };

  const sections = [
    { id: 'status', label: 'Status', icon: Monitor },
    { id: 'monitoring', label: 'Monitoramento', icon: Activity },
    { id: 'logs', label: 'Logs', icon: BarChart3 },
    { id: 'maintenance', label: 'Manutenção', icon: Settings },
    { id: 'performance', label: 'Performance', icon: Cpu },
  ];

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return "text-red-600 bg-red-50 border-red-200";
    if (value >= thresholds.warning) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  const getProgressColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return "bg-red-500";
    if (value >= thresholds.warning) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-6">
      {/* Header da Seção */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sistema</h2>
          <p className="text-gray-600 mt-1">Status e monitoramento do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Sistema Online
          </Badge>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
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
                    ? 'border-teal-600 text-teal-600'
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
        {/* Seção Status */}
        {activeSection === 'status' && (
          <div className="space-y-6">
            {/* Métricas em Tempo Real */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">CPU</p>
                      <p className="text-2xl font-bold">{systemMetrics.cpu_usage.toFixed(1)}%</p>
                    </div>
                    <Cpu className="w-8 h-8 text-blue-600" />
                  </div>
                  <Progress 
                    value={systemMetrics.cpu_usage} 
                    className="mt-2" 
                    style={{ backgroundColor: getProgressColor(systemMetrics.cpu_usage, { warning: 70, critical: 90 }) }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Memória</p>
                      <p className="text-2xl font-bold">{systemMetrics.memory_usage.toFixed(1)}%</p>
                    </div>
                    <MemoryStick className="w-8 h-8 text-green-600" />
                  </div>
                  <Progress 
                    value={systemMetrics.memory_usage} 
                    className="mt-2"
                    style={{ backgroundColor: getProgressColor(systemMetrics.memory_usage, { warning: 80, critical: 95 }) }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Disco</p>
                      <p className="text-2xl font-bold">{systemMetrics.disk_usage}%</p>
                    </div>
                    <HardDrive className="w-8 h-8 text-purple-600" />
                  </div>
                  <Progress 
                    value={systemMetrics.disk_usage} 
                    className="mt-2"
                    style={{ backgroundColor: getProgressColor(systemMetrics.disk_usage, { warning: 70, critical: 85 }) }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Latência</p>
                      <p className="text-2xl font-bold">{systemMetrics.network_latency.toFixed(0)}ms</p>
                    </div>
                    <Wifi className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Informações Gerais do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-teal-600" />
                  Informações do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Tempo Online</Label>
                    <p className="text-lg font-semibold">{systemMetrics.uptime}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Usuários Ativos</Label>
                    <p className="text-lg font-semibold">{systemMetrics.active_users}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Conexões BD</Label>
                    <p className="text-lg font-semibold">{systemMetrics.database_connections}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Último Backup</Label>
                    <p className="text-lg font-semibold">{systemMetrics.last_backup}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Carga do Sistema</Label>
                    <p className="text-lg font-semibold">{systemMetrics.system_load.toFixed(2)}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Versão</Label>
                    <p className="text-lg font-semibold">v2.1.4</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Serviços do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle>Serviços do Sistema</CardTitle>
                <CardDescription>Status dos principais serviços</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Servidor Web", status: "running", port: "3000" },
                    { name: "Banco de Dados", status: "running", port: "5432" },
                    { name: "Sistema de Backup", status: "running", port: "-" },
                    { name: "Envio de E-mails", status: "stopped", port: "587" },
                    { name: "Cache Redis", status: "running", port: "6379" },
                  ].map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          service.status === 'running' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-gray-500">
                            {service.port !== "-" ? `Porta: ${service.port}` : "Sistema interno"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={service.status === 'running' ? 
                            'text-green-700 border-green-300 bg-green-50' : 
                            'text-red-700 border-red-300 bg-red-50'
                          }
                        >
                          {service.status === 'running' ? 'Ativo' : 'Parado'}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => restartService(service.name)}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reiniciar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Seção Monitoramento */}
        {activeSection === 'monitoring' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Configurações de Monitoramento
                    </CardTitle>
                    <CardDescription>Configure alertas e limites de performance</CardDescription>
                  </div>
                  <Switch
                    checked={watchMonitoring}
                    onCheckedChange={(checked) => setValue("enable_monitoring", checked)}
                  />
                </div>
              </CardHeader>
              {watchMonitoring && (
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="monitoring_interval">Intervalo de Monitoramento (segundos)</Label>
                      <Input
                        id="monitoring_interval"
                        type="number"
                        min="30"
                        max="300"
                        {...register("monitoring_interval", { valueAsNumber: true })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="font-medium">Alertas de Performance</Label>
                        <p className="text-sm text-gray-500">Receber alertas quando limites forem atingidos</p>
                      </div>
                      <Switch
                        checked={watch("performance_alerts")}
                        onCheckedChange={(checked) => setValue("performance_alerts", checked)}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg">Limites de Alerta</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="cpu_alert_threshold">CPU (%)</Label>
                        <Input
                          id="cpu_alert_threshold"
                          type="number"
                          min="50"
                          max="100"
                          {...register("cpu_alert_threshold", { valueAsNumber: true })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="memory_alert_threshold">Memória (%)</Label>
                        <Input
                          id="memory_alert_threshold"
                          type="number"
                          min="50"
                          max="100"
                          {...register("memory_alert_threshold", { valueAsNumber: true })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="disk_alert_threshold">Disco (%)</Label>
                        <Input
                          id="disk_alert_threshold"
                          type="number"
                          min="50"
                          max="100"
                          {...register("disk_alert_threshold", { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* Seção Logs */}
        {activeSection === 'logs' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      Sistema de Logs
                    </CardTitle>
                    <CardDescription>Configure registro e armazenamento de logs</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={downloadLogs}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Logs
                    </Button>
                    <Switch
                      checked={watchLogging}
                      onCheckedChange={(checked) => setValue("enable_logging", checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              {watchLogging && (
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="log_level">Nível de Log</Label>
                      <Select onValueChange={(value) => setValue("log_level", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="error">Error</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="debug">Debug</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="log_retention_days">Retenção (dias)</Label>
                      <Input
                        id="log_retention_days"
                        type="number"
                        min="1"
                        max="365"
                        {...register("log_retention_days", { valueAsNumber: true })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="log_file_size_mb">Tamanho Máximo do Arquivo (MB)</Label>
                      <Input
                        id="log_file_size_mb"
                        type="number"
                        min="1"
                        max="100"
                        {...register("log_file_size_mb", { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Logs Recentes</h4>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="text-green-600">[INFO] Sistema iniciado com sucesso</div>
                      <div className="text-blue-600">[INFO] Backup automático concluído</div>
                      <div className="text-yellow-600">[WARNING] Uso de memória acima de 70%</div>
                      <div className="text-gray-600">[INFO] Usuário admin fez login</div>
                      <div className="text-green-600">[INFO] Cache limpo automaticamente</div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* Seção Manutenção */}
        {activeSection === 'maintenance' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-orange-600" />
                  Modo de Manutenção
                </CardTitle>
                <CardDescription>Controle de acesso durante manutenção</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Ativar Modo de Manutenção</Label>
                    <p className="text-sm text-gray-500">Bloquear acesso de usuários ao sistema</p>
                  </div>
                  <Switch
                    checked={watchMaintenanceMode}
                    onCheckedChange={(checked) => setValue("maintenance_mode", checked)}
                  />
                </div>
                
                {watchMaintenanceMode && (
                  <div className="space-y-4 ml-6 border-l-2 border-orange-300 pl-6">
                    <div className="space-y-2">
                      <Label htmlFor="maintenance_message">Mensagem de Manutenção</Label>
                      <Input
                        id="maintenance_message"
                        placeholder="Sistema em manutenção..."
                        {...register("maintenance_message")}
                      />
                    </div>
                    
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-orange-800 font-medium mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        Aviso
                      </div>
                      <p className="text-orange-700 text-sm">
                        Quando o modo de manutenção estiver ativo, apenas administradores 
                        poderão acessar o sistema.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Limpeza Automática</CardTitle>
                <CardDescription>Configure limpeza de arquivos temporários e cache</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="font-medium">Limpeza Automática</Label>
                    <p className="text-sm text-gray-500">Executar limpeza automaticamente</p>
                  </div>
                  <Switch
                    checked={watch("auto_cleanup")}
                    onCheckedChange={(checked) => setValue("auto_cleanup", checked)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="cleanup_schedule">Frequência da Limpeza</Label>
                    <Select onValueChange={(value) => setValue("cleanup_schedule", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diária</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={runSystemCleanup}
                      className="w-full"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Executar Limpeza Agora
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Seção Performance */}
        {activeSection === 'performance' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-purple-600" />
                  Otimizações de Performance
                </CardTitle>
                <CardDescription>Configure opções para melhorar a performance do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="font-medium">Cache Habilitado</Label>
                      <p className="text-sm text-gray-500">Usar cache para acelerar consultas</p>
                    </div>
                    <Switch
                      checked={watch("cache_enabled")}
                      onCheckedChange={(checked) => setValue("cache_enabled", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="font-medium">Otimização de BD</Label>
                      <p className="text-sm text-gray-500">Otimizar consultas do banco de dados</p>
                    </div>
                    <Switch
                      checked={watch("database_optimization")}
                      onCheckedChange={(checked) => setValue("database_optimization", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="font-medium">Compressão</Label>
                      <p className="text-sm text-gray-500">Comprimir respostas HTTP</p>
                    </div>
                    <Switch
                      checked={watch("compression_enabled")}
                      onCheckedChange={(checked) => setValue("compression_enabled", checked)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cache_ttl_minutes">Tempo de Vida do Cache (minutos)</Label>
                  <Input
                    id="cache_ttl_minutes"
                    type="number"
                    min="1"
                    max="1440"
                    {...register("cache_ttl_minutes", { valueAsNumber: true })}
                  />
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
            className="bg-teal-600 hover:bg-teal-700"
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

export default SystemSettings; 