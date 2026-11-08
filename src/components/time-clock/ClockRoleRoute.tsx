import React from "react";
import {Navigate} from "react-router-dom";
import {useAuth} from "@/stores/authStore";
import {hasRolePermission} from "@/lib/accessControl";

export default function ClockRoleRoute({action,children}:{
 action:"read"|"punch"|"manage";children:React.ReactNode;
}){
 const {user,isLoading}=useAuth();
 if(isLoading)return <div role="status" className="p-6 text-sm">Validando acesso ao controle de ponto...</div>;
 if(!user||!hasRolePermission(user.role?.id,"timeClock",action))
  return <Navigate to="/" replace/>;
 return <>{children}</>;
}
