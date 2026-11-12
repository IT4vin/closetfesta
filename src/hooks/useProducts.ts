import { useState, useEffect, useMemo } from 'react';
import { productsApi, type Product, type ApiResponse, ApiError } from '@/lib/api';
import {
  applyProductFilters, EMPTY_PRODUCT_FILTERS, getProductFilterOptions, hasProductFilters,
  type ProductFilters,
} from '@/lib/productFilters';
export type { ProductFilters } from '@/lib/productFilters';

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
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Estados para funcionalidades da página
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ProductFilters>(EMPTY_PRODUCT_FILTERS);
  const filterOptions = useMemo(() => getProductFilterOptions(productsList), [productsList]);
  const filteredProducts = useMemo(
    () => applyProductFilters(productsList, filters, searchTerm),
    [productsList, filters, searchTerm],
  );

  const { autoFetch = true, ...apiOptions } = options;


  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: ApiResponse<Product[]> = await productsApi.findAll(apiOptions);
      
      if (response.success) {
        setProductsList(response.data);
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

  // Handlers para formulários e ações
  const handleAddProduct = () => {
    setEditingProduct(null);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
  };

  const handleFormSubmit = async (productData: any) => {
    const files: File[] = productData.imageFiles ?? [];
    const removeImageIds: string[] = Array.isArray(productData.removeImageIds)
      ? Array.from(new Set(productData.removeImageIds.filter((id: unknown): id is string =>
          typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id))))
      : [];
    const rentalPrice = Number(productData.rentalPrice ?? productData.rental_price ?? 0);
    const payload = {
      name: String(productData.name ?? "").trim(),
      description: String(productData.description ?? "").trim(),
      sku: String(productData.fullCode || productData.sku || "").trim(),
      quantity: Number(productData.quantity ?? 1),
      category_id: String(productData.category_id ?? editingProduct?.category_id ?? ""),
      price: rentalPrice,
      rental_price: rentalPrice,
      cost: Number(productData.cost ?? 0),
      sizes: productData.size ? [productData.size] : (productData.sizes ?? []),
      type: productData.productType || productData.type || "",
      color: productData.color || "",
    };
    try {
      const saved = editingProduct
        ? await updateProduct(editingProduct.id, payload)
        : await createProduct(payload);
      if (removeImageIds.length) {
        if (!editingProduct) {
          throw new Error('Não é possível remover imagens de um produto ainda não cadastrado.');
        }
        try {
          for (const imageId of removeImageIds) {
            const result = await productsApi.removeImage(saved.id, imageId);
            if (!result.success) throw new Error(result.message || 'Exclusão não confirmada.');
          }
          await fetchProducts();
        } catch (error) {
          await fetchProducts();
          setEditingProduct(saved);
          throw new Error(`Dados do produto salvos, mas houve erro ao excluir uma foto. Reabra o produto para conferir as imagens e tente novamente. ${error instanceof Error ? error.message : ''}`);
        }
      }
      if (files.length) {
        try {
          await uploadImages(saved.id, files);
        } catch (error) {
          setEditingProduct(saved);
          throw new Error(`Produto salvo (código ${saved.sku || saved.id}), mas as fotos não foram totalmente enviadas. Reabra o produto para reenviar. ${error instanceof Error ? error.message : ''}`);
        }
      }
      setEditingProduct(null);
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      throw error;
    }
  };

  const handleImportConfirm = async (importedProducts: any[]) => {
    try {
      for (const productData of importedProducts) {
        await createProduct(productData);
      }
      await fetchProducts();
    } catch (err) {
      console.error('Erro ao importar produtos:', err);
      throw err;
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'priceMin' || name === 'priceMax') {
      setFilters(prev => ({
        ...prev,
        priceRange: {
          ...prev.priceRange,
          [name === 'priceMin' ? 'min' : 'max']: value
        }
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const hasActiveFilters = () => hasProductFilters(filters, searchTerm);
  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({ ...EMPTY_PRODUCT_FILTERS, priceRange: { ...EMPTY_PRODUCT_FILTERS.priceRange } });
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
    // Estados básicos
    productsList,
    loading,
    error,
    total,
    
    // Estados para a página
    searchTerm,
    setSearchTerm,
    filters,
    filterOptions,
    filteredProducts,
    clearAllFilters,
    editingProduct,
    setEditingProduct,
    
    // Handlers
    handleAddProduct,
    handleEditProduct,
    handleFormSubmit,
    handleImportConfirm,
    handleFilterChange,
    hasActiveFilters,
    
    // Funções da API
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

// Re-exportar o tipo Product para compatibilidade
export type { Product };
