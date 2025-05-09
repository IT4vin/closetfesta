
import React from "react";
import { NavLink } from "react-router-dom";
import { 
  BarChart, 
  Users, 
  ShoppingBag, 
  Calendar, 
  Wallet, 
  LineChart, 
  Settings, 
  ShoppingCart, 
  X 
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import UserProfile from "./UserProfile";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { colorScheme } = useTheme();
  
  const navigation = [
    { name: "Dashboard", href: "/", icon: BarChart },
    { name: "Clientes", href: "/clients", icon: Users },
    { name: "Produtos", href: "/products", icon: ShoppingBag },
    { name: "Agendamentos", href: "/calendar", icon: Calendar },
    { name: "Financeiro", href: "/financial", icon: Wallet },
    { name: "Estoque", href: "/inventory", icon: LineChart },
    { name: "PDV", href: "/pdv", icon: ShoppingCart },
    { name: "Configurações", href: "/settings", icon: Settings },
  ];

  return (
    <div className="h-full w-64 max-w-full border-r border-marsala-800/20 bg-marsala-900 text-white flex flex-col">
      <div className="p-4 border-b border-marsala-800/30 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Closet Manager</h1>
          <p className="text-xs text-marsala-200 mt-1">Sistema de Gestão</p>
        </div>
        
        <div className="md:hidden">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            aria-label="Fechar menu"
            className="h-8 w-8 text-white hover:bg-marsala-800/50"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </Button>
        </div>
      </div>
      
      <nav className="flex-1 p-2 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={() => onClose && window.innerWidth < 768 ? onClose() : null}
            className={({ isActive }) =>
              `flex items-center space-x-3 p-2 rounded-md transition-colors ${
                isActive
                  ? `bg-marsala-800 text-white font-medium`
                  : `text-marsala-100 hover:bg-marsala-800/50 hover:text-white`
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? `text-white` : "text-marsala-200"}`} />
                <span className="truncate">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      <UserProfile />
      
      <div className="p-4 border-t border-marsala-800/30 flex justify-between items-center">
        <p className="text-xs text-marsala-200">&copy; 2025 Closet Manager</p>
        <ThemeToggle />
      </div>
    </div>
  );
};

export default Sidebar;
