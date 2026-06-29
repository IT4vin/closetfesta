// Configuração da API do backend Node.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

// Função auxiliar para fazer requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log('🌐 Fazendo requisição para:', url);
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Erro na API:', {
        status: response.status,
        url,
        errorData
      });
      
      throw new ApiError(
        response.status, 
        errorData.message || `HTTP ${response.status}`,
        errorData
      );
    }

    const data = await response.json();
    console.log('✅ Resposta da API:', data);
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    console.error('❌ Falha na requisição:', {
      url,
      error: error.message,
      type: error.name
    });
    
    throw new ApiError(0, `Erro de conexão: ${error.message}`);
  }
};

// === PRODUTOS ===
export const productsApi = {
  // Listar produtos
  async findAll(params: {
    category_id?: string;
    featured?: boolean;
    in_stock?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const endpoint = `/products${searchParams.toString() ? `?${searchParams}` : ''}`;
    return apiRequest(endpoint);
  },

  // Buscar produto por ID
  async findById(id: string) {
    return apiRequest(`/products/${id}`);
  },

  // Criar produto
  async create(productData: {
    name: string;
    description?: string;
    price: number;
    quantity: number;
    category_id: string;
    sizes?: string;
    featured?: boolean;
  }) {
    return apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  // Atualizar produto
  async update(id: string, productData: Partial<{
    name: string;
    description: string;
    price: number;
    quantity: number;
    category_id: string;
    sizes: string;
    featured: boolean;
  }>) {
    return apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  // Deletar produto
  async delete(id: string, hardDelete = false) {
    const endpoint = `/products/${id}${hardDelete ? '?hard_delete=true' : ''}`;
    return apiRequest(endpoint, {
      method: 'DELETE',
    });
  },

  // Upload de imagens
  async uploadImages(productId: string, files: File[]) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    return apiRequest(`/products/${productId}/images`, {
      method: 'POST',
      headers: {}, // Remove Content-Type para permitir FormData
      body: formData,
    });
  },

  // Remover imagem
  async removeImage(productId: string, imageId: string) {
    return apiRequest(`/products/${productId}/images/${imageId}`, {
      method: 'DELETE',
    });
  }
};

// === CATEGORIAS ===
export const categoriesApi = {
  // Listar categorias
  async findAll(search?: string) {
    const endpoint = search ? `/categories?search=${encodeURIComponent(search)}` : '/categories';
    return apiRequest(endpoint);
  },

  // Buscar categoria por ID
  async findById(id: string) {
    return apiRequest(`/categories/${id}`);
  },

  // Buscar produtos de uma categoria
  async getProducts(id: string, params: {
    featured?: boolean;
    in_stock?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const endpoint = `/categories/${id}/products${searchParams.toString() ? `?${searchParams}` : ''}`;
    return apiRequest(endpoint);
  },

  // Criar categoria
  async create(categoryData: {
    name: string;
    description?: string;
  }) {
    return apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  // Atualizar categoria
  async update(id: string, categoryData: {
    name?: string;
    description?: string;
  }) {
    return apiRequest(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },

  // Deletar categoria
  async delete(id: string) {
    return apiRequest(`/categories/${id}`, {
      method: 'DELETE',
    });
  }
};

// === CATÁLOGO PÚBLICO ===
export const catalogApi = {
  // Produtos para o catálogo público (apenas em estoque)
  async getProducts(params: {
    category_id?: string;
    search?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const endpoint = `/catalog/products${searchParams.toString() ? `?${searchParams}` : ''}`;
    return apiRequest(endpoint);
  }
};

// === SISTEMA ===
export const systemApi = {
  // Health check
  async health() {
    return apiRequest('/health');
  },

  // Informações do sistema
  async info() {
    return apiRequest('/info');
  }
};

// === TIPOS ===
export interface Product {
  id: string;
  sku?: string;
  name: string;
  description: string;
  price: number;
  rental_price?: number;
  quantity: number;
  category_id: string;
  sizes: string[];
  featured: boolean;
  deleted: boolean;
  status: 'available' | 'rented' | 'maintenance' | 'reserved';
  created_at: string;
  updated_at: string;
  category?: { name: string; description: string };
  images: ProductImage[];
  // Aliases legados mantidos para compatibilidade com componentes antigos
  rentalPrice?: number;
  size?: string;
  color?: string;
  type?: string;
  subtype?: string;
  image?: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product: Product;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  item_type: 'sale' | 'rental';
  // Campos específicos para aluguel
  try_on_date?: string;
  pickup_date?: string;
  event_date?: string;
  return_date?: string;
  actual_return_date?: string;
  late_fee?: number;
  status?: 'pending' | 'picked_up' | 'returned' | 'overdue';
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  customer_document?: string;
  customer_phone?: string;
  order_type: 'sale' | 'rental' | 'hybrid';
  status: 'draft' | 'confirmed' | 'completed' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  total_discount: number;
  total: number;
  total_sales: number;
  total_rentals: number;
  observations?: string;
  created_at: string;
  updated_at: string;
  created_by: string; // Atendente
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'pix' | 'transfer';
  payment_details?: any;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface RentalAlert {
  id: string;
  order_id: string;
  product_id: string;
  alert_type: 'pickup_reminder' | 'return_reminder' | 'overdue';
  scheduled_date: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ProductImage {
  id: string;
  file_name: string;
  file_path: string;
  display_order: number;
  url: string;
  thumbnail_url: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  message?: string;
}

export { ApiError };

// === PEDIDOS ===
export const ordersApi = {
  // Criar pedido
  async create(orderData: {
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
  }) {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Listar pedidos
  async findAll(params: {
    status?: string;
    order_type?: string;
    customer_name?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const endpoint = `/orders${searchParams.toString() ? `?${searchParams}` : ''}`;
    return apiRequest(endpoint);
  },

  // Buscar pedido por ID
  async findById(id: string) {
    return apiRequest(`/orders/${id}`);
  },

  // Atualizar status do pedido
  async updateStatus(id: string, status: string) {
    return apiRequest(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Marcar item como devolvido
  async returnItem(orderId: string, itemId: string, returnData: {
    actual_return_date: string;
    late_fee?: number;
    observations?: string;
  }) {
    return apiRequest(`/orders/${orderId}/items/${itemId}/return`, {
      method: 'PUT',
      body: JSON.stringify(returnData),
    });
  },

  // Gerar contrato PDF
  async generateContract(id: string) {
    return apiRequest(`/orders/${id}/contract`, {
      method: 'GET',
    });
  },

  // Gerar comprovante PDF
  async generateReceipt(id: string) {
    return apiRequest(`/orders/${id}/receipt`, {
      method: 'GET',
    });
  }
};

// === PAGAMENTOS ===
export const paymentsApi = {
  // Processar pagamento
  async process(paymentData: {
    order_id: string;
    amount: number;
    payment_method: 'cash' | 'card' | 'pix' | 'transfer';
    payment_details?: any;
  }) {
    return apiRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  // Listar pagamentos de um pedido
  async findByOrder(orderId: string) {
    return apiRequest(`/orders/${orderId}/payments`);
  }
};

// === ALERTAS ===
export const alertsApi = {
  // Listar alertas
  async findAll(params: {
    alert_type?: string;
    is_read?: boolean;
    limit?: number;
  } = {}) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const endpoint = `/alerts${searchParams.toString() ? `?${searchParams}` : ''}`;
    return apiRequest(endpoint);
  },

  // Marcar alerta como lido
  async markAsRead(id: string) {
    return apiRequest(`/alerts/${id}/read`, {
      method: 'PUT',
    });
  }
};

// === RELATÓRIOS ===
export const reportsApi = {
  // Dashboard de vendas
  async salesDashboard(params: {
    date_from?: string;
    date_to?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const endpoint = `/reports/sales${searchParams.toString() ? `?${searchParams}` : ''}`;
    return apiRequest(endpoint);
  },

  // Relatório de aluguéis
  async rentalsReport(params: {
    date_from?: string;
    date_to?: string;
    status?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const endpoint = `/reports/rentals${searchParams.toString() ? `?${searchParams}` : ''}`;
    return apiRequest(endpoint);
  },

  // Produtos mais vendidos/alugados
  async topProducts(params: {
    type?: 'sale' | 'rental' | 'both';
    date_from?: string;
    date_to?: string;
    limit?: number;
  } = {}) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const endpoint = `/reports/top-products${searchParams.toString() ? `?${searchParams}` : ''}`;
    return apiRequest(endpoint);
  }
};

export interface LateFeeConfig {
  id: string;
  name: string;
  description: string;
  fee_type: 'fixed' | 'percentage' | 'daily_fixed' | 'daily_percentage';
  fee_value: number; // Valor fixo ou percentual
  grace_period_hours: number; // Período de carência em horas
  max_fee_amount?: number; // Valor máximo da multa
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LateFeeCalculation {
  order_item_id: string;
  days_overdue: number;
  hours_overdue: number;
  base_amount: number;
  fee_config: LateFeeConfig;
  calculated_fee: number;
  applied_fee: number; // Pode ser diferente se houver desconto manual
  waived: boolean;
  waived_reason?: string;
  calculated_at: string;
}

// === CONFIGURAÇÃO DE MULTAS ===
export const lateFeeApi = {
  // Listar configurações de multa
  async findAllConfigs() {
    return apiRequest('/late-fees/configs');
  },

  // Criar configuração de multa
  async createConfig(configData: {
    name: string;
    description: string;
    fee_type: 'fixed' | 'percentage' | 'daily_fixed' | 'daily_percentage';
    fee_value: number;
    grace_period_hours: number;
    max_fee_amount?: number;
  }) {
    return apiRequest('/late-fees/configs', {
      method: 'POST',
      body: JSON.stringify(configData),
    });
  },

  // Atualizar configuração de multa
  async updateConfig(id: string, configData: Partial<{
    name: string;
    description: string;
    fee_type: 'fixed' | 'percentage' | 'daily_fixed' | 'daily_percentage';
    fee_value: number;
    grace_period_hours: number;
    max_fee_amount: number;
    is_active: boolean;
  }>) {
    return apiRequest(`/late-fees/configs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(configData),
    });
  },

  // Calcular multa para um item
  async calculateFee(orderItemId: string, returnDate?: string) {
    const body = returnDate ? { return_date: returnDate } : {};
    return apiRequest(`/late-fees/calculate/${orderItemId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Aplicar multa a um item
  async applyFee(orderItemId: string, feeData: {
    calculated_fee: number;
    applied_fee: number;
    waived?: boolean;
    waived_reason?: string;
  }) {
    return apiRequest(`/late-fees/apply/${orderItemId}`, {
      method: 'POST',
      body: JSON.stringify(feeData),
    });
  },

  // Perdoar multa
  async waiveFee(orderItemId: string, reason: string) {
    return apiRequest(`/late-fees/waive/${orderItemId}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Histórico de multas
  async getFeeHistory(params: {
    order_id?: string;
    customer_name?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const endpoint = `/late-fees/history${searchParams.toString() ? `?${searchParams}` : ''}`;
    return apiRequest(endpoint);
  }
};

export interface Reservation {
  id: string;
  customer_name: string;
  customer_document?: string;
  customer_phone?: string;
  customer_email?: string;
  product_id: string;
  product: Product;
  reservation_date: string; // Data da reserva
  event_date: string; // Data do evento
  pickup_date: string; // Data de retirada
  return_date: string; // Data de devolução
  status: 'pending' | 'confirmed' | 'picked_up' | 'completed' | 'cancelled';
  notes?: string;
  deposit_amount?: number;
  deposit_paid: boolean;
  deposit_method?: string;
  total_amount: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  available_slots: number;
  reserved_slots: number;
  is_available: boolean;
}

export interface AvailabilityCheck {
  product_id: string;
  date_from: string;
  date_to: string;
  is_available: boolean;
  conflicting_reservations: Array<{
    id: string;
    customer_name: string;
    pickup_date: string;
    return_date: string;
  }>;
}

// === SISTEMA DE RESERVAS ===
export const reservationsApi = {
  // Criar reserva
  async create(reservationData: {
    customer_name: string;
    customer_document?: string;
    customer_phone?: string;
    customer_email?: string;
    product_id: string;
    event_date: string;
    pickup_date: string;
    return_date: string;
    notes?: string;
    deposit_amount?: number;
    total_amount: number;
  }) {
    return apiRequest('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData),
    });
  },

  // Listar reservas
  async findAll(params: {
    status?: string;
    product_id?: string;
    customer_name?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const endpoint = `/reservations${searchParams.toString() ? `?${searchParams}` : ''}`;
    return apiRequest(endpoint);
  },

  // Buscar reserva por ID
  async findById(id: string) {
    return apiRequest(`/reservations/${id}`);
  },

  // Atualizar status da reserva
  async updateStatus(id: string, status: string, notes?: string) {
    return apiRequest(`/reservations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  },

  // Confirmar reserva
  async confirm(id: string, confirmationData?: {
    deposit_paid?: boolean;
    deposit_method?: string;
    notes?: string;
  }) {
    return apiRequest(`/reservations/${id}/confirm`, {
      method: 'PUT',
      body: JSON.stringify(confirmationData || {}),
    });
  },

  // Cancelar reserva
  async cancel(id: string, reason: string) {
    return apiRequest(`/reservations/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  // Converter reserva em pedido
  async convertToOrder(id: string) {
    return apiRequest(`/reservations/${id}/convert-to-order`, {
      method: 'POST',
    });
  },

  // Verificar disponibilidade
  async checkAvailability(productId: string, dateFrom: string, dateTo: string) {
    return apiRequest(`/reservations/availability/${productId}`, {
      method: 'POST',
      body: JSON.stringify({
        date_from: dateFrom,
        date_to: dateTo
      }),
    });
  },

  // Obter slots de tempo disponíveis
  async getAvailableSlots(date: string, duration_hours: number = 4) {
    const searchParams = new URLSearchParams({
      date,
      duration_hours: String(duration_hours)
    });

    return apiRequest(`/reservations/slots?${searchParams}`);
  },

  // Reservas por período (agenda)
  async getCalendar(params: {
    date_from: string;
    date_to: string;
    view?: 'month' | 'week' | 'day';
  }) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    return apiRequest(`/reservations/calendar?${searchParams}`);
  }
}; 