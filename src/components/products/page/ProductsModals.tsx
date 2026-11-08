
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
  handleFormSubmit: (productData: any) => Promise<void>;
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
        <DialogContent className="flex h-[92vh] max-h-[950px] w-[97vw] max-w-[1080px] flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b bg-white px-5 py-4 text-left sm:px-6">
            <DialogTitle className="text-xl font-semibold text-marsala-950">
              {editingProduct ? 'Editar produto' : 'Cadastrar novo produto'}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Catálogo de locações · Informações, preços, características e imagens
            </p>
          </DialogHeader>
          <ProductForm 
            initialData={editingProduct as any} 
            onSubmit={async (data) => { await handleFormSubmit(data); setModalOpen(false); }} 
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
