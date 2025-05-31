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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Database, 
  Download, 
  Upload,
  Clock,
  HardDrive,
  Cloud,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Save,
  FileText,
  Calendar,
  Settings
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface BackupSettings {
  // Backup Automático
  auto_backup_enabled: boolean;
  backup_frequency: string; // daily, weekly, monthly
  backup_time: string;
  backup_retention_days: number;
  
  // Locais de Backup
  local_backup_enabled: boolean;
  local_backup_path: string;
  
  cloud_backup_enabled: boolean;
  cloud_provider: string; // google_drive, dropbox, aws_s3
  
  // Tipos de Dados
  backup_customers: boolean;
  backup_products: boolean;
  backup_rentals: boolean;
  backup_financial: boolean;
  backup_settings: boolean;
  backup_media: boolean;
  
  // Configurações Avançadas
  backup_compression: boolean;
  backup_encryption: boolean;
  max_backup_size_gb: number;
  
  // Notificações
  notify_backup_success: boolean;
  notify_backup_failure: boolean;
  notification_email: string;
}

const BackupSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'schedule' | 'storage' | 'data' | 'restore'>('schedule');
  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupStatus, setLastBackupStatus] = useState<'success' | 'error' | 'pending'>('success');
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BackupSettings>({
    defaultValues: {
      auto_backup_enabled: true,
      backup_frequency: "daily",
      backup_time: "02:00",
      backup_retention_days: 30,
      
      local_backup_enabled: true,
      local_backup_path: "./backups",
      
      cloud_backup_enabled: false,
      cloud_provider: "google_drive",
      
      backup_customers: true,
      backup_products: true,
      backup_rentals: true,
      backup_financial: true,
      backup_settings: true,
      backup_media: false,
      
      backup_compression: true,
      backup_encryption: false,
      max_backup_size_gb: 5,
      
      notify_backup_success: false,
      notify_backup_failure: true,
      notification_email: "",
    }
  });

  const watchAutoBackup = watch("auto_backup_enabled");
  const watchLocalBackup = watch("local_backup_enabled");
  const watchCloudBackup = watch("cloud_backup_enabled");

  const onSubmit = async (data: BackupSettings) => {
    setIsLoading(true);
    
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Configurações de backup salvas com sucesso!");
      console.log("Dados de backup salvos:", data);
      
    } catch (error) {
      toast.error("Erro ao salvar configurações de backup");
    } finally {
      setIsLoading(false);
    }
  };

  const startManualBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);
    
    // Simular progresso do backup
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackingUp(false);
          setLastBackupStatus('success');
          toast.success("Backup manual concluído com sucesso!");
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const downloadBackup = () => {
    toast.info("Preparando download do backup...");
    // Simular download
    setTimeout(() => {
      toast.success("Download do backup iniciado!");
    }, 2000);
  };

  const sections = [
    { id: 'schedule', label: 'Agendamento', icon: Clock },
    { id: 'storage', label: 'Armazenamento', icon: HardDrive },
    { id: 'data', label: 'Dados', icon: Database },
    { id: 'restore', label: 'Restauração', icon: RefreshCw },
  ];

  // Dados simulados de backups recentes
  const recentBackups = [
    { date: "2024-01-15 02:00", size: "2.4 GB", status: "success", location: "Local + Google Drive" },
    { date: "2024-01-14 02:00", size: "2.3 GB", status: "success", location: "Local + Google Drive" },
    { date: "2024-01-13 02:00", size: "2.2 GB", status: "error", location: "Local apenas" },
    { date: "2024-01-12 02:00", size: "2.1 GB", status: "success", location: "Local + Google Drive" },
    { date: "2024-01-11 02:00", size: "2.0 GB", status: "success", location: "Local + Google Drive" },
  ];

  return (
    <div className="space-y-6">
      {/* Header da Seção */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Backup e Recuperação</h2>
          <p className="text-gray-600 mt-1">Configure backup automático e recuperação de dados</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className={`${
              lastBackupStatus === 'success' 
                ? 'text-green-700 border-green-300 bg-green-50' 
                : 'text-red-700 border-red-300 bg-red-50'
            }`}
          >
            {lastBackupStatus === 'success' ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
            Último backup: {lastBackupStatus === 'success' ? 'Sucesso' : 'Erro'}
          </Badge>
          <Button 
            onClick={startManualBackup} 
            disabled={isBackingUp}
            className="bg-gray-600 hover:bg-gray-700"
          >
            {isBackingUp ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Fazendo backup...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Backup Manual
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progresso do Backup (quando ativo) */}
      {isBackingUp && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fazendo backup dos dados...</span>
                <span>{backupProgress}%</span>
              </div>
              <Progress value={backupProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

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
                    ? 'border-gray-600 text-gray-600'
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
        {/* Seção Agendamento */}
        {activeSection === 'schedule' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Backup Automático
                    </CardTitle>
                    <CardDescription>Configure quando e com que frequência fazer backup</CardDescription>
                  </div>
                  <Switch
                    checked={watchAutoBackup}
                    onCheckedChange={(checked) => setValue("auto_backup_enabled", checked)}
                  />
                </div>
              </CardHeader>
              {watchAutoBackup && (
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="backup_frequency">Frequência</Label>
                      <Select onValueChange={(value) => setValue("backup_frequency", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diário</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="backup_time">Horário</Label>
                      <Input
                        id="backup_time"
                        type="time"
                        {...register("backup_time")}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="backup_retention_days">Retenção (dias)</Label>
                      <Input
                        id="backup_retention_days"
                        type="number"
                        min="1"
                        max="365"
                        {...register("backup_retention_days", { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                      <Clock className="w-4 h-4" />
                      Próximo Backup Agendado
                    </div>
                    <p className="text-blue-700 text-sm">
                      {watch("backup_frequency") === 'daily' ? 'Hoje' : 
                       watch("backup_frequency") === 'weekly' ? 'Segunda-feira' : 
                       'Dia 1 do próximo mês'} às {watch("backup_time")}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* Seção Armazenamento */}
        {activeSection === 'storage' && (
          <div className="space-y-6">
            {/* Backup Local */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <HardDrive className="h-5 w-5 text-gray-600" />
                      Armazenamento Local
                    </CardTitle>
                    <CardDescription>Salvar backups no servidor local</CardDescription>
                  </div>
                  <Switch
                    checked={watchLocalBackup}
                    onCheckedChange={(checked) => setValue("local_backup_enabled", checked)}
                  />
                </div>
              </CardHeader>
              {watchLocalBackup && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="local_backup_path">Caminho dos Backups</Label>
                    <Input
                      id="local_backup_path"
                      placeholder="./backups"
                      {...register("local_backup_path")}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium text-gray-700">Espaço Usado</div>
                      <div className="text-2xl font-bold text-gray-900">12.5 GB</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium text-gray-700">Espaço Disponível</div>
                      <div className="text-2xl font-bold text-gray-900">487.2 GB</div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Backup na Nuvem */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Cloud className="h-5 w-5 text-blue-600" />
                      Armazenamento na Nuvem
                    </CardTitle>
                    <CardDescription>Sincronizar backups com serviços de nuvem</CardDescription>
                  </div>
                  <Switch
                    checked={watchCloudBackup}
                    onCheckedChange={(checked) => setValue("cloud_backup_enabled", checked)}
                  />
                </div>
              </CardHeader>
              {watchCloudBackup && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cloud_provider">Provedor de Nuvem</Label>
                    <Select onValueChange={(value) => setValue("cloud_provider", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google_drive">Google Drive</SelectItem>
                        <SelectItem value="dropbox">Dropbox</SelectItem>
                        <SelectItem value="aws_s3">Amazon S3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-700 text-sm">
                      Configure as credenciais do {watch("cloud_provider")} na seção "Integrações" 
                      para habilitar o backup na nuvem.
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* Seção Dados */}
        {activeSection === 'data' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-600" />
                  Tipos de Dados para Backup
                </CardTitle>
                <CardDescription>Selecione quais dados incluir no backup</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'backup_customers', label: 'Clientes', description: 'Dados dos clientes e contatos', size: '1.2 MB' },
                    { key: 'backup_products', label: 'Produtos', description: 'Catálogo de vestidos e acessórios', size: '3.4 MB' },
                    { key: 'backup_rentals', label: 'Aluguéis', description: 'Histórico de aluguéis e reservas', size: '8.7 MB' },
                    { key: 'backup_financial', label: 'Financeiro', description: 'Pagamentos e transações', size: '2.1 MB' },
                    { key: 'backup_settings', label: 'Configurações', description: 'Configurações do sistema', size: '156 KB' },
                    { key: 'backup_media', label: 'Mídia', description: 'Fotos dos produtos (grande)', size: '2.3 GB' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-start gap-3">
                        <Switch
                          checked={watch(item.key as keyof BackupSettings) as boolean}
                          onCheckedChange={(checked) => setValue(item.key as keyof BackupSettings, checked as any)}
                        />
                        <div>
                          <Label className="font-medium">{item.label}</Label>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.size}
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Configurações Avançadas</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="font-medium">Compressão</Label>
                        <p className="text-sm text-gray-500">Reduzir tamanho dos arquivos de backup</p>
                      </div>
                      <Switch
                        checked={watch("backup_compression")}
                        onCheckedChange={(checked) => setValue("backup_compression", checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="font-medium">Criptografia</Label>
                        <p className="text-sm text-gray-500">Proteger dados com senha</p>
                      </div>
                      <Switch
                        checked={watch("backup_encryption")}
                        onCheckedChange={(checked) => setValue("backup_encryption", checked)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max_backup_size_gb">Tamanho Máximo do Backup (GB)</Label>
                    <Input
                      id="max_backup_size_gb"
                      type="number"
                      min="1"
                      max="100"
                      {...register("max_backup_size_gb", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Seção Restauração */}
        {activeSection === 'restore' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-orange-600" />
                  Backups Disponíveis
                </CardTitle>
                <CardDescription>Restaure dados de backups anteriores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentBackups.map((backup, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          backup.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <div className="font-medium">{backup.date}</div>
                          <div className="text-sm text-gray-500">{backup.location} • {backup.size}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={downloadBackup}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-orange-600 border-orange-200"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Restaurar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Upload de Backup</h4>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Arraste um arquivo de backup aqui ou clique para selecionar</p>
                    <Button variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      Selecionar Arquivo
                    </Button>
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
            className="bg-gray-600 hover:bg-gray-700"
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

export default BackupSettings; 