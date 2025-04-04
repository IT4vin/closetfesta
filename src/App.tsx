
import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Calendar from "./pages/Calendar";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Financial from "./pages/Financial";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Create a client
const queryClient = new QueryClient();

const App = () => {
  // Initialize theme settings on app load
  useEffect(() => {
    // Apply saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Apply saved high contrast setting
    const savedHighContrast = localStorage.getItem('highContrast');
    if (savedHighContrast === 'true') {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    // Apply font size
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
      switch (savedFontSize) {
        case 'small':
          document.documentElement.style.fontSize = '14px';
          break;
        case 'medium':
          document.documentElement.style.fontSize = '16px';
          break;
        case 'large':
          document.documentElement.style.fontSize = '18px';
          break;
        case 'xlarge':
          document.documentElement.style.fontSize = '20px';
          break;
      }
    }
    
    // Apply color scheme
    const savedColorScheme = localStorage.getItem('colorScheme');
    if (savedColorScheme) {
      // Remove all current color scheme classes
      document.documentElement.classList.remove('theme-marsala', 'theme-blue', 'theme-green', 'theme-purple');
      
      // Add the new color scheme class
      document.documentElement.classList.add(`theme-${savedColorScheme}`);
      
      // Update the CSS variable for primary color based on the scheme
      switch (savedColorScheme) {
        case 'marsala':
          document.documentElement.style.setProperty('--marsala', '353 69% 25%');
          break;
        case 'blue':
          document.documentElement.style.setProperty('--marsala', '210 100% 50%');
          break;
        case 'green':
          document.documentElement.style.setProperty('--marsala', '142 76% 36%');
          break;
        case 'purple':
          document.documentElement.style.setProperty('--marsala', '271 76% 53%');
          break;
      }
    } else {
      // Default to marsala
      document.documentElement.classList.add('theme-marsala');
    }
  }, []);

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/:id" element={<ClientDetail />} />
              <Route path="/financial" element={<Financial />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
