
import React from "react";
import ProductsActionButtons from "../ProductsActionButtons";

interface ProductsHeaderProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  handleAddProduct: () => void;
  setImportModalOpen: (open: boolean) => void;
  setExportModalOpen: (open: boolean) => void;
}

const ProductsHeader: React.FC<ProductsHeaderProps> = ({
  showFilters,
  setShowFilters,
  handleAddProduct,
  setImportModalOpen,
  setExportModalOpen
}) => {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Produtos</h1>
        <p className="text-neutral-500">Gerencie seus vestidos, ternos e acessórios</p>
      </div>
      
      <ProductsActionButtons 
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        handleAddProduct={handleAddProduct}
        setImportModalOpen={setImportModalOpen}
        setExportModalOpen={setExportModalOpen}
      />
    </div>
  );
};

export default ProductsHeader;
