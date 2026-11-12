import React from "react";
import { Button } from "@/components/ui/button";
import { Grid3X3, List, X } from "lucide-react";
import FilterBar from "@/components/common/FilterBar";
import type { ProductFilters } from "@/hooks/useProducts";

interface ProductsFilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: ProductFilters;
  filterOptions: { categories: string[]; colors: string[]; sizes: string[] };
  handleFilterChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  showFilters: boolean;
  productsCount: number;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const ProductsFilterBar: React.FC<ProductsFilterBarProps> = ({
  searchTerm, setSearchTerm, filters, filterOptions, handleFilterChange, showFilters,
  productsCount, viewMode, setViewMode, hasActiveFilters, onClearFilters,
}) => {
  const onSelect = (name: string) => (value: string) =>
    handleFilterChange({ target: { name, value } } as React.ChangeEvent<HTMLSelectElement>);

  const selectFilters = showFilters ? [
    {
      name: "type",
      label: "Categoria",
      value: filters.type,
      onChange: onSelect("type"),
      options: [
        { value: "", label: "Todas as categorias" },
        ...filterOptions.categories.map(value => ({ value, label: value })),
      ],
    },
    {
      name: "status",
      label: "Status",
      value: filters.status,
      onChange: onSelect("status"),
      options: [
        { value: "", label: "Todos os status" },
        { value: "available", label: "Disponível" },
        { value: "reserved", label: "Reservado" },
        { value: "rented", label: "Alugado" },
        { value: "maintenance", label: "Em manutenção" },
      ],
    },
    {
      name: "size",
      label: "Tamanho",
      value: filters.size,
      onChange: onSelect("size"),
      options: [
        { value: "", label: "Todos os tamanhos" },
        ...filterOptions.sizes.map(value => ({ value, label: value })),
        { value: "__missing__", label: "Sem tamanho cadastrado" },
      ],
    },
    {
      name: "color",
      label: "Cor",
      value: filters.color,
      onChange: onSelect("color"),
      options: [
        { value: "", label: "Todas as cores" },
        ...filterOptions.colors.map(value => ({ value, label: value })),
        { value: "__missing__", label: "Sem cor cadastrada" },
      ],
    },
  ] : [];

  return (
    <div className="premium-card mb-8">
      <FilterBar
        searchPlaceholder="Buscar por nome, código, categoria ou cor..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        selectFilters={selectFilters}
        showFilterButton={false}
        onClearSearch={() => setSearchTerm("")}
      />
      {showFilters && (
        <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2">
          <div>
            <label htmlFor="products-price-min" className="mb-1 block text-sm font-medium text-neutral-600">
              Aluguel mínimo (R$)
            </label>
            <input id="products-price-min" name="priceMin" type="text" inputMode="decimal"
              placeholder="Ex.: 190,00" value={filters.priceRange.min}
              onChange={handleFilterChange} className="input-field w-full" />
          </div>
          <div>
            <label htmlFor="products-price-max" className="mb-1 block text-sm font-medium text-neutral-600">
              Aluguel máximo (R$)
            </label>
            <input id="products-price-max" name="priceMax" type="text" inputMode="decimal"
              placeholder="Ex.: 500,00" value={filters.priceRange.max}
              onChange={handleFilterChange} className="input-field w-full" />
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span aria-live="polite" className="text-sm text-neutral-600">
            {productsCount} {productsCount === 1 ? "produto encontrado" : "produtos encontrados"}
          </span>
          {hasActiveFilters && (
            <Button type="button" variant="outline" size="sm" onClick={onClearFilters}
              className="h-9 gap-1.5 border-marsala-200 text-marsala-800">
              <X className="h-4 w-4" /> Limpar filtros
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button aria-label="Visualização em grade" type="button"
            variant={viewMode === "grid" ? "default" : "outline"} size="icon"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "bg-marsala hover:bg-marsala-700" : ""}>
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button aria-label="Visualização em lista" type="button"
            variant={viewMode === "list" ? "default" : "outline"} size="icon"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "bg-marsala hover:bg-marsala-700" : ""}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductsFilterBar;
