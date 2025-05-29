import { useState, useEffect } from 'react';
import { Product } from '../types';

// Configuração da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const apiRequest = async (endpoint: string) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status, 
        errorData.message || `HTTP ${response.status}`
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

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Buscar categorias
        console.log('🔄 Buscando categorias...');
        const categoriesResponse = await apiRequest('/categories');
        
        if (categoriesResponse.success) {
          setCategories(categoriesResponse.data);
          console.log('✅ Categorias encontradas:', categoriesResponse.data.length);
        }

        // Buscar produtos (apenas em estoque para o catálogo público)
        console.log('🔄 Buscando produtos...');
        const productsResponse = await apiRequest('/catalog/products');
        
        if (productsResponse.success) {
          // Converter produtos da API para o formato do showcase
          const formattedProducts = productsResponse.data.map((apiProduct: any): Product => {
            // Extrair URLs das imagens
            const imageUrls = apiProduct.images?.map((img: any) => img.url) || [];

            return {
              id: apiProduct.id,
              name: apiProduct.name,
              description: apiProduct.description || '',
              rentalPrice: apiProduct.price,
              salePrice: null, // Não usado no momento
              sizes: apiProduct.sizes || ['único'],
              category: apiProduct.category?.name || 'Outros',
              tags: [],
              featured: Boolean(apiProduct.featured),
              contactLinks: {
                whatsapp: '',
                instagram: '',
                shopee: ''
              },
              images: imageUrls
            };
          });

          setProducts(formattedProducts);
          console.log('✅ Produtos encontrados:', formattedProducts.length);
        }

      } catch (err) {
        const errorMessage = err instanceof ApiError 
          ? err.message 
          : 'Erro desconhecido ao carregar dados';
        
        setError(errorMessage);
        console.error('❌ Erro ao buscar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { products, categories, loading, error };
} 