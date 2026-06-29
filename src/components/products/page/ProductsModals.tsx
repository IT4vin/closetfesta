
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProductForm from "@/components/products/ProductForm";
import ImportProductsModal from "@/components/products/import-export/ImportProductsModal";
import ExportProductsModal from "@/components/products/import-export/ExportProductsModal";
import { Product } from "@/hooks/useProducts";

interface ProductsModalsProps {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  editingProduct: Product | null;
  importModalOpen: boolean;
  setImportModalOpen: (open: boolean) => void;
  exportModalOpen: boolean;
  setExportModalOpen: (open: boolean) => void;
  handleFormSubmit: (productData: any) => void;
  handleImportConfirm: (importedProducts: any[]) => void;
  productsList: Product[];
  filteredProducts: Product[];
  hasActiveFilters: boolean;
}

const ProductsModals: React.FC<ProductsModalsProps> = ({
  modalOpen,
  setModalOpen,
  editingProduct,
  importModalOpen,
  setImportModalOpen,
  exportModalOpen,
  setExportModalOpen,
  handleFormSubmit,
  handleImportConfirm,
  productsList,
  filteredProducts,
  hasActiveFilters
}) => {
  return (
    <>
      {/* Product Form Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <ProductForm 
            initialData={editingProduct as any} 
            onSubmit={handleFormSubmit} 
            onCancel={() => setModalOpen(false)} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Import Products Modal */}
      <ImportProductsModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportConfirm={handleImportConfirm}
      />
      
      {/* Export Products Modal */}
      <ExportProductsModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        products={productsList}
        filteredProducts={filteredProducts}
        hasFilters={hasActiveFilters}
      />
    </>
  );
};

export default ProductsModals;
