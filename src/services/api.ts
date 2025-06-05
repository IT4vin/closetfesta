// Configurações da API
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Tipos de resposta da API
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export interface IApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

// Tipos para entidades
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  last_login?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category_id?: string;
  category?: Category;
  images?: ProductImage[];
  created_at: string;
  updated_at: string;
  deleted: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  file_name: string;
  storage_path: string;
  url?: string;
  thumbnail_url?: string;
  created_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  price: number;
  subtotal: number;
}

// Filtros para consultas
export interface ProductFilters {
  category_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
  available?: boolean;
  min_price?: number;
  max_price?: number;
}

export interface OrderFilters {
  status?: string;
  customer?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

// Classe principal da API
export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private token: string | null = null;

  constructor(config = API_CONFIG) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    
    // Recuperar token do localStorage
    this.token = localStorage.getItem('auth_token');
  }

  // Configurar token de autenticação
  setAuthToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  // Obter headers com autenticação
  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Fazer requisição HTTP
  public async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    customHeaders?: Record<string, string>
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders(customHeaders);

    const config: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.timeout)
    };

    if (data) {
      if (data instanceof FormData) {
        // Para upload de arquivos, remover Content-Type para permitir boundary automático
        delete headers['Content-Type'];
        config.body = data;
      } else {
        config.body = JSON.stringify(data);
      }
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code,
          errorData
        );
      }

      const result: ApiResponse<T> = await response.json();
      
      if (!result.success) {
        throw new ApiError(
          result.message || result.error || 'Erro na API',
          response.status,
          'API_ERROR',
          result
        );
      }

      return result.data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error.name === 'AbortError') {
        throw new ApiError('Timeout na requisição', 408, 'TIMEOUT');
      }
      
      throw new ApiError(
        error.message || 'Erro de rede',
        0,
        'NETWORK_ERROR',
        error
      );
    }
  }

  // Métodos HTTP
  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, headers);
  }

  async post<T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('POST', endpoint, data, headers);
  }

  async put<T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('PUT', endpoint, data, headers);
  }

  async patch<T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, headers);
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, headers);
  }

  // ===========================================
  // AUTENTICAÇÃO
  // ===========================================

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const result = await this.post<{ user: User; token: string }>('/auth/login', {
      email,
      password
    });
    
    // Configurar token automaticamente
    this.setAuthToken(result.token);
    
    return result;
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    role?: 'admin' | 'user';
  }): Promise<{ user: User; token: string }> {
    const result = await this.post<{ user: User; token: string }>('/auth/register', userData);
    
    // Configurar token automaticamente
    this.setAuthToken(result.token);
    
    return result;
  }

  async getMe(): Promise<User> {
    return this.get<User>('/auth/me');
  }

  async refreshToken(): Promise<{ token: string }> {
    const result = await this.post<{ token: string }>('/auth/refresh');
    this.setAuthToken(result.token);
    return result;
  }

  async logout(): Promise<void> {
    this.setAuthToken(null);
  }

  // ===========================================
  // PRODUTOS
  // ===========================================

  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const query = params.toString();
    return this.get<Product[]>(`/products${query ? `?${query}` : ''}`);
  }

  async getProduct(id: string): Promise<Product> {
    return this.get<Product>(`/products/${id}`);
  }

  async createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'deleted'>): Promise<Product> {
    return this.post<Product>('/products', productData);
  }

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    return this.put<Product>(`/products/${id}`, productData);
  }

  async deleteProduct(id: string): Promise<void> {
    return this.delete<void>(`/products/${id}`);
  }

  async uploadProductImages(productId: string, files: FileList): Promise<ProductImage[]> {
    const formData = new FormData();
    
    Array.from(files).forEach(file => {
      formData.append('images', file);
    });

    return this.post<ProductImage[]>(`/products/${productId}/images`, formData);
  }

  // ===========================================
  // CATEGORIAS
  // ===========================================

  async getCategories(): Promise<Category[]> {
    return this.get<Category[]>('/categories');
  }

  async getCategory(id: string): Promise<Category> {
    return this.get<Category>(`/categories/${id}`);
  }

  async createCategory(categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    return this.post<Category>('/categories', categoryData);
  }

  async updateCategory(id: string, categoryData: Partial<Category>): Promise<Category> {
    return this.put<Category>(`/categories/${id}`, categoryData);
  }

  async deleteCategory(id: string): Promise<void> {
    return this.delete<void>(`/categories/${id}`);
  }

  // ===========================================
  // PEDIDOS
  // ===========================================

  async getOrders(filters?: OrderFilters): Promise<Order[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const query = params.toString();
    return this.get<Order[]>(`/orders${query ? `?${query}` : ''}`);
  }

  async getOrder(id: string): Promise<Order> {
    return this.get<Order>(`/orders/${id}`);
  }

  async createOrder(orderData: {
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    items: Array<{
      product_id: string;
      quantity: number;
      price: number;
    }>;
  }): Promise<Order> {
    return this.post<Order>('/orders', orderData);
  }

  async updateOrder(id: string, orderData: Partial<Order>): Promise<Order> {
    return this.put<Order>(`/orders/${id}`, orderData);
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
    return this.patch<Order>(`/orders/${id}/status`, { status });
  }

  async getOrderStats(): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    delivered: number;
    revenue: number;
  }> {
    return this.get<any>('/orders/stats');
  }

  // ===========================================
  // CATÁLOGO PÚBLICO
  // ===========================================

  async getCatalogProducts(filters?: ProductFilters): Promise<Product[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const query = params.toString();
    return this.get<Product[]>(`/catalog/products${query ? `?${query}` : ''}`);
  }

  // ===========================================
  // HEALTH CHECK
  // ===========================================

  async health(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
    database: string;
  }> {
    return this.get<any>('/health');
  }
}

// Instância global da API
export const api = new ApiClient();

// Classe de erro personalizada
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Utilitário para verificar se o token é válido
export const checkTokenExpiry = (error: ApiError) => {
  if (error.status === 401) {
    api.logout();
    
    // Redirecionar para login se estiver no browser
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
};

export default api; 