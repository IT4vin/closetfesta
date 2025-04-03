
import React from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, Filter, Plus, ChevronUp, ChevronDown } from "lucide-react";

interface ProductsActionButtonsProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  handleAddProduct: () => void;
  setImportModalOpen: (open: boolean) => void;
  setExportModalOpen: (open: boolean) => void;
}

const ProductsActionButtons: React.FC<ProductsActionButtonsProps> = ({
  showFilters,
  setShowFilters,
  handleAddProduct,
  setImportModalOpen,
  setExportModalOpen
}) => {
  return (
    <div className="flex gap-3 flex-wrap">
      <Button 
        variant="outline" 
        onClick={() => setImportModalOpen(true)}
        className="secondary-button"
      >
        <Upload size={18} />
        <span>Importar</span>
      </Button>
      
      <Button 
        variant="outline" 
        onClick={() => setExportModalOpen(true)}
        className="secondary-button"
      >
        <Download size={18} />
        <span>Exportar</span>
      </Button>
      
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
  );
};

export default ProductsActionButtons;
