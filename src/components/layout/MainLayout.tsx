
import React, { ReactNode, useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import MobileMenu from "./MobileMenu";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Auto-collapse sidebar on mobile
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Handle sidebar toggle
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // Obter as iniciais do nome do usuário
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
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
        {/* Header with mobile menu trigger and user profile */}
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="md:hidden">
            <MobileMenu />
          </div>
          
          {/* User Profile Dropdown */}
          {user && (
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:focus:ring-neutral-700" aria-label="Menu de usuário">
                    <Avatar className="h-9 w-9 cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-neutral-200 transition-all">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" sideOffset={8} className="w-56 animate-in fade-in-80 slide-in-from-top-1">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-neutral-500">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Meu Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações do Sistema</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Page content with scrollable area */}
        <div className="flex-1 relative w-full overflow-hidden">
          <div className="absolute inset-0 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
            {children || <Outlet />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
