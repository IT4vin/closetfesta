import { useState, useEffect } from 'react';
import { reportsApi, type ApiResponse, ApiError } from '@/lib/api';

interface SalesDashboardData {
  totalSales: number;
  totalRentals: number;
  totalRevenue: number;
  salesCount: number;
  rentalsCount: number;
  hybridCount: number;
  dailySales: Array<{
    date: string;
    sales: number;
    rentals: number;
    total: number;
  }>;
  topProducts: Array<{
    product_id: string;
    product_name: string;
    quantity_sold: number;
    quantity_rented: number;
    total_revenue: number;
  }>;
}

interface RentalsReportData {
  totalActive: number;
  totalOverdue: number;
  totalReturned: number;
  averageRentalDays: number;
  overdueItems: Array<{
    order_id: string;
    customer_name: string;
    product_name: string;
    expected_return: string;
    days_overdue: number;
    late_fee: number;
  }>;
  upcomingReturns: Array<{
    order_id: string;
    customer_name: string;
    product_name: string;
    return_date: string;
    days_until_return: number;
  }>;
}

interface TopProductsData {
  sales: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    revenue: number;
  }>;
  rentals: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    revenue: number;
  }>;
  combined: Array<{
    product_id: string;
    product_name: string;
    sales_quantity: number;
    rentals_quantity: number;
    total_revenue: number;
  }>;
}

interface UseReportsOptions {
  date_from?: string;
  date_to?: string;
  autoFetch?: boolean;
}

export function useSalesDashboard(options: UseReportsOptions = {}) {
  const [data, setData] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { autoFetch = true, ...apiOptions } = options;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: ApiResponse<SalesDashboardData> = await reportsApi.salesDashboard(apiOptions);
      
      if (response.success) {
        setData(response.data);
      } else {
        throw new Error(response.message || 'Erro ao buscar dados do dashboard');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao carregar dashboard de vendas';
      
      setError(errorMessage);
      console.error('Erro ao buscar dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [apiOptions.date_from, apiOptions.date_to]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    clearError: () => setError(null)
  };
}

export function useRentalsReport(options: UseReportsOptions = {}) {
  const [data, setData] = useState<RentalsReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { autoFetch = true, ...apiOptions } = options;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: ApiResponse<RentalsReportData> = await reportsApi.rentalsReport(apiOptions);
      
      if (response.success) {
        setData(response.data);
      } else {
        throw new Error(response.message || 'Erro ao buscar relatório de aluguéis');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao carregar relatório de aluguéis';
      
      setError(errorMessage);
      console.error('Erro ao buscar relatório de aluguéis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [apiOptions.date_from, apiOptions.date_to]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    clearError: () => setError(null)
  };
}

export function useTopProducts(options: UseReportsOptions & { 
  type?: 'sale' | 'rental' | 'both';
  limit?: number;
} = {}) {
  const [data, setData] = useState<TopProductsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { autoFetch = true, type = 'both', limit = 10, ...apiOptions } = options;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = (await reportsApi.topProducts({
        ...apiOptions,
        type,
        limit
      })) as unknown as ApiResponse<TopProductsData>;

      
      if (response.success) {
        setData(response.data);
      } else {
        throw new Error(response.message || 'Erro ao buscar produtos mais vendidos');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao carregar produtos mais vendidos';
      
      setError(errorMessage);
      console.error('Erro ao buscar top produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [apiOptions.date_from, apiOptions.date_to, type, limit]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    clearError: () => setError(null)
  };
}

// Hook combinado para todos os relatórios
export function useReports(options: UseReportsOptions = {}) {
  const salesDashboard = useSalesDashboard(options);
  const rentalsReport = useRentalsReport(options);
  const topProducts = useTopProducts(options);

  const loading = salesDashboard.loading || rentalsReport.loading || topProducts.loading;
  const error = salesDashboard.error || rentalsReport.error || topProducts.error;

  const refetchAll = async () => {
    await Promise.all([
      salesDashboard.refetch(),
      rentalsReport.refetch(),
      topProducts.refetch()
    ]);
  };

  const clearAllErrors = () => {
    salesDashboard.clearError();
    rentalsReport.clearError();
    topProducts.clearError();
  };

  return {
    salesDashboard: salesDashboard.data,
    rentalsReport: rentalsReport.data,
    topProducts: topProducts.data,
    loading,
    error,
    refetchAll,
    clearAllErrors,
    individual: {
      salesDashboard,
      rentalsReport,
      topProducts
    }
  };
}

// Utilidades para formatação de dados
export const reportUtils = {
  formatCurrency: (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  formatPercentage: (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  },

  calculateGrowth: (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  },

  getGrowthColor: (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  },

  getGrowthIcon: (growth: number) => {
    if (growth > 0) return '↗️';
    if (growth < 0) return '↘️';
    return '➡️';
  }
}; 