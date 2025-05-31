import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import PermissionManager from "@/lib/permissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  
  // Verificar se está autenticado usando o PermissionManager
  const isAuthenticated = PermissionManager.isAuthenticated();
  const session = PermissionManager.getCurrentSession();

  // Se não estiver autenticado, mostrar loading enquanto o App.tsx gerencia o redirecionamento
  if (!isAuthenticated || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-marsala mx-auto mb-4" />
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Renderizar o conteúdo protegido
  return <>{children}</>;
};

export default ProtectedRoute;
