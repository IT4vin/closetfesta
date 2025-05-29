import { useState, useEffect } from 'react';

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

interface Category {
  id: string;
  name: string;
  description: string;
  product_count: number;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('🔄 Buscando categorias...');
        const response = await apiRequest('/categories');
        
        if (response.success) {
          setCategories(response.data);
          console.log('✅ Categorias encontradas:', response.data.length);
        } else {
          throw new Error(response.message || 'Erro ao buscar categorias');
        }
      } catch (err) {
        const errorMessage = err instanceof ApiError 
          ? err.message 
          : 'Erro desconhecido ao carregar categorias';
        
        setError(errorMessage);
        console.error('❌ Erro ao buscar categorias:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
} 