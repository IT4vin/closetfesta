
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Calendar, 
  Package, 
  Users, 
  DollarSign, 
  BarChart3, 
  Settings, 
  Menu, 
  X
} from "lucide-react";

interface SidebarProps {
  onToggle?: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onToggle }) => {
  const location = useLocation();
  const [expanded, setExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setExpanded(false);
      } else {
        setExpanded(true);
      }
    };

    // Initial check
    checkIsMobile();

    // Add event listener
    window.addEventListener("resize", checkIsMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  useEffect(() => {
    // Notify parent component when sidebar state changes
    if (onToggle) {
      onToggle(expanded);
    }
  }, [expanded, onToggle]);

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  const menuItems = [
    { name: "Dashboard", path: "/", icon: <Home size={20} /> },
    { name: "Agenda", path: "/calendar", icon: <Calendar size={20} /> },
    { name: "Produtos", path: "/products", icon: <Package size={20} /> },
    { name: "Clientes", path: "/clients", icon: <Users size={20} /> },
    { name: "Financeiro", path: "/financial", icon: <DollarSign size={20} /> },
    { name: "Relatórios", path: "/reports", icon: <BarChart3 size={20} /> },
    { name: "Configurações", path: "/settings", icon: <Settings size={20} /> },
  ];

  return (
    <>
      <button 
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 md:hidden bg-white p-2 rounded-full shadow-md text-neutral-800"
      >
        {expanded ? <X size={20} /> : <Menu size={20} />}
      </button>
      
      <aside 
        className={`${
          expanded ? "translate-x-0" : "-translate-x-full"
        } fixed md:relative z-40 h-screen bg-sidebar transition-transform duration-300 ease-in-out md:translate-x-0 shadow-xl w-64`}
      >
        <div className="flex flex-col h-full">
          <div className="px-4 py-8 flex items-center justify-center border-b border-sidebar-border">
            <h1 className="text-2xl font-montserrat font-semibold text-white">
              Closet
            </h1>
          </div>

          <div className="flex-1 py-6 flex flex-col gap-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item ${
                  location.pathname === item.path ? "active" : ""
                }`}
              >
                {item.icon}
                <span className="text-sm">{item.name}</span>
              </Link>
            ))}
          </div>

          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-marsala-400 flex items-center justify-center text-white font-semibold">
                A
              </div>
              <div>
                <p className="text-sm text-white">Admin</p>
                <p className="text-xs text-white/70">Administrador</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
