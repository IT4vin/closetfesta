
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Login from "./pages/Login";
import MainLayout from "./components/layout/MainLayout";
import Index from "./pages/Index";
import Calendar from "./pages/Calendar";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Financial from "./pages/Financial";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Inventory from "./pages/Inventory";
import NotFound from "./pages/NotFound";

// Create a client
const queryClient = new QueryClient();

const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Rota pública */}
                  <Route path="/login" element={<Login />} />
                  
                  {/* Rotas protegidas */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Index />} />
                    <Route path="calendar" element={<Calendar />} />
                    <Route path="products" element={<Products />} />
                    <Route path="products/:id" element={<ProductDetail />} />
                    <Route path="clients" element={<Clients />} />
                    <Route path="clients/:id" element={<ClientDetail />} />
                    <Route path="financial" element={<Financial />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
