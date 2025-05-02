
import React from "react";
import { NavLink } from "react-router-dom";
import { BarChart, Users, ShoppingBag, Calendar, Wallet, LineChart, Settings, ShoppingCart } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import UserProfile from "./UserProfile";

const Sidebar = () => {
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
    <div className="h-full w-64 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col">
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="text-xl font-bold text-marsala">Closet Manager</h1>
        <p className="text-xs text-neutral-500 mt-1">Sistema de Gestão</p>
      </div>
      
      <nav className="flex-1 p-2 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center space-x-3 p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
                isActive
                  ? "bg-neutral-100 dark:bg-neutral-800 font-medium"
                  : ""
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
      
      <UserProfile />
      
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
        <p className="text-xs text-neutral-500">&copy; 2025 Closet Manager</p>
        <ThemeToggle />
      </div>
    </div>
  );
};

export default Sidebar;
