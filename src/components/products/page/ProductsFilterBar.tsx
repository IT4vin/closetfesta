
import React from "react";
import ProductsSearchBar from "../ProductsSearchBar";
import ProductsFilters from "../ProductsFilters";
import ProductsViewControls from "../ProductsViewControls";
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
  return (
    <div className="premium-card mb-8 p-4">
      <div className="flex flex-col space-y-4">
        <ProductsSearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        
        <ProductsFilters
          filters={filters}
          handleFilterChange={handleFilterChange}
          showFilters={showFilters}
        />
        
        <ProductsViewControls
          productsCount={productsCount}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </div>
    </div>
  );
};

export default ProductsFilterBar;
