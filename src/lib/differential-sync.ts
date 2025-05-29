// Sistema de sincronização diferencial
// Sincroniza apenas mudanças desde a última sincronização

import { Order } from '@/lib/api';
import CompressedStorage from './compression';

export interface SyncChange {
  id: string;
  entity_type: 'ORDER' | 'PAYMENT' | 'CUSTOMER';
  entity_id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: string;
  checksum: string;
  user_id?: string;
  device_id: string;
}

export interface SyncDiff {
  local_changes: SyncChange[];
  server_changes: SyncChange[];
  conflicts: SyncConflict[];
  last_sync_timestamp: string;
}

export interface SyncConflict {
  entity_id: string;
  entity_type: string;
  local_change: SyncChange;
  server_change: SyncChange;
  resolution?: 'local' | 'server' | 'merge';
}

export interface SyncResult {
  success: boolean;
  changes_sent: number;
  changes_received: number;
  conflicts_resolved: number;
  bandwidth_saved: number; // bytes
  sync_timestamp: string;
  errors?: string[];
}

export class DifferentialSync {
  private static readonly CHANGES_KEY = 'closetfesta_sync_changes';
  private static readonly LAST_SYNC_KEY = 'closetfesta_last_sync_timestamp';
  private static readonly DEVICE_ID_KEY = 'closetfesta_device_id';
  private static readonly CONFLICT_RESOLUTION_KEY = 'closetfesta_conflict_resolution';

  // Gerar ID único do dispositivo
  private static getDeviceId(): string {
    let deviceId = localStorage.getItem(this.DEVICE_ID_KEY);
    
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  }

  // Gerar checksum para detectar mudanças
  private static generateChecksum(data: any): string {
    const str = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Converter para 32-bit
    }
    
    return Math.abs(hash).toString(36);
  }

  // Registrar mudança local
  static recordChange(
    entity_type: SyncChange['entity_type'], 
    entity_id: string, 
    operation: SyncChange['operation'], 
    data: any,
    user_id?: string
  ): void {
    const change: SyncChange = {
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entity_type,
      entity_id,
      operation,
      data: operation === 'DELETE' ? { id: entity_id } : data,
      timestamp: new Date().toISOString(),
      checksum: this.generateChecksum(data),
      user_id,
      device_id: this.getDeviceId()
    };

    const existingChanges = CompressedStorage.getItem<SyncChange[]>(this.CHANGES_KEY) || [];
    
    // Remover mudanças antigas para a mesma entidade (consolidação)
    const filteredChanges = existingChanges.filter(c => 
      !(c.entity_type === entity_type && c.entity_id === entity_id)
    );
    
    filteredChanges.push(change);
    CompressedStorage.setItem(this.CHANGES_KEY, filteredChanges);

    console.log(`📝 Mudança registrada: ${operation} ${entity_type} ${entity_id}`);
  }

  // Obter mudanças locais pendentes
  static getLocalChanges(since?: string): SyncChange[] {
    const allChanges = CompressedStorage.getItem<SyncChange[]>(this.CHANGES_KEY) || [];
    
    if (!since) return allChanges;
    
    const sinceDate = new Date(since);
    return allChanges.filter(change => new Date(change.timestamp) > sinceDate);
  }

  // Calcular diferenças para sincronização
  static calculateSyncDiff(serverLastSync?: string): SyncDiff {
    const lastLocalSync = localStorage.getItem(this.LAST_SYNC_KEY);
    const syncTimestamp = lastLocalSync || new Date(0).toISOString();
    
    const localChanges = this.getLocalChanges(syncTimestamp);
    
    return {
      local_changes: localChanges,
      server_changes: [], // Será preenchido pelo servidor
      conflicts: [],
      last_sync_timestamp: syncTimestamp
    };
  }

  // Detectar e resolver conflitos
  static detectConflicts(localChanges: SyncChange[], serverChanges: SyncChange[]): SyncConflict[] {
    const conflicts: SyncConflict[] = [];
    
    localChanges.forEach(localChange => {
      const conflictingServerChange = serverChanges.find(serverChange => 
        serverChange.entity_type === localChange.entity_type &&
        serverChange.entity_id === localChange.entity_id &&
        serverChange.device_id !== localChange.device_id
      );
      
      if (conflictingServerChange) {
        // Verificar se são realmente conflitantes (checksums diferentes)
        if (localChange.checksum !== conflictingServerChange.checksum) {
          conflicts.push({
            entity_id: localChange.entity_id,
            entity_type: localChange.entity_type,
            local_change: localChange,
            server_change: conflictingServerChange
          });
        }
      }
    });
    
    return conflicts;
  }

  // Resolver conflitos automaticamente
  static resolveConflicts(conflicts: SyncConflict[]): SyncConflict[] {
    const resolutionRules = CompressedStorage.getItem<any>(this.CONFLICT_RESOLUTION_KEY) || {
      default_strategy: 'server_wins', // 'local_wins', 'server_wins', 'manual'
      entity_strategies: {}
    };

    return conflicts.map(conflict => {
      const strategy = resolutionRules.entity_strategies[conflict.entity_type] || 
                     resolutionRules.default_strategy;

      switch (strategy) {
        case 'local_wins':
          conflict.resolution = 'local';
          break;
        case 'server_wins':
          conflict.resolution = 'server';
          break;
        case 'timestamp_wins':
          // Mais recente ganha
          const localTime = new Date(conflict.local_change.timestamp);
          const serverTime = new Date(conflict.server_change.timestamp);
          conflict.resolution = localTime > serverTime ? 'local' : 'server';
          break;
        case 'merge':
          conflict.resolution = 'merge';
          break;
        default:
          conflict.resolution = 'server'; // Fallback seguro
      }

      return conflict;
    });
  }

  // Aplicar mudanças do servidor
  static applyServerChanges(changes: SyncChange[]): { applied: number; errors: string[] } {
    let applied = 0;
    const errors: string[] = [];

    changes.forEach(change => {
      try {
        switch (change.entity_type) {
          case 'ORDER':
            this.applyOrderChange(change);
            applied++;
            break;
          case 'PAYMENT':
            this.applyPaymentChange(change);
            applied++;
            break;
          case 'CUSTOMER':
            this.applyCustomerChange(change);
            applied++;
            break;
          default:
            errors.push(`Tipo de entidade desconhecido: ${change.entity_type}`);
        }
      } catch (error) {
        errors.push(`Erro ao aplicar mudança ${change.id}: ${(error as Error).message}`);
      }
    });

    return { applied, errors };
  }

  private static applyOrderChange(change: SyncChange): void {
    const existingOrders = CompressedStorage.getItem<Order[]>('closetfesta_orders') || [];
    
    switch (change.operation) {
      case 'CREATE':
        // Adicionar se não existir
        if (!existingOrders.find(o => o.id === change.entity_id)) {
          existingOrders.unshift(change.data);
        }
        break;
      case 'UPDATE':
        // Atualizar se existir
        const updateIndex = existingOrders.findIndex(o => o.id === change.entity_id);
        if (updateIndex >= 0) {
          existingOrders[updateIndex] = { ...existingOrders[updateIndex], ...change.data };
        }
        break;
      case 'DELETE':
        // Remover se existir
        const deleteIndex = existingOrders.findIndex(o => o.id === change.entity_id);
        if (deleteIndex >= 0) {
          existingOrders.splice(deleteIndex, 1);
        }
        break;
    }
    
    CompressedStorage.setItem('closetfesta_orders', existingOrders);
  }

  private static applyPaymentChange(change: SyncChange): void {
    // Implementar lógica para pagamentos
    console.log('Aplicando mudança de pagamento:', change);
  }

  private static applyCustomerChange(change: SyncChange): void {
    // Implementar lógica para clientes
    console.log('Aplicando mudança de cliente:', change);
  }

  // Sincronização principal
  static async performSync(serverEndpoint: string = '/api/sync'): Promise<SyncResult> {
    const startTime = Date.now();
    const diff = this.calculateSyncDiff();
    
    try {
      // Preparar dados para envio (apenas mudanças)
      const syncRequest = {
        device_id: this.getDeviceId(),
        last_sync: diff.last_sync_timestamp,
        changes: diff.local_changes,
        client_timestamp: new Date().toISOString()
      };

      // Calcular bytes que seriam enviados sem otimização
      const fullDataSize = this.estimateFullSyncSize();
      const diffDataSize = new Blob([JSON.stringify(syncRequest)]).size;
      const bandwidthSaved = Math.max(0, fullDataSize - diffDataSize);

      console.log(`🔄 Sincronização diferencial: ${diffDataSize}B vs ${fullDataSize}B (${Math.round((bandwidthSaved / fullDataSize) * 100)}% economia)`);

      // Simular resposta do servidor (em produção seria uma chamada real)
      const mockServerResponse = {
        success: true,
        server_changes: [] as SyncChange[],
        conflicts: [] as SyncConflict[],
        sync_timestamp: new Date().toISOString()
      };

      // Detectar e resolver conflitos
      const conflicts = this.detectConflicts(diff.local_changes, mockServerResponse.server_changes);
      const resolvedConflicts = this.resolveConflicts(conflicts);

      // Aplicar mudanças do servidor
      const applyResult = this.applyServerChanges(mockServerResponse.server_changes);

      // Limpar mudanças locais que foram sincronizadas com sucesso
      this.clearSyncedChanges(diff.local_changes);

      // Atualizar timestamp da última sincronização
      localStorage.setItem(this.LAST_SYNC_KEY, mockServerResponse.sync_timestamp);

      return {
        success: true,
        changes_sent: diff.local_changes.length,
        changes_received: mockServerResponse.server_changes.length,
        conflicts_resolved: resolvedConflicts.length,
        bandwidth_saved: bandwidthSaved,
        sync_timestamp: mockServerResponse.sync_timestamp,
        errors: applyResult.errors
      };

    } catch (error) {
      return {
        success: false,
        changes_sent: 0,
        changes_received: 0,
        conflicts_resolved: 0,
        bandwidth_saved: 0,
        sync_timestamp: new Date().toISOString(),
        errors: [(error as Error).message]
      };
    }
  }

  private static estimateFullSyncSize(): number {
    // Estimar tamanho de uma sincronização completa
    const orders = CompressedStorage.getItem<Order[]>('closetfesta_orders') || [];
    return new Blob([JSON.stringify(orders)]).size;
  }

  private static clearSyncedChanges(syncedChanges: SyncChange[]): void {
    const allChanges = CompressedStorage.getItem<SyncChange[]>(this.CHANGES_KEY) || [];
    const syncedIds = new Set(syncedChanges.map(c => c.id));
    
    const remainingChanges = allChanges.filter(change => !syncedIds.has(change.id));
    CompressedStorage.setItem(this.CHANGES_KEY, remainingChanges);
  }

  // Configurar estratégias de resolução de conflitos
  static setConflictResolution(config: {
    default_strategy: 'local_wins' | 'server_wins' | 'timestamp_wins' | 'merge' | 'manual';
    entity_strategies?: { [key: string]: string };
  }): void {
    CompressedStorage.setItem(this.CONFLICT_RESOLUTION_KEY, config);
  }

  // Obter estatísticas de sincronização
  static getSyncStats(): {
    pending_changes: number;
    last_sync: string | null;
    total_changes_today: number;
    average_sync_size: number;
    device_id: string;
  } {
    const pendingChanges = this.getLocalChanges();
    const lastSync = localStorage.getItem(this.LAST_SYNC_KEY);
    
    // Contar mudanças de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayChanges = pendingChanges.filter(c => 
      new Date(c.timestamp) >= today
    );

    return {
      pending_changes: pendingChanges.length,
      last_sync: lastSync,
      total_changes_today: todayChanges.length,
      average_sync_size: pendingChanges.length > 0 ? 
        new Blob([JSON.stringify(pendingChanges)]).size / pendingChanges.length : 0,
      device_id: this.getDeviceId()
    };
  }

  // Forçar sincronização completa (útil para recuperação)
  static async forceFullSync(): Promise<SyncResult> {
    // Limpar timestamp para forçar sincronização completa
    localStorage.removeItem(this.LAST_SYNC_KEY);
    CompressedStorage.setItem(this.CHANGES_KEY, []);
    
    return this.performSync();
  }
}

export default DifferentialSync; 