import { useState, useEffect } from 'react';
import { productsApi, type Product, type ApiResponse, ApiError } from '@/lib/api';

interface UseProductsOptions {
  category_id?: string;
  featured?: boolean;
  in_stock?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  autoFetch?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const { autoFetch = true, ...apiOptions } = options;

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: ApiResponse<Product[]> = await productsApi.findAll(apiOptions);
      
      if (response.success) {
        setProducts(response.data);
        setTotal(response.total || response.data.length);
      } else {
        throw new Error(response.message || 'Erro ao buscar produtos');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao carregar produtos';
      
      setError(errorMessage);
      console.error('Erro ao buscar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData: {
    name: string;
    description?: string;
    price: number;
    quantity: number;
    category_id: string;
    sizes?: string;
    featured?: boolean;
  }) => {
    try {
      const response: ApiResponse<Product> = await productsApi.create(productData);
      
      if (response.success) {
        await fetchProducts(); // Recarregar lista
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao criar produto');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao criar produto';
      
      setError(errorMessage);
      throw err;
    }
  };

  const updateProduct = async (id: string, productData: Partial<{
    name: string;
    description: string;
    price: number;
    quantity: number;
    category_id: string;
    sizes: string;
    featured: boolean;
  }>) => {
    try {
      const response: ApiResponse<Product> = await productsApi.update(id, productData);
      
      if (response.success) {
        await fetchProducts(); // Recarregar lista
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao atualizar produto');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao atualizar produto';
      
      setError(errorMessage);
      throw err;
    }
  };

  const deleteProduct = async (id: string, hardDelete = false) => {
    try {
      const response = await productsApi.delete(id, hardDelete);
      
      if (response.success) {
        await fetchProducts(); // Recarregar lista
        return true;
      } else {
        throw new Error(response.message || 'Erro ao deletar produto');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao deletar produto';
      
      setError(errorMessage);
      throw err;
    }
  };

  const uploadImages = async (productId: string, files: File[]) => {
    try {
      const response = await productsApi.uploadImages(productId, files);
      
      if (response.success) {
        await fetchProducts(); // Recarregar lista para atualizar imagens
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao fazer upload das imagens');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao fazer upload das imagens';
      
      setError(errorMessage);
      throw err;
    }
  };

  const removeImage = async (productId: string, imageId: string) => {
    try {
      const response = await productsApi.removeImage(productId, imageId);
      
      if (response.success) {
        await fetchProducts(); // Recarregar lista para atualizar imagens
        return true;
      } else {
        throw new Error(response.message || 'Erro ao remover imagem');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao remover imagem';
      
      setError(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [
    apiOptions.category_id,
    apiOptions.featured, 
    apiOptions.in_stock,
    apiOptions.search,
    apiOptions.limit,
    apiOptions.offset
  ]);

  return {
    products,
    loading,
    error,
    total,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadImages,
    removeImage,
    clearError: () => setError(null)
  };
}

// Hook para buscar um produto específico
export function useProduct(id: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = async () => {
    if (!id) {
      setProduct(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response: ApiResponse<Product> = await productsApi.findById(id);
      
      if (response.success) {
        setProduct(response.data);
      } else {
        throw new Error(response.message || 'Erro ao buscar produto');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Erro ao carregar produto';
      
      setError(errorMessage);
      setProduct(null);
      console.error('Erro ao buscar produto:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  return {
    product,
    loading,
    error,
    refetch: fetchProduct,
    clearError: () => setError(null)
  };
}
