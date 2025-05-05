
import React, { ReactNode, useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import MobileMenu from "./MobileMenu";

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  
  // Auto-collapse sidebar on mobile
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Handle sidebar toggle
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900 overflow-hidden">
      {/* Backdrop for mobile - only shows when sidebar is open on mobile */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 animate-fade-in"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div 
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          fixed md:relative z-40 transition-transform duration-300 ease-in-out h-full
          md:translate-x-0 ${isMobile ? 'w-[85%] max-w-[300px]' : 'w-auto'}`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-neutral-50 dark:bg-neutral-900">
        {/* Header with mobile menu trigger */}
        <div className="p-4 md:p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center">
          <div className="md:hidden">
            <MobileMenu />
          </div>
        </div>

        {/* Page content with scrollable area */}
        <div className="flex-1 relative w-full overflow-hidden">
          <div className="absolute inset-0 overflow-y-auto p-4 md:p-6">
            {children || <Outlet />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
