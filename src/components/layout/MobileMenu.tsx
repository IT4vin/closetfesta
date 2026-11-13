import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/stores/authStore";
import {hasRolePermission} from "@/lib/accessControl";
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
  Clock3,
  CalendarClock,
  ClipboardList,
  X
} from "lucide-react";

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { colorScheme } = useTheme();
  const {user}=useAuth();
  const canClock=hasRolePermission(user?.role?.id,"timeClock","read");
  const canManageClock=hasRolePermission(user?.role?.id,"timeClock","manage");
  
  const navigation = [
    { name: "Dashboard", href: "/", icon: BarChart },
    { name: "Clientes", href: "/clients", icon: Users },
    { name: "Produtos", href: "/products", icon: ShoppingBag },
    { name: "Catálogo", href: "/catalog", icon: ShoppingBag },
    { name: "Agendamentos", href: "/calendar", icon: Calendar },
    { name: "Financeiro", href: "/financial", icon: Wallet },
    { name: "Estoque", href: "/inventory", icon: LineChart },
    { name: "PDV", href: "/pdv", icon: ShoppingCart },
    ...(canClock?[
      {name:"Bater Ponto",href:"/clock",icon:Clock3},
      {name:"Meu Banco de Horas",href:"/my-hours",icon:CalendarClock},
    ]:[]),
    ...(canManageClock?[
      {name:"Controle de Ponto",href:"/clock-admin",icon:ClipboardList},
    ]:[]),
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
          className="h-10 w-10 flex items-center justify-center"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5 text-marsala-600" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[90vh] pt-2 flex flex-col bg-marsala-900 text-white">
        <div className="relative flex items-start justify-center border-b border-marsala-800/30 px-4 py-3">
          <div className="flex flex-col items-center gap-1 text-center">
            <img src="/closet-festa-logo.svg" alt="Logo Closet Festa"
              width={76} height={76} className="h-[76px] w-[76px] object-contain" />
            <h1 className="sr-only">Closet Festa</h1>
            <p className="text-xs leading-tight text-marsala-200">Sistema de Gestão</p>
          </div>
          
          <DrawerClose asChild>
            <Button 
              variant="ghost" 
              size="icon"
              aria-label="Fechar menu"
              className="absolute right-2 top-2 h-8 w-8 flex items-center justify-center text-white hover:bg-marsala-800/50"
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
                `flex items-center space-x-3 px-3 py-3 rounded-md transition-colors ${
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
        
        <div className="p-4 border-t border-marsala-800/30 text-center">
          <p className="text-xs text-marsala-200">&copy; 2025 Closet Manager</p>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileMenu;
