import { useState, useEffect, useCallback } from 'react';
import { ordersApi, paymentsApi, type Order, type ApiResponse, ApiError } from '@/lib/api';
import CompressedStorage from '@/lib/compression';
import DifferentialSync from '@/lib/differential-sync';
import PermissionManager from '@/lib/permissions';

// Importar produtos mock do useProducts
const mockProducts = [
  {
    id: 'TEST-001',
    sku: '123456789',
    name: 'Vestido de Festa Azul Marinho',
    description: 'Elegante vestido de festa em tecido premium',
    price: 299.90,
    rental_price: 89.90,
    quantity: 3,
    category_id: 'CAT-001',
    sizes: ['P', 'M', 'G'],
    featured: true,
    deleted: false,
    status: 'available' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: []
  },
  {
    id: 'TEST-002', 
    sku: '987654321',
    name: 'Terno Clássico Preto',
    description: 'Terno executivo de alta qualidade',
    price: 599.90,
    rental_price: 149.90,
    quantity: 2,
    category_id: 'CAT-002',
    sizes: ['42', '44', '46'],
    featured: true,
    deleted: false,
    status: 'available' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: []
  },
  {
    id: 'TEST-003',
    sku: '456789123',
    name: 'Smoking Premium',
    description: 'Smoking para eventos especiais',
    price: 799.90,
    rental_price: 199.90,
    quantity: 1,
    category_id: 'CAT-003',
    sizes: ['40', '42', '44'],
    featured: false,
    deleted: false,
    status: 'available' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: []
  },
  {
    id: 'TEST-004',
    sku: '789123456',
    name: 'Gravata Italiana',
    description: 'Gravata de seda importada',
    price: 89.90,
    rental_price: 19.90,
    quantity: 10,
    category_id: 'CAT-004',
    sizes: ['Único'],
    featured: false,
    deleted: false,
    status: 'available' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: []
  },
  {
    id: 'TEST-005',
    sku: '321654987',
    name: 'Sapato Social Premium',
    description: 'Sapato de couro legítimo',
    price: 249.90,
    rental_price: 49.90,
    quantity: 5,
    category_id: 'CAT-005',
    sizes: ['39', '40', '41', '42', '43'],
    featured: true,
    deleted: false,
    status: 'available' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: []
  }
];

interface UseOrdersOptions {
  status?: string;
  order_type?: string;
  customer_name?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
  autoFetch?: boolean;
  enableSync?: boolean; // Nova opção para sincronização automática
}

// Interface para logs de auditoria
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

// Interface para status de sincronização
interface SyncStatus {
  last_sync: string | null;
  pending_orders: number;
  sync_in_progress: boolean;
  last_error?: string;
}

// Mock storage local para pedidos
const ORDERS_STORAGE_KEY = 'closetfesta_orders';
const LAST_ORDER_NUMBER_KEY = 'closetfesta_last_order_number';
const PENDING_SYNC_KEY = 'closetfesta_pending_sync';
const AUDIT_LOGS_KEY = 'closetfesta_audit_logs';
const SYNC_STATUS_KEY = 'closetfesta_sync_status';
const BACKUP_KEY = 'closetfesta_backup_';

// Função para gerar ID único
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Função para criar log de auditoria
const createAuditLog = (
  action: AuditLog['action'],
  entity_type: AuditLog['entity_type'],
  details: any,
  entity_id?: string,
  success: boolean = true,
  error_message?: string
): AuditLog => ({
  id: generateId(),
  action,
  entity_type,
  entity_id,
  details,
  user_agent: navigator.userAgent,
  timestamp: new Date().toISOString(),
  success,
  error_message
});

// Função para salvar log de auditoria
const saveAuditLog = (log: AuditLog) => {
  try {
    const existingLogs = JSON.parse(localStorage.getItem(AUDIT_LOGS_KEY) || '[]');
    const updatedLogs = [log, ...existingLogs].slice(0, 1000); // Manter apenas os últimos 1000 logs
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error('Erro ao salvar log de auditoria:', error);
  }
};

// Função para validar integridade dos dados
const validateOrderData = (order: Order): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validações básicas
  if (!order.id || typeof order.id !== 'string') {
    errors.push('ID do pedido inválido');
  }

  if (!order.order_number || typeof order.order_number !== 'string') {
    errors.push('Número do pedido inválido');
  }

  if (!order.customer_name || typeof order.customer_name !== 'string' || order.customer_name.trim().length < 2) {
    errors.push('Nome do cliente inválido');
  }

  if (!['sale', 'rental', 'hybrid'].includes(order.order_type)) {
    errors.push('Tipo de pedido inválido');
  }

  if (!['draft', 'confirmed', 'completed', 'cancelled'].includes(order.status)) {
    errors.push('Status do pedido inválido');
  }

  if (!Array.isArray(order.items) || order.items.length === 0) {
    errors.push('Pedido deve ter pelo menos um item');
  }

  // Validar valores numéricos
  if (typeof order.total !== 'number' || order.total < 0) {
    errors.push('Total do pedido inválido');
  }

  if (typeof order.subtotal !== 'number' || order.subtotal < 0) {
    errors.push('Subtotal do pedido inválido');
  }

  // Validar datas
  try {
    new Date(order.created_at);
    new Date(order.updated_at);
  } catch {
    errors.push('Datas do pedido inválidas');
  }

  // Validar itens
  order.items.forEach((item, index) => {
    if (!item.product_id) {
      errors.push(`Item ${index + 1}: ID do produto inválido`);
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Quantidade inválida`);
    }
    if (typeof item.unit_price !== 'number' || item.unit_price < 0) {
      errors.push(`Item ${index + 1}: Preço unitário inválido`);
    }
    if (!['sale', 'rental'].includes(item.item_type)) {
      errors.push(`Item ${index + 1}: Tipo de item inválido`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Função para gerar número do pedido
const generateOrderNumber = (): string => {
  const lastNumber = parseInt(localStorage.getItem(LAST_ORDER_NUMBER_KEY) || '0');
  const newNumber = lastNumber + 1;
  localStorage.setItem(LAST_ORDER_NUMBER_KEY, newNumber.toString());
  return `PED-${newNumber.toString().padStart(6, '0')}`;
};

// Função para salvar pedidos no localStorage com compressão
const saveOrdersToStorage = (orders: Order[]) => {
  CompressedStorage.setItem(ORDERS_STORAGE_KEY, orders);
};

// Função para carregar pedidos do localStorage com descompressão
const loadOrdersFromStorage = (): Order[] => {
  return CompressedStorage.getItem<Order[]>(ORDERS_STORAGE_KEY) || [];
};

// Função para salvar pedidos pendentes de sincronização
const savePendingSync = (orders: Order[]) => {
  CompressedStorage.setItem(PENDING_SYNC_KEY, orders);
};

// Função para carregar pedidos pendentes de sincronização
const loadPendingSync = (): Order[] => {
  return CompressedStorage.getItem<Order[]>(PENDING_SYNC_KEY) || [];
};

// Função para atualizar status de sincronização
const updateSyncStatus = (status: Partial<SyncStatus>) => {
  const current = CompressedStorage.getItem<any>(SYNC_STATUS_KEY) || {};
  const updated = { ...current, ...status };
  CompressedStorage.setItem(SYNC_STATUS_KEY, updated);
};

// Função para verificar conectividade com servidor
const checkServerConnectivity = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/health', { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000) // 5 segundos timeout
    });
    return response.ok;
  } catch {
    return false;
  }
};

export function useOrders(options: UseOrdersOptions = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    last_sync: null,
    pending_orders: 0,
    sync_in_progress: false
  });

  const { autoFetch = true, enableSync = true, ...apiOptions } = options;

  // Verificar permissões no início
  useEffect(() => {
    // Inicializar sistema de permissões
    PermissionManager.initialize();
    
    // Verificar se usuário tem permissão para acessar pedidos
    if (!PermissionManager.hasPermission('orders', 'read')) {
      setError('Sem permissão para acessar pedidos');
      return;
    }
  }, []);

  // Carregar pedidos do localStorage com compressão
  useEffect(() => {
    try {
      const storedOrders = loadOrdersFromStorage();
      const pendingOrders = loadPendingSync();
      
      // Validar integridade dos dados
      const validOrders = storedOrders.filter(order => {
        const validation = validateOrderData(order);
        if (!validation.isValid) {
          console.warn(`Pedido ${order.id} possui dados inválidos:`, validation.errors);
          saveAuditLog(createAuditLog(
            'UPDATE',
            'ORDER',
            { validation_errors: validation.errors },
            order.id,
            false,
            'Dados inválidos detectados'
          ));
          return false;
        }
        return true;
      });

      setOrders(validOrders);
      setTotal(validOrders.length);
      setSyncStatus(prev => ({
        ...prev,
        pending_orders: pendingOrders.length
      }));
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setError('Erro ao carregar dados dos pedidos');
    }
  }, []);

  // Sincronização diferencial automática
  useEffect(() => {
    if (!enableSync) return;

    const syncInterval = setInterval(async () => {
      try {
        const result = await DifferentialSync.performSync();
        
        if (result.success) {
          // Recarregar pedidos após sincronização bem-sucedida
          const updatedOrders = loadOrdersFromStorage();
          setOrders(updatedOrders);
          setTotal(updatedOrders.length);
          
          setSyncStatus({
            last_sync: result.sync_timestamp,
            pending_orders: 0,
            sync_in_progress: false
          });
        }
      } catch (error) {
        console.error('Erro na sincronização automática:', error);
      }
    }, 30000); // 30 segundos

    return () => clearInterval(syncInterval);
  }, [enableSync]);

  // Função para sincronizar com servidor
  const syncWithServer = useCallback(async () => {
    if (syncStatus.sync_in_progress) return;

    setSyncStatus(prev => ({ ...prev, sync_in_progress: true }));
    
    try {
      const isConnected = await checkServerConnectivity();
      
      if (!isConnected) {
        throw new Error('Servidor indisponível');
      }

      const pendingOrders = loadPendingSync();
      
      // Enviar pedidos pendentes para o servidor
      for (const order of pendingOrders) {
        try {
          await ordersApi.create(order as any);
          saveAuditLog(createAuditLog(
            'SYNC',
            'ORDER',
            { order_id: order.id, direction: 'local_to_server' },
            order.id
          ));
        } catch (error) {
          console.error('Erro ao sincronizar pedido:', order.id, error);
          saveAuditLog(createAuditLog(
            'SYNC',
            'ORDER',
            { order_id: order.id, direction: 'local_to_server' },
            order.id,
            false,
            (error as Error).message
          ));
        }
      }

      // Buscar pedidos atualizados do servidor
      const serverOrders = await ordersApi.findAll({});
      
      if (serverOrders.success) {
        // Mesclar com pedidos locais
        const localOrders = loadOrdersFromStorage();
        const mergedOrders = mergeOrders(localOrders, serverOrders.data);
        saveOrdersToStorage(mergedOrders);
        setOrders(mergedOrders);
        
        // Limpar pedidos pendentes que foram sincronizados
        savePendingSync([]);
      }

      updateSyncStatus({
        last_sync: new Date().toISOString(),
        pending_orders: 0,
        sync_in_progress: false,
        last_error: undefined
      });

      saveAuditLog(createAuditLog(
        'SYNC',
        'SYSTEM',
        { synced_orders: pendingOrders.length }
      ));

    } catch (error) {
      const errorMessage = (error as Error).message;
      updateSyncStatus({
        sync_in_progress: false,
        last_error: errorMessage
      });

      saveAuditLog(createAuditLog(
        'SYNC',
        'SYSTEM',
        {},
        undefined,
        false,
        errorMessage
      ));
    } finally {
      setSyncStatus(prev => ({ ...prev, sync_in_progress: false }));
    }
  }, [syncStatus.sync_in_progress]);

  // Função para mesclar pedidos locais e do servidor
  const mergeOrders = (localOrders: Order[], serverOrders: Order[]): Order[] => {
    const merged = new Map<string, Order>();

    // Adicionar pedidos do servidor
    serverOrders.forEach(order => {
      merged.set(order.id, order);
    });

    // Adicionar pedidos locais que não existem no servidor
    localOrders.forEach(order => {
      if (!merged.has(order.id)) {
        merged.set(order.id, order);
      }
    });

    return Array.from(merged.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  // Função para criar backup
  const createBackup = useCallback(() => {
    try {
      const backupData = {
        orders: loadOrdersFromStorage(),
        pending_sync: loadPendingSync(),
        audit_logs: JSON.parse(localStorage.getItem(AUDIT_LOGS_KEY) || '[]'),
        last_order_number: localStorage.getItem(LAST_ORDER_NUMBER_KEY),
        created_at: new Date().toISOString(),
        version: '1.0'
      };

      const backupKey = `${BACKUP_KEY}${new Date().toISOString().split('T')[0]}`;
      localStorage.setItem(backupKey, JSON.stringify(backupData));

      saveAuditLog(createAuditLog(
        'BACKUP',
        'SYSTEM',
        { backup_key: backupKey, orders_count: backupData.orders.length }
      ));

      // Manter apenas os últimos 7 backups
      const allKeys = Object.keys(localStorage);
      const backupKeys = allKeys.filter(key => key.startsWith(BACKUP_KEY))
        .sort().reverse().slice(7);
      
      backupKeys.forEach(key => localStorage.removeItem(key));

      return backupKey;
    } catch (error) {
      saveAuditLog(createAuditLog(
        'BACKUP',
        'SYSTEM',
        {},
        undefined,
        false,
        (error as Error).message
      ));
      throw error;
    }
  }, []);

  // Função para restaurar backup
  const restoreBackup = useCallback((backupKey: string) => {
    try {
      const backupData = localStorage.getItem(backupKey);
      if (!backupData) {
        throw new Error('Backup não encontrado');
      }

      const parsed = JSON.parse(backupData);
      
      // Validar estrutura do backup
      if (!parsed.orders || !Array.isArray(parsed.orders)) {
        throw new Error('Backup inválido: estrutura de pedidos incorreta');
      }

      // Validar cada pedido
      const validOrders = parsed.orders.filter((order: Order) => {
        const validation = validateOrderData(order);
        return validation.isValid;
      });

      // Restaurar dados
      saveOrdersToStorage(validOrders);
      if (parsed.pending_sync) {
        savePendingSync(parsed.pending_sync);
      }
      if (parsed.last_order_number) {
        localStorage.setItem(LAST_ORDER_NUMBER_KEY, parsed.last_order_number);
      }

      setOrders(validOrders);
      setTotal(validOrders.length);

      saveAuditLog(createAuditLog(
        'RESTORE',
        'SYSTEM',
        { 
          backup_key: backupKey, 
          restored_orders: validOrders.length,
          backup_date: parsed.created_at 
        }
      ));

      return {
        success: true,
        orders_restored: validOrders.length,
        backup_date: parsed.created_at
      };
    } catch (error) {
      saveAuditLog(createAuditLog(
        'RESTORE',
        'SYSTEM',
        { backup_key: backupKey },
        undefined,
        false,
        (error as Error).message
      ));
      throw error;
    }
  }, []);

  // Função para listar backups disponíveis
  const listBackups = useCallback(() => {
    const allKeys = Object.keys(localStorage);
    const backupKeys = allKeys.filter(key => key.startsWith(BACKUP_KEY));
    
    return backupKeys.map(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        return {
          key,
          date: data.created_at || 'Data desconhecida',
          orders_count: data.orders?.length || 0,
          size: new Blob([localStorage.getItem(key) || '']).size
        };
      } catch {
        return {
          key,
          date: 'Backup corrompido',
          orders_count: 0,
          size: 0
        };
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  // Função para verificar necessidade de backup
  const checkBackupNeeded = useCallback(() => {
    try {
      const backupList = listBackups();
      const orders = loadOrdersFromStorage();
      
      if (backupList.length === 0 && orders.length >= 5) {
        return {
          needed: true,
          reason: 'Nenhum backup encontrado',
          urgency: 'high' as const
        };
      }
      
      if (backupList.length > 0) {
        const lastBackup = backupList[0];
        const lastBackupDate = new Date(lastBackup.date);
        const daysSinceBackup = (Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceBackup >= 7) {
          return {
            needed: true,
            reason: `Último backup há ${Math.floor(daysSinceBackup)} dias`,
            urgency: 'medium' as const
          };
        }
        
        const ordersSinceBackup = orders.filter(order => 
          new Date(order.created_at) > lastBackupDate
        ).length;
        
        if (ordersSinceBackup >= 20) {
          return {
            needed: true,
            reason: `${ordersSinceBackup} novos pedidos desde o último backup`,
            urgency: 'medium' as const
          };
        }
      }
      
      return {
        needed: false,
        reason: null,
        urgency: 'low' as const
      };
    } catch (error) {
      console.error('Erro ao verificar necessidade de backup:', error);
      return {
        needed: false,
        reason: null,
        urgency: 'low' as const
      };
    }
  }, [listBackups]);

  // Função para obter estatísticas detalhadas
  const getSystemHealth = useCallback(() => {
    try {
      const orders = loadOrdersFromStorage();
      const pendingSync = loadPendingSync();
      const auditLogs = JSON.parse(localStorage.getItem(AUDIT_LOGS_KEY) || '[]');
      
      // Calcular taxa de erro nos últimos 7 dias
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentLogs = auditLogs.filter((log: any) => 
        new Date(log.timestamp) > sevenDaysAgo
      );
      
      const errorRate = recentLogs.length > 0 
        ? (recentLogs.filter((log: any) => !log.success).length / recentLogs.length) * 100
        : 0;
      
      // Calcular uso de storage
      let storageUsed = 0;
      for (let key in localStorage) {
        if (key.startsWith('closetfesta_')) {
          storageUsed += (localStorage[key].length + key.length) * 2;
        }
      }
      
      const backup = checkBackupNeeded();
      
      return {
        orders_count: orders.length,
        pending_sync: pendingSync.length,
        storage_used_bytes: storageUsed,
        storage_used_mb: Math.round(storageUsed / (1024 * 1024) * 100) / 100,
        error_rate: Math.round(errorRate * 100) / 100,
        backup_status: backup,
        last_activity: auditLogs.length > 0 ? auditLogs[0].timestamp : null,
        health_score: calculateHealthScore({
          errorRate,
          pendingSyncCount: pendingSync.length,
          backupStatus: backup,
          storageUsage: storageUsed / (5 * 1024 * 1024) // 5MB limit
        })
      };
    } catch (error) {
      console.error('Erro ao obter saúde do sistema:', error);
      return {
        orders_count: 0,
        pending_sync: 0,
        storage_used_bytes: 0,
        storage_used_mb: 0,
        error_rate: 0,
        backup_status: { needed: false, reason: null, urgency: 'low' as const },
        last_activity: null,
        health_score: 50
      };
    }
  }, [checkBackupNeeded]);

  // Função para calcular score de saúde do sistema
  const calculateHealthScore = (metrics: {
    errorRate: number;
    pendingSyncCount: number;
    backupStatus: any;
    storageUsage: number;
  }): number => {
    let score = 100;
    
    // Penalizar taxa de erro
    score -= metrics.errorRate * 2;
    
    // Penalizar pedidos pendentes de sincronização
    score -= Math.min(metrics.pendingSyncCount * 5, 30);
    
    // Penalizar falta de backup
    if (metrics.backupStatus.needed) {
      score -= metrics.backupStatus.urgency === 'high' ? 40 : 20;
    }
    
    // Penalizar uso excessivo de storage
    if (metrics.storageUsage > 0.8) {
      score -= 20;
    } else if (metrics.storageUsage > 0.6) {
      score -= 10;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Tentar buscar do servidor primeiro
      try {
        const response: ApiResponse<Order[]> = await ordersApi.findAll(apiOptions);
        
        if (response.success) {
          setOrders(response.data);
          setTotal(response.total || response.data.length);
          return;
        }
      } catch (serverError) {
        console.log('Servidor indisponível, usando dados locais...');
      }

      // Fallback para dados locais
      const storedOrders = loadOrdersFromStorage();
      let filteredOrders = storedOrders;

      // Aplicar filtros localmente
      if (apiOptions.status) {
        filteredOrders = filteredOrders.filter(order => order.status === apiOptions.status);
      }
      if (apiOptions.order_type) {
        filteredOrders = filteredOrders.filter(order => order.order_type === apiOptions.order_type);
      }
      if (apiOptions.customer_name) {
        filteredOrders = filteredOrders.filter(order => 
          order.customer_name.toLowerCase().includes(apiOptions.customer_name!.toLowerCase())
        );
      }

      setOrders(filteredOrders);
      setTotal(filteredOrders.length);
      
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao carregar pedidos';
      
      setError(errorMessage);
      console.error('Erro ao buscar pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: {
    customer_name: string;
    customer_document?: string;
    customer_phone?: string;
    order_type: 'sale' | 'rental' | 'hybrid';
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
      discount: number;
      item_type: 'sale' | 'rental';
      try_on_date?: string;
      pickup_date?: string;
      event_date?: string;
      return_date?: string;
    }>;
    subtotal: number;
    total_discount: number;
    total: number;
    total_sales: number;
    total_rentals: number;
    observations?: string;
  }) => {
    // Verificar permissões
    if (!PermissionManager.hasPermission('orders', 'create')) {
      throw new Error('Sem permissão para criar pedidos');
    }

    const currentUser = PermissionManager.getCurrentUser();
    
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      order_number: generateOrderNumber(),
      customer_name: orderData.customer_name,
      customer_document: orderData.customer_document,
      customer_phone: orderData.customer_phone,
      order_type: orderData.order_type,
      status: 'confirmed',
      items: orderData.items.map((item, index) => ({
        id: `item-${Date.now()}-${index}`,
        product_id: item.product_id,
        product: mockProducts.find(p => p.id === item.product_id) || {
          id: item.product_id,
          name: `Produto ${item.product_id}`,
          description: 'Produto de teste',
          price: item.unit_price,
          quantity: 0,
          category_id: 'CAT-001',
          sizes: [],
          featured: false,
          deleted: false,
          status: 'available',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          images: []
        },
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        subtotal: (item.unit_price * item.quantity) - item.discount,
        item_type: item.item_type,
        try_on_date: item.try_on_date,
        pickup_date: item.pickup_date,
        event_date: item.event_date,
        return_date: item.return_date,
        status: 'pending'
      })),
      subtotal: orderData.subtotal,
      total_discount: orderData.total_discount,
      total: orderData.total,
      total_sales: orderData.total_sales,
      total_rentals: orderData.total_rentals,
      observations: orderData.observations,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: currentUser?.full_name || 'Sistema Local'
    };

    // Validar dados do pedido antes de salvar
    const validation = validateOrderData(newOrder);
    if (!validation.isValid) {
      const errorMessage = `Dados do pedido inválidos: ${validation.errors.join(', ')}`;
      saveAuditLog(createAuditLog(
        'CREATE',
        'ORDER',
        { validation_errors: validation.errors },
        newOrder.id,
        false,
        errorMessage
      ));
      throw new Error(errorMessage);
    }

    try {
      // Salvar localmente primeiro
      const existingOrders = loadOrdersFromStorage();
      const updatedOrders = [newOrder, ...existingOrders];
      saveOrdersToStorage(updatedOrders);

      // Registrar mudança para sincronização diferencial
      DifferentialSync.recordChange(
        'ORDER',
        newOrder.id,
        'CREATE',
        newOrder,
        currentUser?.id
      );

      // Atualizar estado
      setOrders(updatedOrders);
      setTotal(updatedOrders.length);

      // Log de auditoria
      saveAuditLog(createAuditLog(
        'CREATE',
        'ORDER',
        { 
          order_data: orderData, 
          compression_enabled: true,
          differential_sync: true 
        },
        newOrder.id
      ));

      // Criar backup automático a cada 10 pedidos
      if (updatedOrders.length % 10 === 0) {
        try {
          createBackup();
        } catch (backupError) {
          console.warn('Erro ao criar backup automático:', backupError);
        }
      }

      return newOrder;
      
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao criar pedido';
      
      saveAuditLog(createAuditLog(
        'CREATE',
        'ORDER',
        { order_data: orderData },
        newOrder.id,
        false,
        errorMessage
      ));
      
      setError(errorMessage);
      throw err;
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const response = await ordersApi.updateStatus(id, status);
      
      if (response.success) {
        await fetchOrders(); // Recarregar lista
        return true;
      } else {
        throw new Error(response.message || 'Erro ao atualizar status');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao atualizar status';
      
      setError(errorMessage);
      throw err;
    }
  };

  const returnItem = async (orderId: string, itemId: string, returnData: {
    actual_return_date: string;
    late_fee?: number;
    observations?: string;
  }) => {
    try {
      const response = await ordersApi.returnItem(orderId, itemId, returnData);
      
      if (response.success) {
        await fetchOrders(); // Recarregar lista
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao processar devolução');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao processar devolução';
      
      setError(errorMessage);
      throw err;
    }
  };

  const generateContract = async (id: string) => {
    try {
      const response = await ordersApi.generateContract(id);
      if (response.success) {
        if (response.data?.url) {
          window.open(response.data.url, '_blank');
        } else {
          console.info(response.message || 'Geração de contrato PDF ainda não configurada.');
        }
        return true;
      }
      throw new Error(response.message || 'Erro ao gerar contrato');
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erro ao gerar contrato';
      setError(errorMessage);
      throw err;
    }
  };

  const generateReceipt = async (id: string) => {
    try {
      const response = await ordersApi.generateReceipt(id);
      if (response.success) {
        if (response.data?.url) {
          window.open(response.data.url, '_blank');
        } else {
          console.info(response.message || 'Geração de recibo PDF ainda não configurada.');
        }
        return true;
      }
      throw new Error(response.message || 'Erro ao gerar comprovante');
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erro ao gerar comprovante';
      setError(errorMessage);
      throw err;
    }

  };

  const processPayment = async (paymentData: {
    order_id: string;
    amount: number;
    payment_method: 'cash' | 'card' | 'pix' | 'transfer';
    payment_details?: any;
  }) => {
    try {
      const response = await paymentsApi.process(paymentData);
      
      if (response.success) {
        await fetchOrders(); // Recarregar lista para atualizar status
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao processar pagamento');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao processar pagamento';
      
      setError(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchOrders();
    }
  }, [
    apiOptions.status,
    apiOptions.order_type,
    apiOptions.customer_name,
    apiOptions.date_from,
    apiOptions.date_to,
    apiOptions.limit,
    apiOptions.offset
  ]);

  // Função para obter estatísticas de compressão e sincronização
  const getAdvancedStats = useCallback(() => {
    const compressionStats = CompressedStorage.getCompressionStats();
    const syncStats = DifferentialSync.getSyncStats();
    const systemHealth = getSystemHealth();
    
    return {
      compression: compressionStats,
      sync: syncStats,
      health: systemHealth,
      permissions: {
        user: PermissionManager.getCurrentUser()?.full_name || 'Não autenticado',
        role: PermissionManager.getCurrentUser()?.role.name || 'N/A'
      }
    };
  }, []);

  // Função para otimizar armazenamento
  const optimizeStorage = useCallback(async () => {
    try {
      const result = CompressedStorage.optimizeStorage();
      
      saveAuditLog(createAuditLog(
        'BACKUP',
        'SYSTEM',
        { 
          freed_bytes: result.freed_bytes,
          operations: result.operations 
        }
      ));
      
      return result;
    } catch (error) {
      throw new Error(`Erro ao otimizar armazenamento: ${(error as Error).message}`);
    }
  }, []);

  return {
    orders,
    loading,
    error,
    total,
    refetch: fetchOrders,
    createOrder,
    updateOrderStatus,
    returnItem,
    generateContract,
    generateReceipt,
    processPayment,
    clearError: () => setError(null),
    syncStatus,
    createBackup,
    restoreBackup,
    listBackups,
    getSystemHealth,
    // Novas funcionalidades
    getAdvancedStats,
    optimizeStorage,
    forceDifferentialSync: DifferentialSync.performSync,
    compressionStats: CompressedStorage.getCompressionStats(),
    syncStatsDiff: DifferentialSync.getSyncStats()
  };
}

// Hook para buscar um pedido específico
export function useOrder(id: string | undefined) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async () => {
    if (!id) {
      setOrder(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response: ApiResponse<Order> = await ordersApi.findById(id);
      
      if (response.success) {
        setOrder(response.data);
      } else {
        throw new Error(response.message || 'Erro ao buscar pedido');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao carregar pedido';
      
      setError(errorMessage);
      setOrder(null);
      console.error('Erro ao buscar pedido:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  return {
    order,
    loading,
    error,
    refetch: fetchOrder,
    clearError: () => setError(null)
  };
} 