import React, { createContext, useContext, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@/lib/permissions";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  updateEmail: (email: string, password: string) => Promise<boolean>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isLoading, isAuthenticated, login, logout } = useAuthStore();
  const { toast } = useToast();

  const updateEmail = async (email: string, _password: string) => {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      toast({ title: "Erro ao atualizar email", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Email atualizado", description: "Verifique sua caixa de entrada se necessário." });
    return true;
  };

  const updatePassword = async (_current: string, newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Erro ao atualizar senha", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Senha atualizada com sucesso" });
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: isLoading,
        isAuthenticated,
        login: async (e, p) => login(e, p),
        logout: () => { void logout(); },
        updateEmail,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
