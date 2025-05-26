
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Upload, Filter, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Product, Size } from '@/types';
import BulkEditTable from './BulkEditTable';
import ProductFilters from './ProductFilters';
import BulkEditActions from './BulkEditActions';
import ImportExportActions from './ImportExportActions';

const BulkProductEditor = () => {
  const { products, updateProduct } = useAppContext();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [editingProducts, setEditingProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    status: 'all', // all, active, inactive
    priceRange: { min: '', max: '' },
    featured: 'all' // all, featured, regular
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize editing products from main products
  useEffect(() => {
    setEditingProducts([...products]);
  }, [products]);

  // Filter and search logic
  const filteredProducts = useMemo(() => {
    return editingProducts.filter(product => {
      // Search filter
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !product.id.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !(product.description || '').toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Category filter
      if (filters.category && product.category !== filters.category) {
        return false;
      }

      // Price range filter
      if (filters.priceRange.min && product.rentalPrice < parseFloat(filters.priceRange.min)) {
        return false;
      }
      if (filters.priceRange.max && product.rentalPrice > parseFloat(filters.priceRange.max)) {
        return false;
      }

      // Featured filter
      if (filters.featured === 'featured' && !product.featured) {
        return false;
      }
      if (filters.featured === 'regular' && product.featured) {
        return false;
      }

      return true;
    });
  }, [editingProducts, searchTerm, filters]);

  // Pagination
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleProductUpdate = (productId: string, field: keyof Product, value: any) => {
    setEditingProducts(prev => 
      prev.map(product => 
        product.id === productId 
          ? { ...product, [field]: value }
          : product
      )
    );
  };

  const handleSelectProduct = (productId: string, selected: boolean) => {
    setSelectedProducts(prev => 
      selected 
        ? [...prev, productId]
        : prev.filter(id => id !== productId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedProducts(selected ? paginatedProducts.map(p => p.id) : []);
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      const changedProducts = editingProducts.filter(editedProduct => {
        const originalProduct = products.find(p => p.id === editedProduct.id);
        return originalProduct && JSON.stringify(originalProduct) !== JSON.stringify(editedProduct);
      });

      for (const product of changedProducts) {
        await updateProduct(product.id, product);
      }

      toast.success(`${changedProducts.length} produtos atualizados com sucesso!`);
    } catch (error: any) {
      toast.error(`Erro ao salvar alterações: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkEdit = (field: keyof Product, value: any) => {
    if (selectedProducts.length === 0) {
      toast.error('Selecione pelo menos um produto para edição em massa');
      return;
    }

    setEditingProducts(prev => 
      prev.map(product => 
        selectedProducts.includes(product.id)
          ? { ...product, [field]: value }
          : product
      )
    );

    toast.success(`${selectedProducts.length} produtos atualizados`);
  };

  const hasChanges = useMemo(() => {
    return editingProducts.some(editedProduct => {
      const originalProduct = products.find(p => p.id === editedProduct.id);
      return originalProduct && JSON.stringify(originalProduct) !== JSON.stringify(editedProduct);
    });
  }, [editingProducts, products]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-marsala">Editor de Produtos em Massa</h2>
          <p className="text-gray-600">
            {filteredProducts.length} produtos • {selectedProducts.length} selecionados
          </p>
        </div>
        <div className="flex gap-2">
          <ImportExportActions products={filteredProducts} />
          {hasChanges && (
            <Button 
              onClick={handleSaveChanges}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros e Busca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, ID ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <ProductFilters filters={filters} onFiltersChange={setFilters} />
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <BulkEditActions 
          selectedCount={selectedProducts.length}
          onBulkEdit={handleBulkEdit}
        />
      )}

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <BulkEditTable
            products={paginatedProducts}
            selectedProducts={selectedProducts}
            onProductUpdate={handleProductUpdate}
            onSelectProduct={handleSelectProduct}
            onSelectAll={handleSelectAll}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Página {currentPage} de {totalPages} • {filteredProducts.length} produtos
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkProductEditor;
