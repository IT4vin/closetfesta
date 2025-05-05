
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
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

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleNavigation = () => {
    setIsOpen(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10"
          aria-label="Abrir menu"
        >
          <Menu className={`h-5 w-5 text-${colorScheme}-600`} />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[90vh] pt-2 flex flex-col">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
          <div>
            <h1 className={`text-xl font-bold text-${colorScheme}-600`}>Closet Manager</h1>
            <p className="text-xs text-neutral-500 mt-1">Sistema de Gestão</p>
          </div>
          
          <DrawerClose asChild>
            <Button 
              variant="ghost" 
              size="icon"
              aria-label="Fechar menu"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </Button>
          </DrawerClose>
        </div>
        
        <nav className="flex-1 p-2 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={handleNavigation}
              className={({ isActive }) =>
                `flex items-center space-x-3 p-3 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
                  isActive
                    ? `bg-${colorScheme}-50 text-${colorScheme}-800 dark:bg-neutral-800 dark:text-${colorScheme}-400 font-medium`
                    : ""
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? `text-${colorScheme}-600 dark:text-${colorScheme}-400` : ""}`} />
                  <span className="truncate">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 text-center">
          <p className="text-xs text-neutral-500">&copy; 2025 Closet Manager</p>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileMenu;
