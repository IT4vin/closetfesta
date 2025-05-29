import { useState, useEffect, useMemo } from 'react';
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

export interface ProductFilters {
  type: string;
  status: string;
  size: string;
  priceRange: {
    min: string;
    max: string;
  };
}

// Mock products for testing
const mockProducts: Product[] = [
  {
    id: 'TEST-001',
    sku: '123456789',
    name: 'Vestido de Festa Azul Marinho',
    description: 'Elegante vestido de festa em tecido premium',
    price: 299.90,
    rental_price: 89.90,
    quantity: 3,
    category_id: 'CAT-001',
    sizes: ['P', 'M', 'G'],
    featured: true,
    deleted: false,
    status: 'available',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: []
  },
  {
    id: 'TEST-002', 
    sku: '987654321',
    name: 'Terno Clássico Preto',
    description: 'Terno executivo de alta qualidade',
    price: 599.90,
    rental_price: 149.90,
    quantity: 2,
    category_id: 'CAT-002',
    sizes: ['42', '44', '46'],
    featured: true,
    deleted: false,
    status: 'available',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: []
  },
  {
    id: 'TEST-003',
    sku: '456789123',
    name: 'Smoking Premium',
    description: 'Smoking para eventos especiais',
    price: 799.90,
    rental_price: 199.90,
    quantity: 1,
    category_id: 'CAT-003',
    sizes: ['40', '42', '44'],
    featured: false,
    deleted: false,
    status: 'available',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: []
  },
  {
    id: 'TEST-004',
    sku: '789123456',
    name: 'Gravata Italiana',
    description: 'Gravata de seda importada',
    price: 89.90,
    rental_price: 19.90,
    quantity: 10,
    category_id: 'CAT-004',
    sizes: ['Único'],
    featured: false,
    deleted: false,
    status: 'available',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: []
  },
  {
    id: 'TEST-005',
    sku: '321654987',
    name: 'Sapato Social Premium',
    description: 'Sapato de couro legítimo',
    price: 249.90,
    rental_price: 49.90,
    quantity: 5,
    category_id: 'CAT-005',
    sizes: ['39', '40', '41', '42', '43'],
    featured: true,
    deleted: false,
    status: 'available',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: []
  }
];

export function useProducts(options: UseProductsOptions = {}) {
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Estados para funcionalidades da página
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ProductFilters>({
    type: '',
    status: '',
    size: '',
    priceRange: { min: '', max: '' }
  });

  const { autoFetch = true, ...apiOptions } = options;

  // Initialize with mock products for testing
  useEffect(() => {
    setProductsList(mockProducts);
    setFilteredProducts(mockProducts);
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: ApiResponse<Product[]> = await productsApi.findAll(apiOptions);
      
      if (response.success) {
        setProductsList(response.data);
        setFilteredProducts(response.data);
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

  // Produtos filtrados baseados nos filtros e busca
  useEffect(() => {
    const filtered = productsList.filter(product => {
      // Filtro de busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          product.id.toLowerCase().includes(searchLower) ||
          (product.sku && product.sku.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Filtro de categoria
      if (filters.type && filters.type !== 'in_stock' && filters.type !== 'out_of_stock') {
        // Assumindo que filters.type pode ser usado como category filter
        // return false;
      }

      // Filtro de tipo (em estoque/esgotado)
      if (filters.type === 'in_stock' && product.quantity <= 0) {
        return false;
      }
      if (filters.type === 'out_of_stock' && product.quantity > 0) {
        return false;
      }

      // Filtro de status
      if (filters.status && product.status !== filters.status) {
        return false;
      }

      // Filtro de tamanho
      if (filters.size && !product.sizes?.includes(filters.size)) {
        return false;
      }

      // Filtro de preço
      if (filters.priceRange.min && product.price < parseFloat(filters.priceRange.min)) {
        return false;
      }
      if (filters.priceRange.max && product.price > parseFloat(filters.priceRange.max)) {
        return false;
      }

      return true;
    });
    
    setFilteredProducts(filtered);
  }, [productsList, searchTerm, filters]);

  // Handlers para formulários e ações
  const handleAddProduct = () => {
    setEditingProduct(null);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
  };

  const handleFormSubmit = async (productData: any) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await createProduct(productData);
      }
      setEditingProduct(null);
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      throw err;
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

  const hasActiveFilters = () => {
    return !!(
      filters.type || 
      filters.status || 
      filters.size || 
      filters.priceRange.min || 
      filters.priceRange.max
    );
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
    filteredProducts,
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
