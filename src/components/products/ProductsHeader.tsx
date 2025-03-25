
import React from "react";
import { Filter, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductsHeaderProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  handleAddProduct: () => void;
}

const ProductsHeader: React.FC<ProductsHeaderProps> = ({
  showFilters,
  setShowFilters,
  handleAddProduct,
}) => {
  return (
    <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Produtos</h1>
        <p className="text-neutral-500">Gerencie seus vestidos, ternos e acessórios</p>
      </div>
      
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
          className="secondary-button"
        >
          <Filter size={18} />
          <span>Filtrar</span>
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
        <Button 
          className="primary-button bg-marsala hover:bg-marsala/90"
          onClick={handleAddProduct}
        >
          <Plus size={18} />
          <span>Novo Produto</span>
        </Button>
      </div>
    </header>
  );
};

export default ProductsHeader;
