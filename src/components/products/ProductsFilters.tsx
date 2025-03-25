
import React from "react";

interface FiltersState {
  type: string;
  status: string;
  size: string;
  priceMin: string;
  priceMax: string;
  color: string;
}

interface ProductsFiltersProps {
  filters: FiltersState;
  handleFilterChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  showFilters: boolean;
}

const ProductsFilters: React.FC<ProductsFiltersProps> = ({ 
  filters, 
  handleFilterChange, 
  showFilters 
}) => {
  if (!showFilters) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-neutral-200">
      <div>
        <label className="block text-sm font-medium text-neutral-600 mb-1">Categoria</label>
        <select 
          name="type" 
          value={filters.type} 
          onChange={handleFilterChange}
          className="input-field w-full"
        >
          <option value="">Todos os tipos</option>
          <option value="Vestido">Vestidos</option>
          <option value="Terno">Ternos</option>
          <option value="Acessório">Acessórios</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-600 mb-1">Status</label>
        <select 
          name="status" 
          value={filters.status} 
          onChange={handleFilterChange}
          className="input-field w-full"
        >
          <option value="">Todos os status</option>
          <option value="available">Disponível</option>
          <option value="rented">Alugado</option>
          <option value="maintenance">Em Manutenção</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-600 mb-1">Tamanho</label>
        <select 
          name="size" 
          value={filters.size} 
          onChange={handleFilterChange}
          className="input-field w-full"
        >
          <option value="">Todos os tamanhos</option>
          <option value="P">P</option>
          <option value="M">M</option>
          <option value="G">G</option>
          <option value="GG">GG</option>
          <option value="38">38</option>
          <option value="40">40</option>
          <option value="42">42</option>
          <option value="44">44</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-600 mb-1">Cor</label>
        <select 
          name="color" 
          value={filters.color} 
          onChange={handleFilterChange}
          className="input-field w-full"
        >
          <option value="">Todas as cores</option>
          <option value="Branco">Branco</option>
          <option value="Preto">Preto</option>
          <option value="Rose">Rose</option>
          <option value="Azul Marinho">Azul Marinho</option>
          <option value="Dourado">Dourado</option>
          <option value="Cinza">Cinza</option>
          <option value="Marsala">Marsala</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-600 mb-1">Preço Mín (Aluguel)</label>
        <input 
          type="number" 
          name="priceMin" 
          value={filters.priceMin} 
          onChange={handleFilterChange}
          placeholder="R$ Mínimo"
          className="input-field w-full"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-600 mb-1">Preço Máx (Aluguel)</label>
        <input 
          type="number" 
          name="priceMax" 
          value={filters.priceMax} 
          onChange={handleFilterChange}
          placeholder="R$ Máximo"
          className="input-field w-full"
        />
      </div>
    </div>
  );
};

export default ProductsFilters;
