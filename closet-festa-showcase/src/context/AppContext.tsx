
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Product, StoreInfo, User } from '../types';
import { dummyProducts, storeInfo } from '../data/dummyData';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  products: Product[];
  storeInfo: StoreInfo;
  currentUser: User | null;
  isAdmin: boolean;
  filteredProducts: Product[];
  searchTerm: string;
  selectedCategory: string;
  priceFilter: 'all' | 'rental' | 'sale';
  
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
  // State
  const [products, setProducts] = useState<Product[]>(dummyProducts);
  const [store, setStore] = useState<StoreInfo>(storeInfo);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'rental' | 'sale'>('all');
  
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
    setStore(prev => ({ ...prev, ...info }));
    toast({
      title: "Informações atualizadas",
      description: "As alterações foram salvas com sucesso",
    });
  };

  // Product management functions
  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = {
      ...product,
      id: `${products.length + 1}`, // In a real app, use UUID or similar
    };
    
    setProducts(prev => [...prev, newProduct]);
    toast({
      title: "Produto adicionado",
      description: `${product.name} foi adicionado ao catálogo`,
    });
  };

  const updateProduct = (id: string, product: Partial<Product>) => {
    setProducts(prev => 
      prev.map(p => p.id === id ? { ...p, ...product } : p)
    );
    toast({
      title: "Produto atualizado",
      description: "As alterações foram salvas com sucesso",
    });
  };

  const deleteProduct = (id: string) => {
    const productName = products.find(p => p.id === id)?.name;
    setProducts(prev => prev.filter(p => p.id !== id));
    toast({
      title: "Produto removido",
      description: `${productName || 'O produto'} foi removido do catálogo`,
    });
  };

  const value = {
    products,
    storeInfo: store,
    currentUser,
    isAdmin: currentUser?.isAdmin || false,
    filteredProducts,
    searchTerm,
    selectedCategory,
    priceFilter,
    
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
