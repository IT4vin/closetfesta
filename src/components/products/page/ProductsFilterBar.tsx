
import React from "react";
import { Button } from "@/components/ui/button";
import { Grid3X3, List } from "lucide-react";
import FilterBar from "@/components/common/FilterBar";
import { ProductFilters } from "@/hooks/useProducts";

interface ProductsFilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: ProductFilters;
  handleFilterChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  showFilters: boolean;
  productsCount: number;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
}

const ProductsFilterBar: React.FC<ProductsFilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  filters,
  handleFilterChange,
  showFilters,
  productsCount,
  viewMode,
  setViewMode
}) => {
  // Create the select filters array for the FilterBar
  const selectFilters = showFilters ? [
    {
      name: "type",
      label: "Categoria",
      value: filters.type,
      onChange: (value) => handleFilterChange({
        target: { name: "type", value }
      } as React.ChangeEvent<HTMLSelectElement>),
      options: [
        { value: "", label: "Todos os tipos" },
        { value: "Vestido", label: "Vestidos" },
        { value: "Terno", label: "Ternos" },
        { value: "Acessório", label: "Acessórios" }
      ]
    },
    {
      name: "status",
      label: "Status",
      value: filters.status,
      onChange: (value) => handleFilterChange({
        target: { name: "status", value }
      } as React.ChangeEvent<HTMLSelectElement>),
      options: [
        { value: "", label: "Todos os status" },
        { value: "available", label: "Disponível" },
        { value: "rented", label: "Alugado" },
        { value: "maintenance", label: "Em Manutenção" }
      ]
    },
    {
      name: "size",
      label: "Tamanho",
      value: filters.size,
      onChange: (value) => handleFilterChange({
        target: { name: "size", value }
      } as React.ChangeEvent<HTMLSelectElement>),
      options: [
        { value: "", label: "Todos os tamanhos" },
        { value: "P", label: "P" },
        { value: "M", label: "M" },
        { value: "G", label: "G" },
        { value: "GG", label: "GG" },
        { value: "38", label: "38" },
        { value: "40", label: "40" },
        { value: "42", label: "42" },
        { value: "44", label: "44" }
      ]
    },
    {
      name: "color",
      label: "Cor",
      value: filters.color,
      onChange: (value) => handleFilterChange({
        target: { name: "color", value }
      } as React.ChangeEvent<HTMLSelectElement>),
      options: [
        { value: "", label: "Todas as cores" },
        { value: "Branco", label: "Branco" },
        { value: "Preto", label: "Preto" },
        { value: "Rose", label: "Rose" },
        { value: "Azul Marinho", label: "Azul Marinho" },
        { value: "Dourado", label: "Dourado" },
        { value: "Cinza", label: "Cinza" },
        { value: "Marsala", label: "Marsala" }
      ]
    }
  ] : [];

  return (
    <div className="premium-card mb-8">
      <FilterBar
        searchPlaceholder="Buscar por nome, código ou categoria..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        selectFilters={selectFilters}
        showFilterButton={false}
      />
      
      {/* View mode controls */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
        <div className="text-sm text-neutral-600">
          {productsCount} produtos encontrados
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={viewMode === "grid" ? "default" : "outline"} 
            size="icon" 
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "bg-marsala hover:bg-marsala-700" : ""}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === "list" ? "default" : "outline"} 
            size="icon" 
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "bg-marsala hover:bg-marsala-700" : ""}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductsFilterBar;
