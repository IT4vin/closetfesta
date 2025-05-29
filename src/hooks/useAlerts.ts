import { useState, useEffect } from 'react';
import { alertsApi, type RentalAlert, type ApiResponse, ApiError } from '@/lib/api';

interface UseAlertsOptions {
  alert_type?: string;
  is_read?: boolean;
  limit?: number;
  autoFetch?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // em ms
}

export function useAlerts(options: UseAlertsOptions = {}) {
  const [alerts, setAlerts] = useState<RentalAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const { autoFetch = true, autoRefresh = false, refreshInterval = 30000, ...apiOptions } = options;

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: ApiResponse<RentalAlert[]> = await alertsApi.findAll(apiOptions);
      
      if (response.success) {
        setAlerts(response.data);
        setUnreadCount(response.data.filter(alert => !alert.is_read).length);
      } else {
        throw new Error(response.message || 'Erro ao buscar alertas');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao carregar alertas';
      
      setError(errorMessage);
      console.error('Erro ao buscar alertas:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await alertsApi.markAsRead(id);
      
      if (response.success) {
        // Update local state
        setAlerts(prevAlerts => 
          prevAlerts.map(alert => 
            alert.id === id 
              ? { ...alert, is_read: true }
              : alert
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return true;
      } else {
        throw new Error(response.message || 'Erro ao marcar alerta como lido');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao marcar alerta como lido';
      
      setError(errorMessage);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadAlerts = alerts.filter(alert => !alert.is_read);
      
      // Mark all unread alerts as read
      await Promise.all(unreadAlerts.map(alert => markAsRead(alert.id)));
      
      return true;
    } catch (err) {
      console.error('Erro ao marcar todos os alertas como lidos:', err);
      throw err;
    }
  };

  const getAlertsByType = (type: string) => {
    return alerts.filter(alert => alert.alert_type === type);
  };

  const getOverdueAlerts = () => {
    return getAlertsByType('overdue');
  };

  const getPickupReminders = () => {
    return getAlertsByType('pickup_reminder');
  };

  const getReturnReminders = () => {
    return getAlertsByType('return_reminder');
  };

  const getTodayAlerts = () => {
    const today = new Date().toISOString().split('T')[0];
    return alerts.filter(alert => alert.scheduled_date.startsWith(today));
  };

  const getUrgentAlerts = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return alerts.filter(alert => {
      const alertDate = new Date(alert.scheduled_date);
      return alertDate <= tomorrow && !alert.is_read;
    });
  };

  useEffect(() => {
    if (autoFetch) {
      fetchAlerts();
    }
  }, [
    apiOptions.alert_type,
    apiOptions.is_read,
    apiOptions.limit
  ]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return {
    alerts,
    loading,
    error,
    unreadCount,
    refetch: fetchAlerts,
    markAsRead,
    markAllAsRead,
    getAlertsByType,
    getOverdueAlerts,
    getPickupReminders,
    getReturnReminders,
    getTodayAlerts,
    getUrgentAlerts,
    clearError: () => setError(null)
  };
}

// Hook para estatísticas de alertas
export function useAlertStats() {
  const { alerts, loading, error } = useAlerts({ autoRefresh: true });

  const stats = {
    total: alerts.length,
    unread: alerts.filter(a => !a.is_read).length,
    overdue: alerts.filter(a => a.alert_type === 'overdue').length,
    pickupReminders: alerts.filter(a => a.alert_type === 'pickup_reminder').length,
    returnReminders: alerts.filter(a => a.alert_type === 'return_reminder').length,
    urgent: alerts.filter(a => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const alertDate = new Date(a.scheduled_date);
      return alertDate <= tomorrow && !a.is_read;
    }).length
  };

  return {
    stats,
    loading,
    error
  };
} 