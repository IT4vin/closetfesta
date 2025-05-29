import { useState, useEffect } from 'react';
import { categoriesApi, type Category, type ApiResponse, ApiError } from '@/lib/api';

interface UseCategoriesOptions {
  search?: string;
  autoFetch?: boolean;
}

export function useCategories(options: UseCategoriesOptions = {}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { autoFetch = true, search } = options;

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: ApiResponse<Category[]> = await categoriesApi.findAll(search);
      
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

  const createCategory = async (categoryData: {
    name: string;
    description?: string;
  }) => {
    try {
      const response: ApiResponse<Category> = await categoriesApi.create(categoryData);
      
      if (response.success) {
        await fetchCategories(); // Recarregar lista
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao criar categoria');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao criar categoria';
      
      setError(errorMessage);
      throw err;
    }
  };

  const updateCategory = async (id: string, categoryData: {
    name?: string;
    description?: string;
  }) => {
    try {
      const response: ApiResponse<Category> = await categoriesApi.update(id, categoryData);
      
      if (response.success) {
        await fetchCategories(); // Recarregar lista
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao atualizar categoria');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao atualizar categoria';
      
      setError(errorMessage);
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const response = await categoriesApi.delete(id);
      
      if (response.success) {
        await fetchCategories(); // Recarregar lista
        return true;
      } else {
        throw new Error(response.message || 'Erro ao deletar categoria');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao deletar categoria';
      
      setError(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchCategories();
    }
  }, [search]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError: () => setError(null)
  };
}

// Hook para buscar uma categoria específica
export function useCategory(id: string | undefined) {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategory = async () => {
    if (!id) {
      setCategory(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response: ApiResponse<Category> = await categoriesApi.findById(id);
      
      if (response.success) {
        setCategory(response.data);
      } else {
        throw new Error(response.message || 'Erro ao buscar categoria');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao carregar categoria';
      
      setError(errorMessage);
      setCategory(null);
      console.error('Erro ao buscar categoria:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategory();
  }, [id]);

  return {
    category,
    loading,
    error,
    refetch: fetchCategory,
    clearError: () => setError(null)
  };
} 