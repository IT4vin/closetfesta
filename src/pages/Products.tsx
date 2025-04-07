
import React, { useState } from "react";
import ProductsHeader from "@/components/products/page/ProductsHeader";
import ProductsFilterBar from "@/components/products/page/ProductsFilterBar";
import ProductsDisplay from "@/components/products/ProductsDisplay";
import ProductsModals from "@/components/products/page/ProductsModals";
import { useProducts } from "@/hooks/useProducts";

const ProductsPage = () => {
  const {
    productsList,
    searchTerm,
    setSearchTerm,
    filters,
    filteredProducts,
    editingProduct,
    setEditingProduct,
    handleAddProduct,
    handleEditProduct,
    handleFormSubmit,
    handleImportConfirm,
    handleFilterChange,
    hasActiveFilters
  } = useProducts();
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  
  // Wrapper for add product to open the modal
  const handleAddProductClick = () => {
    handleAddProduct();
    setModalOpen(true);
  };
  
  // Wrapper for edit product to open the modal
  const handleEditProductClick = (product: any) => {
    handleEditProduct(product);
    setModalOpen(true);
  };
  
  return (
    <div className="page-transition p-6">
      <ProductsHeader 
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        handleAddProduct={handleAddProductClick}
        setImportModalOpen={setImportModalOpen}
        setExportModalOpen={setExportModalOpen}
      />
      
      <ProductsFilterBar 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filters={filters}
        handleFilterChange={handleFilterChange}
        showFilters={showFilters}
        productsCount={filteredProducts.length}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
      
      <ProductsDisplay
        products={filteredProducts}
        viewMode={viewMode}
        onEdit={handleEditProductClick}
      />
      
      <ProductsModals 
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        editingProduct={editingProduct}
        importModalOpen={importModalOpen}
        setImportModalOpen={setImportModalOpen}
        exportModalOpen={exportModalOpen}
        setExportModalOpen={setExportModalOpen}
        handleFormSubmit={handleFormSubmit}
        handleImportConfirm={handleImportConfirm}
        productsList={productsList}
        filteredProducts={filteredProducts}
        hasActiveFilters={hasActiveFilters()}
      />
    </div>
  );
};

export default ProductsPage;
