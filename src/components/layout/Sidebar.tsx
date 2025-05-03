
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
  
  // Dynamic background color based on color scheme
  const getBgColor = () => {
    switch (colorScheme) {
      case "marsala":
        return "bg-marsala-900 dark:bg-marsala-950";
      case "blue":
        return "bg-blue-700 dark:bg-blue-900";
      case "green":
        return "bg-emerald-700 dark:bg-emerald-900";
      case "purple":
        return "bg-purple-700 dark:bg-purple-900";
      default:
        return "bg-marsala-900 dark:bg-marsala-950";
    }
  };
  
  // Dynamic text color for contrast
  const getTextColor = () => {
    return "text-white dark:text-gray-100";
  };
  
  // Dynamic border color
  const getBorderColor = () => {
    switch (colorScheme) {
      case "marsala":
        return "border-marsala-700 dark:border-marsala-800";
      case "blue":
        return "border-blue-600 dark:border-blue-800";
      case "green":
        return "border-emerald-600 dark:border-emerald-800";
      case "purple":
        return "border-purple-600 dark:border-purple-800";
      default:
        return "border-marsala-700 dark:border-marsala-800";
    }
  };

  return (
    <div className={`h-full w-64 max-w-full border-r ${getBorderColor()} ${getBgColor()} flex flex-col`}>
      <div className={`p-4 border-b ${getBorderColor()} flex justify-between items-center`}>
        <div>
          <h1 className={`text-xl font-bold ${getTextColor()}`}>Closet Manager</h1>
          <p className={`text-xs ${getTextColor()} opacity-80 mt-1`}>Sistema de Gestão</p>
        </div>
        
        <div className="md:hidden">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            aria-label="Fechar menu"
            className={`h-8 w-8 hover:bg-white/10`}
          >
            <X className="h-4 w-4 text-white" />
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
              `flex items-center space-x-3 p-2 rounded-md hover:bg-white/10 transition-colors ${
                isActive
                  ? `bg-white/20 font-medium`
                  : ""
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 flex-shrink-0 ${getTextColor()}`} />
                <span className={`truncate ${getTextColor()}`}>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      <UserProfile />
      
      <div className={`p-4 border-t ${getBorderColor()} flex justify-between items-center`}>
        <p className={`text-xs ${getTextColor()} opacity-80`}>&copy; 2025 Closet Manager</p>
        <ThemeToggle />
      </div>
    </div>
  );
};

export default Sidebar;
