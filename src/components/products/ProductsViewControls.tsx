
import React from "react";
import { Grid, List } from "lucide-react";

interface ProductsViewControlsProps {
  productsCount: number;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
}

const ProductsViewControls: React.FC<ProductsViewControlsProps> = ({
  productsCount,
  viewMode,
  setViewMode,
}) => {
  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-neutral-500">
        {productsCount} produto(s) encontrado(s)
      </p>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-l-md border border-r-0 ${
              viewMode === "grid" 
                ? "bg-marsala text-white border-marsala" 
                : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-r-md border ${
              viewMode === "list" 
                ? "bg-marsala text-white border-marsala" 
                : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            <List size={18} />
          </button>
        </div>
        
        <select className="input-field">
          <option>Ordenar por Nome</option>
          <option>Preço Menor-Maior</option>
          <option>Preço Maior-Menor</option>
          <option>Mais Recentes</option>
        </select>
      </div>
    </div>
  );
};

export default ProductsViewControls;
