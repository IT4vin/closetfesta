
import React, { useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Upload, Filter, Plus, ChevronUp, ChevronDown } from "lucide-react";
import ProductForm from "@/components/products/ProductForm";
import ProductsHeader from "@/components/products/ProductsHeader";
import ProductsSearchBar from "@/components/products/ProductsSearchBar";
import ProductsFilters from "@/components/products/ProductsFilters";
import ProductsViewControls from "@/components/products/ProductsViewControls";
import ProductsDisplay from "@/components/products/ProductsDisplay";
import ImportProductsModal from "@/components/products/import-export/ImportProductsModal";
import ExportProductsModal from "@/components/products/import-export/ExportProductsModal";
import { useToast } from "@/hooks/use-toast";

// In a real app, this would come from an API/database
const products = [
  {
    id: 1,
    name: "Vestido de Noiva Elegance",
    description: "Vestido longo de cetim com bordados",
    type: "Vestido",
    subtype: "Noiva",
    price: 1200,
    rentalPrice: 300,
    image: "https://images.unsplash.com/photo-1594552072238-5b1076134e85?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    status: "available",
    size: "M",
    color: "Branco",
    sku: "VEST-001",
    dateAdded: "2023-10-12"
  },
  {
    id: 2,
    name: "Terno Preto Classic",
    description: "Terno preto em lã fria",
    type: "Terno",
    subtype: "Social",
    price: 900,
    rentalPrice: 180,
    image: "https://images.unsplash.com/photo-1598808503746-f34c53b9323e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    status: "rented",
    size: "42",
    color: "Preto",
    sku: "TERN-001",
    dateAdded: "2023-09-05"
  },
  {
    id: 3,
    name: "Vestido Madrinha Rose",
    description: "Vestido longo em chiffon",
    type: "Vestido",
    subtype: "Madrinha",
    price: 850,
    rentalPrice: 150,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    status: "available",
    size: "G",
    color: "Rose",
    sku: "VEST-002",
    dateAdded: "2023-11-20"
  },
  {
    id: 4,
    name: "Smoking Azul Marinho",
    description: "Smoking em lã premium",
    type: "Terno",
    subtype: "Smoking",
    price: 1100,
    rentalPrice: 220,
    image: "https://images.unsplash.com/photo-1592878849122-facb97520f9e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    status: "available",
    size: "44",
    color: "Azul Marinho",
    sku: "TERN-002",
    dateAdded: "2023-08-15"
  },
  {
    id: 5,
    name: "Vestido de Festa Dourado",
    description: "Vestido curto com paetês",
    type: "Vestido",
    subtype: "Festa",
    price: 780,
    rentalPrice: 140,
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    status: "available",
    size: "P",
    color: "Dourado",
    sku: "VEST-003",
    dateAdded: "2023-12-03"
  },
  {
    id: 6,
    name: "Terno Cinza Slim",
    description: "Terno slim fit em cinza",
    type: "Terno",
    subtype: "Social",
    price: 920,
    rentalPrice: 170,
    image: "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    status: "rented",
    size: "40",
    color: "Cinza",
    sku: "TERN-003",
    dateAdded: "2023-10-18"
  },
];

const ProductsPage = () => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    size: "",
    priceMin: "",
    priceMax: "",
    color: ""
  });
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [productsList, setProductsList] = useState(products);
  
  // Handle adding a new product
  const handleAddProduct = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };
  
  // Handle editing an existing product
  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setModalOpen(true);
  };
  
  // Handle form submission
  const handleFormSubmit = (productData: any) => {
    console.log("Product data submitted:", productData);
    // Here you would typically send this data to your backend
    
    // For this demo, we'll update the local state
    if (editingProduct) {
      setProductsList(prev => 
        prev.map(p => p.id === editingProduct.id ? { ...productData, id: editingProduct.id } : p)
      );
      toast({
        title: "Produto atualizado",
        description: `${productData.name} foi atualizado com sucesso`,
      });
    } else {
      const newProduct = {
        ...productData,
        id: Date.now(), // Generate a temporary ID
        dateAdded: new Date().toISOString().split('T')[0]
      };
      setProductsList(prev => [...prev, newProduct]);
      toast({
        title: "Produto adicionado",
        description: `${productData.name} foi adicionado com sucesso`,
      });
    }
    
    setModalOpen(false);
  };
  
  // Handle import confirmation
  const handleImportConfirm = (importedProducts: any[]) => {
    // In a real app, you would send this to your backend
    const newProducts = importedProducts.map((product, index) => ({
      ...product,
      id: Date.now() + index, // Generate temporary IDs
      dateAdded: new Date().toISOString().split('T')[0]
    }));
    
    setProductsList(prev => [...prev, ...newProducts]);
  };
  
  // Filter products based on search and filters
  const filteredProducts = productsList.filter(product => {
    // Search filter
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !product.sku.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !product.type.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Type filter
    if (filters.type && product.type !== filters.type) {
      return false;
    }
    
    // Status filter
    if (filters.status && product.status !== filters.status) {
      return false;
    }
    
    // Size filter
    if (filters.size && product.size !== filters.size) {
      return false;
    }
    
    // Price min filter
    if (filters.priceMin && product.rentalPrice < parseInt(filters.priceMin)) {
      return false;
    }
    
    // Price max filter
    if (filters.priceMax && product.rentalPrice > parseInt(filters.priceMax)) {
      return false;
    }
    
    // Color filter
    if (filters.color && product.color !== filters.color) {
      return false;
    }
    
    return true;
  });
  
  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Check if any filters are applied
  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== "");
  };
  
  return (
    <MainLayout>
      <div className="page-transition p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Produtos</h1>
            <p className="text-neutral-500">Gerencie seus vestidos, ternos e acessórios</p>
          </div>
          
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
        </div>
        
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
              productsCount={filteredProducts.length}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          </div>
        </div>
        
        <ProductsDisplay
          products={filteredProducts}
          viewMode={viewMode}
          onEdit={handleEditProduct}
        />
      </div>
      
      {/* Product Form Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <ProductForm 
            initialData={editingProduct} 
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
        hasFilters={hasActiveFilters()}
      />
    </MainLayout>
  );
};

export default ProductsPage;
