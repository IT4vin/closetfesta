// Serviço de API que substitui completamente o Supabase
// Conecta ao backend Node.js

import { apiClient } from '@/integrations/api/client';
import type { Product, StoreInfo } from '@/types';

// Interface para login
interface LoginCredentials {
  email: string;
  password: string;
}

// Interface para resposta de login
interface LoginResponse {
  success: boolean;
  user?: any;
  error?: string;
}

// Serviços de autenticação
export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await apiClient.login(credentials.email, credentials.password);
      
      if (response.success) {
        return {
          success: true,
          user: response.data?.user
        };
      } else {
        return {
          success: false,
          error: response.error || 'Erro no login'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro no login'
      };
    }
  },

  async logout(): Promise<void> {
    await apiClient.logout();
  },

  async getCurrentUser() {
    return await apiClient.getCurrentUser();
  }
};

// Serviços de produtos
export const productService = {
  async getProducts(filters?: any): Promise<Product[]> {
    try {
      const response = await apiClient.getProducts(filters);
      
      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [response.data];
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      return [];
    }
  },

  async getProduct(id: string): Promise<Product | null> {
    try {
      const response = await apiClient.getProduct(id);
      
      if (response.success && response.data) {
        return response.data as Product;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      return null;
    }
  },

  async createProduct(productData: Partial<Product>): Promise<Product | null> {
    try {
      const response = await apiClient.createProduct(productData);
      
      if (response.success && response.data) {
        return response.data as Product;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      return null;
    }
  },

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product | null> {
    try {
      const response = await apiClient.updateProduct(id, productData);
      
      if (response.success && response.data) {
        return response.data as Product;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      return null;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const response = await apiClient.deleteProduct(id);
      return response.success;
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      return false;
    }
  }
};

// Serviços de configurações da loja
export const storeService = {
  async getStoreSettings(): Promise<StoreInfo | null> {
    try {
      // Por enquanto, vamos retornar configurações padrão
      // Isso pode ser implementado no backend futuramente
      const defaultStore: StoreInfo = {
        name: 'Closet Festa',
        description: 'Aluguel de roupas para festas e eventos especiais',
        logo: '/placeholder.svg',
        theme: 'purple',
        contacts: {
          whatsapp: '+55 (11) 99999-9999',
          instagram: '@closetfesta'
        }
      };

      return defaultStore;
    } catch (error) {
      console.error('Erro ao buscar configurações da loja:', error);
      return null;
    }
  },

  async updateStoreSettings(settings: Partial<StoreInfo>): Promise<boolean> {
    try {
      // Implementar quando houver endpoint no backend
      console.log('Configurações atualizadas:', settings);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      return false;
    }
  }
};

// Serviços de upload de imagens
export const imageService = {
  async uploadImage(file: File, folder: string = 'products'): Promise<string | null> {
    try {
      const response = await apiClient.uploadFile(file, folder);
      
      if (response.success && response.data) {
        return response.data.url || response.data.path;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      return null;
    }
  },

  async deleteImage(imagePath: string): Promise<boolean> {
    try {
      // Implementar delete de imagem no backend se necessário
      console.log('Deletando imagem:', imagePath);
      return true;
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      return false;
    }
  },

  // Gera URL pública para uma imagem
  getImageUrl(imagePath: string): string {
    if (!imagePath) return '/placeholder.svg';
    
    // Se já é uma URL completa, retorna diretamente
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Assume que as imagens estão servidas pelo backend
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    return `${baseUrl}/uploads/${imagePath}`;
  }
};

// Exportar tudo como um serviço unificado
export const apiService = {
  auth: authService,
  products: productService,
  store: storeService,
  images: imageService
};

export default apiService; 