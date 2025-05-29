import { useState, useEffect } from 'react';
import { productsApi, type Product, type ApiResponse, ApiError } from '@/lib/api';

interface UseProductsProps {
  page?: number;
  pageSize?: number;
  categoryId?: string | null;
  searchTerm?: string;
  priceFilter?: 'all' | 'rental' | 'sale';
  sortBy?: string;
}

// Tipo para compatibilidade com componentes existentes
export interface CatalogProduct extends Product {
  rental_price?: number;
  sale_price?: number;
  category_name?: string;
}

export function useProducts({ 
  page = 1, 
  pageSize = 12, 
  categoryId = null,
  searchTerm = '',
  priceFilter = 'all',
  sortBy = 'name'
}: UseProductsProps = {}) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const offset = (page - 1) * pageSize;
        
        const response: ApiResponse<Product[]> = await productsApi.findAll({
          category_id: categoryId || undefined,
          search: searchTerm || undefined,
          limit: pageSize,
          offset: offset,
          in_stock: true // Apenas produtos em estoque para o catálogo
        });
        
        if (response.success) {
          // Converter produtos para formato compatível
          const catalogProducts: CatalogProduct[] = response.data.map(product => ({
            ...product,
            rental_price: product.price, // Usar price como rental_price por compatibilidade
            sale_price: null,
            category_name: product.category?.name
          }));

          // Filtrar por preço se necessário
          let filteredProducts = catalogProducts;
          if (priceFilter === 'rental') {
            filteredProducts = catalogProducts.filter(p => p.rental_price && p.rental_price > 0);
          } else if (priceFilter === 'sale') {
            filteredProducts = catalogProducts.filter(p => p.sale_price && p.sale_price > 0);
          }

          // Ordenar produtos
          if (sortBy === 'price') {
            filteredProducts.sort((a, b) => (a.rental_price || 0) - (b.rental_price || 0));
          } else if (sortBy === 'name') {
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
          }

          setProducts(filteredProducts);
          setTotalCount(response.total || filteredProducts.length);
          setHasMore(filteredProducts.length === pageSize);
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

    fetchProducts();
  }, [page, pageSize, categoryId, searchTerm, priceFilter, sortBy]);

  return { 
    products, 
    loading, 
    error, 
    hasMore, 
    totalCount 
  };
} 