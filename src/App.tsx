import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Calendar from "./pages/Calendar";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Financial from "./pages/Financial";
import Inventory from "./pages/Inventory";
import PDV from "./pages/PDV";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Catalog from "./pages/Catalog";
import NotFound from "./pages/NotFound";
import LoginForm from '@/components/auth/LoginForm';
import { useAuth, initializeAuthStore } from '@/stores/authStore';

// Create a client
const queryClient = new QueryClient();

function App() {
  const { isAuthenticated, isLoading, error } = useAuth();

  useEffect(() => {
    // Inicializar AuthStore na montagem do componente
    initializeAuthStore();
  }, []);

  const handleLoginSuccess = () => {
    // O Zustand já gerencia automaticamente o estado após login bem-sucedido
    console.log('✅ Login bem-sucedido detectado no App.tsx');
  };

  // Tela de loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando aplicação...</p>
        </div>
      </div>
    );
  }

  // Tela de erro crítico
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-4">Erro na Aplicação</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar sistema de login se não estiver autenticado
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // Aplicação principal com todas as rotas
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <ThemeProvider>
              <Toaster />
              <Sonner />
              <Router>
                <Routes>
                  {/* Rota pública de login */}
                  <Route path="/login" element={<Navigate to="/" replace />} />
                  
                  {/* Rotas protegidas */}
                  <Route 
                    path="/" 
                    element={
                      <ProtectedRoute>
                        <MainLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Index />} />
                    <Route path="calendar" element={<Calendar />} />
                    <Route path="products" element={<Products />} />
                    <Route path="products/:id" element={<ProductDetail />} />
                    <Route path="clients" element={<Clients />} />
                    <Route path="clients/:id" element={<ClientDetail />} />
                    <Route path="financial" element={<Financial />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="pdv" element={<PDV />} />
                    <Route path="catalog" element={<Catalog />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Router>
            </ThemeProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

export default App;
