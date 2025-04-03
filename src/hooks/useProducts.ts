
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export interface Product {
  id: number;
  name: string;
  description: string;
  type: string;
  subtype: string;
  price: number;
  rentalPrice: number;
  image: string;
  status: string;
  size: string;
  color: string;
  sku: string;
  dateAdded: string;
}

export interface ProductFilters {
  type: string;
  status: string;
  size: string;
  priceMin: string;
  priceMax: string;
  color: string;
}

// Mock data - in a real app this would come from an API
const initialProducts = [
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

export const useProducts = () => {
  const { toast } = useToast();
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<ProductFilters>({
    type: "",
    status: "",
    size: "",
    priceMin: "",
    priceMax: "",
    color: ""
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Handle adding a new product
  const handleAddProduct = () => {
    setEditingProduct(null);
  };
  
  // Handle editing an existing product
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
  };
  
  // Handle form submission
  const handleFormSubmit = (productData: any) => {
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

  return {
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
  };
};
