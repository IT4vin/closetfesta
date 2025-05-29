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
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status, 
        errorData.message || `HTTP ${response.status}`,
        errorData
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    console.error('API Request failed:', error);
    throw new ApiError(0, 'Erro de conexão com o servidor');
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
  name: string;
  description: string;
  price: number;
  quantity: number;
  category_id: string;
  sizes: string[];
  featured: boolean;
  deleted: boolean;
  created_at: string;
  updated_at: string;
  category?: {
    name: string;
    description: string;
  };
  images: ProductImage[];
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