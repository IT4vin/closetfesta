
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FilterState {
  category: string;
  status: string;
  priceRange: { min: string; max: string };
  featured: string;
}

interface ProductFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({ filters, onFiltersChange }) => {
  const categories = ['Vestidos', 'Acessórios', 'Sapatos', 'Bolsas', 'Conjuntos'];

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex gap-4 flex-wrap">
      <div className="min-w-[150px]">
        <Label className="text-xs text-gray-600">Categoria</Label>
        <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[120px]">
        <Label className="text-xs text-gray-600">Destaque</Label>
        <Select value={filters.featured} onValueChange={(value) => updateFilter('featured', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="featured">Destaque</SelectItem>
            <SelectItem value="regular">Regular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[100px]">
        <Label className="text-xs text-gray-600">Preço Mín</Label>
        <Input
          type="number"
          placeholder="0"
          value={filters.priceRange.min}
          onChange={(e) => updateFilter('priceRange', { ...filters.priceRange, min: e.target.value })}
        />
      </div>

      <div className="min-w-[100px]">
        <Label className="text-xs text-gray-600">Preço Máx</Label>
        <Input
          type="number"
          placeholder="999"
          value={filters.priceRange.max}
          onChange={(e) => updateFilter('priceRange', { ...filters.priceRange, max: e.target.value })}
        />
      </div>
    </div>
  );
};

export default ProductFilters;
