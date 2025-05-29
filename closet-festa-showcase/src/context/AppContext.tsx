import React, { createContext, useState, useContext, useEffect } from 'react';
import { Product, StoreInfo, User } from '../types';
import { useProducts } from '../hooks/useProducts';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  products: Product[];
  categories: { id: string; name: string; description?: string }[];
  storeInfo: StoreInfo;
  currentUser: User | null;
  isAdmin: boolean;
  filteredProducts: Product[];
  searchTerm: string;
  selectedCategory: string;
  priceFilter: 'all' | 'rental' | 'sale';
  loading: boolean;
  error: string | null;
  
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (category: string) => void;
  setPriceFilter: (filter: 'all' | 'rental' | 'sale') => void;
  
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  
  updateStoreInfo: (info: Partial<StoreInfo>) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Buscar dados reais do banco
  const { products, categories, loading, error } = useProducts();
  
  // State local
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'rental' | 'sale'>('all');
  
  // Informações da loja (pode ser configurável via admin)
  const [store] = useState<StoreInfo>({
    name: "Closet Festa",
    description: "Sua festa perfeita começa aqui! Aluguel e venda de roupas para todas as ocasiões especiais.",
    logo: "/logo.png",
    theme: "elegant",
    contacts: {
      whatsapp: "5511999999999",
      instagram: "@closetfesta",
      shopee: "closetfesta"
    }
  });
  
  const { toast } = useToast();
  
  // Computed value for filtered products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
    
    const matchesPriceFilter = 
      priceFilter === 'all' || 
      (priceFilter === 'rental' && product.rentalPrice > 0) ||
      (priceFilter === 'sale' && product.salePrice !== null);
    
    return matchesSearch && matchesCategory && matchesPriceFilter;
  });

  // Check if there's a logged in user in localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user from localStorage');
      }
    }
  }, []);

  // Authentication functions
  const login = async (email: string, password: string): Promise<boolean> => {
    // In a real app, this would make an API call
    // For demo purposes, we'll accept a hardcoded admin user
    if (email === 'admin@closetfesta.com' && password === 'admin123') {
      const user = { email, isAdmin: true };
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vinda de volta!",
      });
      return true;
    }
    
    toast({
      title: "Falha no login",
      description: "Email ou senha incorretos",
      variant: "destructive",
    });
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    toast({
      title: "Logout realizado",
      description: "Você saiu da sua conta",
    });
  };

  // Store management functions
  const updateStoreInfo = (info: Partial<StoreInfo>) => {
    // Em uma aplicação real, isso salvaria no banco de dados
    toast({
      title: "Informações atualizadas",
      description: "As alterações foram salvas com sucesso",
    });
  };

  // Product management functions (para admin)
  const addProduct = (product: Omit<Product, 'id'>) => {
    // Em uma aplicação real, isso salvaria no banco de dados
    toast({
      title: "Produto adicionado",
      description: `${product.name} foi adicionado ao catálogo`,
    });
  };

  const updateProduct = (id: string, product: Partial<Product>) => {
    // Em uma aplicação real, isso atualizaria no banco de dados
    toast({
      title: "Produto atualizado",
      description: "As alterações foram salvas com sucesso",
    });
  };

  const deleteProduct = (id: string) => {
    // Em uma aplicação real, isso removeria do banco de dados
    const productName = products.find(p => p.id === id)?.name;
    toast({
      title: "Produto removido",
      description: `${productName || 'O produto'} foi removido do catálogo`,
    });
  };

  const value = {
    products,
    categories,
    storeInfo: store,
    currentUser,
    isAdmin: currentUser?.isAdmin || false,
    filteredProducts,
    searchTerm,
    selectedCategory,
    priceFilter,
    loading,
    error,
    
    setSearchTerm,
    setSelectedCategory,
    setPriceFilter,
    
    login,
    logout,
    
    updateStoreInfo,
    addProduct,
    updateProduct,
    deleteProduct,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
