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

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated || !session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Renderizar o conteúdo protegido
  return <>{children}</>;
};

export default ProtectedRoute;
