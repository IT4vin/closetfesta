import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Activity,
  Shield,
  RefreshCw,
  Zap,
  Users,
  Settings,
  TrendingUp,
  Archive,
  Repeat
} from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
import CompressedStorage from "@/lib/compression";
import DifferentialSync from "@/lib/differential-sync";
import PermissionManager, { usePermissions } from "@/lib/permissions";
import ExecutiveDashboard from "@/components/dashboard/ExecutiveDashboard";

interface AuditLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC' | 'BACKUP' | 'RESTORE';
  entity_type: 'ORDER' | 'PAYMENT' | 'SYSTEM';
  entity_id?: string;
  details: any;
  user_agent: string;
  timestamp: string;
  success: boolean;
  error_message?: string;
}

const SystemManagement = () => {
  const { toast } = useToast();
  const { 
    syncStatus, 
    createBackup, 
    restoreBackup, 
    listBackups,
    getAdvancedStats,
    optimizeStorage,
    forceDifferentialSync
  } = useOrders();
  
  const { user, hasPermission } = usePermissions();
  
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [systemStats, setSystemStats] = useState({
    totalOrders: 0,
    pendingSync: 0,
    storageUsed: 0,
    lastBackup: null as string | null,
    lastSync: null as string | null
  });
  const [compressionStats, setCompressionStats] = useState<any>(null);
  const [syncStats, setSyncStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Carregar dados do sistema
  useEffect(() => {
    loadAuditLogs();
    loadBackups();
    updateSystemStats();
    loadAdvancedStats();
  }, []);

  const loadAdvancedStats = async () => {
    try {
      const stats = getAdvancedStats();
      setCompressionStats(stats.compression);
      setSyncStats(stats.sync);
    } catch (error) {
      console.error('Erro ao carregar estatísticas avançadas:', error);
    }
  };

  const loadAuditLogs = () => {
    try {
      const logs = JSON.parse(localStorage.getItem('closetfesta_audit_logs') || '[]');
      setAuditLogs(logs.slice(0, 100)); // Mostrar apenas os últimos 100 logs
    } catch (error) {
      console.error('Erro ao carregar logs de auditoria:', error);
    }
  };

  const loadBackups = () => {
    try {
      const backupList = listBackups();
      setBackups(backupList);
    } catch (error) {
      console.error('Erro ao carregar lista de backups:', error);
    }
  };

  const updateSystemStats = () => {
    try {
      const orders = JSON.parse(localStorage.getItem('closetfesta_orders') || '[]');
      const pendingSync = JSON.parse(localStorage.getItem('closetfesta_pending_sync') || '[]');
      
      // Calcular uso de storage
      let storageUsed = 0;
      for (let key in localStorage) {
        if (key.startsWith('closetfesta_')) {
          storageUsed += (localStorage[key].length + key.length) * 2; // UTF-16 = 2 bytes por char
        }
      }

      const backupList = listBackups();
      const lastBackup = backupList.length > 0 ? backupList[0].date : null;

      setSystemStats({
        totalOrders: orders.length,
        pendingSync: pendingSync.length,
        storageUsed: Math.round(storageUsed / 1024), // KB
        lastBackup,
        lastSync: syncStatus.last_sync
      });
    } catch (error) {
      console.error('Erro ao atualizar estatísticas do sistema:', error);
    }
  };

  const handleCreateBackup = async () => {
    try {
      const backupKey = await createBackup();
      
      toast({
        title: "Backup criado com sucesso!",
        description: `Backup salvo como: ${backupKey}`,
      });

      loadBackups();
      updateSystemStats();
    } catch (error) {
      toast({
        title: "Erro ao criar backup",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    try {
      const result = await restoreBackup(selectedBackup);
      
      toast({
        title: "Backup restaurado com sucesso!",
        description: `${result.orders_restored} pedidos foram restaurados.`,
      });

      setIsRestoreDialogOpen(false);
      setSelectedBackup(null);
      updateSystemStats();
    } catch (error) {
      toast({
        title: "Erro ao restaurar backup",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const exportAuditLogs = () => {
    try {
      const dataStr = JSON.stringify(auditLogs, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Logs exportados",
        description: "Arquivo de logs de auditoria baixado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar logs",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const clearOldLogs = () => {
    try {
      // Manter apenas os logs dos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentLogs = auditLogs.filter(log => 
        new Date(log.timestamp) > thirtyDaysAgo
      );
      
      localStorage.setItem('closetfesta_audit_logs', JSON.stringify(recentLogs));
      setAuditLogs(recentLogs);
      
      toast({
        title: "Logs limpos",
        description: `${auditLogs.length - recentLogs.length} logs antigos foram removidos.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao limpar logs",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleOptimizeStorage = async () => {
    try {
      const result = await optimizeStorage();
      
      toast({
        title: "Armazenamento otimizado!",
        description: `${formatBytes(result.freed_bytes)} de espaço liberado em ${result.operations} operações.`,
      });

      loadAdvancedStats();
      updateSystemStats();
    } catch (error) {
      toast({
        title: "Erro ao otimizar armazenamento",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleForceDifferentialSync = async () => {
    try {
      const result = await forceDifferentialSync();
      
      toast({
        title: "Sincronização forçada concluída!",
        description: `${result.changes_sent} mudanças enviadas, ${result.changes_received} recebidas.`,
      });

      loadAdvancedStats();
    } catch (error) {
      toast({
        title: "Erro na sincronização",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleMigrateCompression = () => {
    try {
      const result = CompressedStorage.migrateExistingData();
      
      toast({
        title: "Migração concluída!",
        description: `${result.migrated} itens migrados para formato comprimido.`,
      });

      loadAdvancedStats();
    } catch (error) {
      toast({
        title: "Erro na migração",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'UPDATE': return <RotateCcw className="h-4 w-4 text-blue-500" />;
      case 'DELETE': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'SYNC': return <RotateCcw className="h-4 w-4 text-purple-500" />;
      case 'BACKUP': return <Database className="h-4 w-4 text-indigo-500" />;
      case 'RESTORE': return <Upload className="h-4 w-4 text-orange-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!hasPermission('system', 'read')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800">Acesso Restrito</h3>
          <p className="text-gray-600">Você não tem permissão para acessar o gerenciamento do sistema.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com informações do usuário */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento do Sistema</h2>
          <p className="text-gray-600">
            Logado como: <span className="font-medium">{user?.full_name}</span> 
            <Badge variant="outline" className="ml-2">{user?.role.name}</Badge>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Recarregar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="compression">Compressão</TabsTrigger>
          <TabsTrigger value="sync">Sincronização</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="executive">Dashboard Executivo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Estatísticas do Sistema */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Pedidos</p>
                    <p className="text-2xl font-bold">{systemStats.totalOrders}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pendente Sincronização</p>
                    <p className="text-2xl font-bold text-orange-500">{systemStats.pendingSync}</p>
                  </div>
                  <Repeat className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Armazenamento</p>
                    <p className="text-2xl font-bold">{formatBytes(systemStats.storageUsed * 1024)}</p>
                  </div>
                  <HardDrive className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Status de Sincronização</p>
                    <p className="text-sm">
                      {syncStatus.sync_in_progress ? (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Sincronizando...
                        </Badge>
                      ) : syncStatus.last_error ? (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Erro
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          OK
                        </Badge>
                      )}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={handleOptimizeStorage} className="h-auto p-4 flex flex-col items-start">
                <Archive className="h-6 w-6 mb-2" />
                <span className="font-medium">Otimizar Armazenamento</span>
                <span className="text-xs text-gray-500">Recomprimir dados para economizar espaço</span>
              </Button>
              
              <Button onClick={handleForceDifferentialSync} variant="outline" className="h-auto p-4 flex flex-col items-start">
                <Repeat className="h-6 w-6 mb-2" />
                <span className="font-medium">Forçar Sincronização</span>
                <span className="text-xs text-gray-500">Sincronizar mudanças pendentes agora</span>
              </Button>
              
              <Button onClick={handleCreateBackup} variant="outline" className="h-auto p-4 flex flex-col items-start">
                <Database className="h-6 w-6 mb-2" />
                <span className="font-medium">Criar Backup</span>
                <span className="text-xs text-gray-500">Backup manual dos dados atuais</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compression" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Estatísticas de Compressão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {compressionStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Total de Operações</p>
                    <p className="text-2xl font-bold text-blue-800">{compressionStats.total_operations}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Espaço Economizado</p>
                    <p className="text-2xl font-bold text-green-800">
                      {formatBytes(compressionStats.total_savings_bytes)}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600">Taxa de Compressão</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {Math.round((1 - compressionStats.average_compression_ratio) * 100)}%
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-600">Dados Processados</p>
                    <p className="text-2xl font-bold text-orange-800">
                      {formatBytes(compressionStats.total_original_bytes)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Carregando estatísticas de compressão...</p>
              )}
              
              <div className="flex gap-2">
                <Button onClick={handleMigrateCompression} variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Migrar Dados Existentes
                </Button>
                <Button onClick={handleOptimizeStorage}>
                  <Archive className="h-4 w-4 mr-2" />
                  Otimizar Agora
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="h-5 w-5" />
                Sincronização Diferencial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {syncStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Mudanças Pendentes</p>
                    <p className="text-2xl font-bold text-blue-800">{syncStats.pending_changes}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Mudanças Hoje</p>
                    <p className="text-2xl font-bold text-green-800">{syncStats.total_changes_today}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600">Tamanho Médio</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {formatBytes(syncStats.average_sync_size)}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-600">Última Sincronização</p>
                    <p className="text-sm font-bold text-orange-800">
                      {syncStats.last_sync ? new Date(syncStats.last_sync).toLocaleString('pt-BR') : 'Nunca'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Carregando estatísticas de sincronização...</p>
              )}
              
              <div className="flex gap-2">
                <Button onClick={handleForceDifferentialSync}>
                  <Repeat className="h-4 w-4 mr-2" />
                  Sincronizar Agora
                </Button>
                <Button variant="outline" onClick={() => DifferentialSync.forceFullSync()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sincronização Completa
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          {/* Gerenciamento de Backup - código existente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Gerenciamento de Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={handleCreateBackup}>
                  <Download className="h-4 w-4 mr-2" />
                  Criar Backup
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsRestoreDialogOpen(true)}
                  disabled={backups.length === 0}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Restaurar Backup
                </Button>
              </div>

              {/* Lista de Backups */}
              {backups.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Backups Disponíveis</h4>
                  <div className="space-y-2">
                    {backups.slice(0, 5).map((backup) => (
                      <div key={backup.key} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium text-sm">
                            {new Date(backup.date).toLocaleString('pt-BR')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {backup.orders_count} pedidos • {formatBytes(backup.size)}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedBackup(backup.key);
                            setIsRestoreDialogOpen(true);
                          }}
                        >
                          Restaurar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executive" className="space-y-6">
          <ExecutiveDashboard />
        </TabsContent>
      </Tabs>

      {/* Dialog de Restauração */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurar Backup</DialogTitle>
            <DialogDescription>
              Esta ação irá substituir todos os dados atuais pelos dados do backup selecionado.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBackup && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm font-medium">Backup Selecionado:</p>
              <p className="text-sm text-gray-600">{selectedBackup}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRestoreBackup} disabled={!selectedBackup}>
              Restaurar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Logs de Auditoria */}
      <Dialog open={isAuditDialogOpen} onOpenChange={setIsAuditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Logs de Auditoria</DialogTitle>
            <DialogDescription>
              Histórico completo de atividades do sistema
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ação</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      {log.action}
                    </TableCell>
                    <TableCell>{log.entity_type}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {log.success ? (
                        <Badge variant="outline">Sucesso</Badge>
                      ) : (
                        <Badge variant="destructive">Erro</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setSelectedLog(log)}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {selectedLog && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">Detalhes do Log</h4>
              <Textarea 
                value={JSON.stringify(selectedLog, null, 2)} 
                readOnly 
                className="h-32 text-xs font-mono"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SystemManagement; 