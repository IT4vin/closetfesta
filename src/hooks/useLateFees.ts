import { useState, useEffect } from 'react';
import { lateFeeApi, type LateFeeConfig, type LateFeeCalculation, type ApiResponse, ApiError } from '@/lib/api';

interface UseLateFeeConfigsOptions {
  autoFetch?: boolean;
}

export function useLateFeeConfigs(options: UseLateFeeConfigsOptions = {}) {
  const [configs, setConfigs] = useState<LateFeeConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { autoFetch = true } = options;

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: ApiResponse<LateFeeConfig[]> = await lateFeeApi.findAllConfigs();
      
      if (response.success) {
        setConfigs(response.data);
      } else {
        throw new Error(response.message || 'Erro ao buscar configurações de multa');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao carregar configurações de multa';
      
      setError(errorMessage);
      console.error('Erro ao buscar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  const createConfig = async (configData: {
    name: string;
    description: string;
    fee_type: 'fixed' | 'percentage' | 'daily_fixed' | 'daily_percentage';
    fee_value: number;
    grace_period_hours: number;
    max_fee_amount?: number;
  }) => {
    try {
      const response: ApiResponse<LateFeeConfig> = await lateFeeApi.createConfig(configData);
      
      if (response.success) {
        await fetchConfigs(); // Recarregar lista
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao criar configuração');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao criar configuração';
      
      setError(errorMessage);
      throw err;
    }
  };

  const updateConfig = async (id: string, configData: Partial<{
    name: string;
    description: string;
    fee_type: 'fixed' | 'percentage' | 'daily_fixed' | 'daily_percentage';
    fee_value: number;
    grace_period_hours: number;
    max_fee_amount: number;
    is_active: boolean;
  }>) => {
    try {
      const response: ApiResponse<LateFeeConfig> = await lateFeeApi.updateConfig(id, configData);
      
      if (response.success) {
        await fetchConfigs(); // Recarregar lista
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao atualizar configuração');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao atualizar configuração';
      
      setError(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchConfigs();
    }
  }, []);

  return {
    configs,
    loading,
    error,
    refetch: fetchConfigs,
    createConfig,
    updateConfig,
    clearError: () => setError(null)
  };
}

// Hook para cálculo e aplicação de multas
export function useLateFeeCalculator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateFee = async (orderItemId: string, returnDate?: string): Promise<LateFeeCalculation | null> => {
    try {
      setLoading(true);
      setError(null);

      const response: ApiResponse<LateFeeCalculation> = await lateFeeApi.calculateFee(orderItemId, returnDate);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao calcular multa');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao calcular multa';
      
      setError(errorMessage);
      console.error('Erro ao calcular multa:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const applyFee = async (orderItemId: string, feeData: {
    calculated_fee: number;
    applied_fee: number;
    waived?: boolean;
    waived_reason?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await lateFeeApi.applyFee(orderItemId, feeData);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao aplicar multa');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao aplicar multa';
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const waiveFee = async (orderItemId: string, reason: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await lateFeeApi.waiveFee(orderItemId, reason);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao perdoar multa');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao perdoar multa';
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    calculateFee,
    applyFee,
    waiveFee,
    clearError: () => setError(null)
  };
}

// Hook para histórico de multas
export function useLateFeeHistory(params: {
  order_id?: string;
  customer_name?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
  autoFetch?: boolean;
} = {}) {
  const [history, setHistory] = useState<LateFeeCalculation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const { autoFetch = true, ...apiParams } = params;

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: ApiResponse<LateFeeCalculation[]> = await lateFeeApi.getFeeHistory(apiParams);
      
      if (response.success) {
        setHistory(response.data);
        setTotal(response.total || response.data.length);
      } else {
        throw new Error(response.message || 'Erro ao buscar histórico de multas');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao carregar histórico';
      
      setError(errorMessage);
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchHistory();
    }
  }, [
    apiParams.order_id,
    apiParams.customer_name,
    apiParams.date_from,
    apiParams.date_to,
    apiParams.limit,
    apiParams.offset
  ]);

  return {
    history,
    loading,
    error,
    total,
    refetch: fetchHistory,
    clearError: () => setError(null)
  };
}

// Utilities para cálculos de multa
export const lateFeeUtils = {
  formatFeeType: (type: string) => {
    const types = {
      fixed: 'Valor Fixo',
      percentage: 'Percentual',
      daily_fixed: 'Valor Fixo Diário',
      daily_percentage: 'Percentual Diário'
    };
    return types[type as keyof typeof types] || type;
  },

  calculatePreview: (
    baseAmount: number,
    feeType: string,
    feeValue: number,
    daysOverdue: number,
    maxFeeAmount?: number
  ) => {
    let calculatedFee = 0;

    switch (feeType) {
      case 'fixed':
        calculatedFee = feeValue;
        break;
      case 'percentage':
        calculatedFee = (baseAmount * feeValue) / 100;
        break;
      case 'daily_fixed':
        calculatedFee = feeValue * daysOverdue;
        break;
      case 'daily_percentage':
        calculatedFee = (baseAmount * feeValue * daysOverdue) / 100;
        break;
    }

    // Apply maximum fee limit if set
    if (maxFeeAmount && calculatedFee > maxFeeAmount) {
      calculatedFee = maxFeeAmount;
    }

    return Math.max(0, calculatedFee);
  },

  isInGracePeriod: (expectedReturnDate: string, actualReturnDate: string, gracePeriodHours: number) => {
    const expected = new Date(expectedReturnDate);
    const actual = new Date(actualReturnDate);
    const graceEnd = new Date(expected.getTime() + (gracePeriodHours * 60 * 60 * 1000));
    
    return actual <= graceEnd;
  },

  getDaysOverdue: (expectedReturnDate: string, actualReturnDate: string) => {
    const expected = new Date(expectedReturnDate);
    const actual = new Date(actualReturnDate);
    const diffTime = actual.getTime() - expected.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  },

  getHoursOverdue: (expectedReturnDate: string, actualReturnDate: string) => {
    const expected = new Date(expectedReturnDate);
    const actual = new Date(actualReturnDate);
    const diffTime = actual.getTime() - expected.getTime();
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    return Math.max(0, diffHours);
  }
}; 