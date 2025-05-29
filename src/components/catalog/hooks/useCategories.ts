import { useState, useEffect } from 'react';
import { categoriesApi, type Category, type ApiResponse, ApiError } from '@/lib/api';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);

      try {
        const response: ApiResponse<Category[]> = await categoriesApi.findAll();
        
        if (response.success) {
          setCategories(response.data);
        } else {
          throw new Error(response.message || 'Erro ao buscar categorias');
        }
      } catch (err) {
        const errorMessage = err instanceof ApiError 
          ? err.message 
          : 'Erro ao carregar categorias';
        
        setError(errorMessage);
        console.error('Erro ao buscar categorias:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
} 