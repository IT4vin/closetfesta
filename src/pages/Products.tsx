
import React, { useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import { 
  Search, 
  Plus, 
  Filter, 
  Grid, 
  List, 
  Edit, 
  Trash, 
  Eye,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProductForm from "@/components/products/ProductForm";
import ProductCard from "@/components/products/ProductCard";
import ProductTable from "@/components/products/ProductTable";

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
    setModalOpen(false);
  };
  
  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
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
  
  return (
    <MainLayout>
      <div className="page-transition p-6">
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
        
        <div className="premium-card mb-8 p-4">
          <div className="flex flex-col space-y-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar produtos por nome, código ou categoria..." 
                className="input-field pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-neutral-200">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Categoria</label>
                  <select 
                    name="type" 
                    value={filters.type} 
                    onChange={handleFilterChange}
                    className="input-field w-full"
                  >
                    <option value="">Todos os tipos</option>
                    <option value="Vestido">Vestidos</option>
                    <option value="Terno">Ternos</option>
                    <option value="Acessório">Acessórios</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Status</label>
                  <select 
                    name="status" 
                    value={filters.status} 
                    onChange={handleFilterChange}
                    className="input-field w-full"
                  >
                    <option value="">Todos os status</option>
                    <option value="available">Disponível</option>
                    <option value="rented">Alugado</option>
                    <option value="maintenance">Em Manutenção</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Tamanho</label>
                  <select 
                    name="size" 
                    value={filters.size} 
                    onChange={handleFilterChange}
                    className="input-field w-full"
                  >
                    <option value="">Todos os tamanhos</option>
                    <option value="P">P</option>
                    <option value="M">M</option>
                    <option value="G">G</option>
                    <option value="GG">GG</option>
                    <option value="38">38</option>
                    <option value="40">40</option>
                    <option value="42">42</option>
                    <option value="44">44</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Cor</label>
                  <select 
                    name="color" 
                    value={filters.color} 
                    onChange={handleFilterChange}
                    className="input-field w-full"
                  >
                    <option value="">Todas as cores</option>
                    <option value="Branco">Branco</option>
                    <option value="Preto">Preto</option>
                    <option value="Rose">Rose</option>
                    <option value="Azul Marinho">Azul Marinho</option>
                    <option value="Dourado">Dourado</option>
                    <option value="Cinza">Cinza</option>
                    <option value="Marsala">Marsala</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Preço Mín (Aluguel)</label>
                  <input 
                    type="number" 
                    name="priceMin" 
                    value={filters.priceMin} 
                    onChange={handleFilterChange}
                    placeholder="R$ Mínimo"
                    className="input-field w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Preço Máx (Aluguel)</label>
                  <input 
                    type="number" 
                    name="priceMax" 
                    value={filters.priceMax} 
                    onChange={handleFilterChange}
                    placeholder="R$ Máximo"
                    className="input-field w-full"
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-neutral-500">
                {filteredProducts.length} produto(s) encontrado(s)
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
          </div>
        </div>
        
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-neutral-100 p-6 rounded-full mb-4">
              <Search size={32} className="text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
            <p className="text-neutral-500 max-w-md">
              Tente ajustar os filtros ou a busca para encontrar o que procura.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onEdit={() => handleEditProduct(product)} 
              />
            ))}
          </div>
        ) : (
          <ProductTable 
            products={filteredProducts}
            onEdit={handleEditProduct}
          />
        )}
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
    </MainLayout>
  );
};

export default ProductsPage;
