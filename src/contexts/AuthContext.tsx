import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { api, User, checkTokenExpiry } from "@/services/api";

// Definir o contexto de autenticação
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

// Hook para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

// Provider do contexto
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Verificar se há um usuário autenticado ao carregar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar se há token no localStorage
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Tentar obter dados do usuário atual
        const userData = await api.getMe();
        setUser(userData);
        
        console.log('✅ Usuário autenticado:', userData.email);
      } catch (error) {
        console.log('ℹ️ Nenhuma sessão ativa encontrada');
        
        // Se houver erro de autenticação, limpar token
        if (error && typeof error === 'object' && 'status' in error) {
          checkTokenExpiry(error as any);
        }
        
        // Limpar dados locais
        localStorage.removeItem('auth_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Função para fazer login
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      console.log('🔑 Tentativa de login:', email);
      
      const result = await api.login(email, password);
      
      setUser(result.user);
      
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo, ${result.user.name}!`,
      });
      
      console.log('✅ Login realizado com sucesso:', result.user.email);
      return true;
      
    } catch (error) {
      console.error('❌ Erro de login:', error);
      
      let errorMessage = 'Erro ao fazer login';
      
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as any).message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro de autenticação",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar email
  const updateEmail = async (email: string, password: string): Promise<boolean> => {
    try {
      // Implementar quando o backend tiver endpoint para atualizar email
      console.log('🔄 Atualização de email não implementada ainda');
      
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "A atualização de email será implementada em breve",
        variant: "destructive",
      });
      
      return false;
    } catch (error) {
      console.error('❌ Erro ao atualizar email:', error);
      
      toast({
        title: "Erro ao atualizar email",
        description: "Ocorreu um erro ao tentar atualizar o email",
        variant: "destructive",
      });
      
      return false;
    }
  };
  
  // Função para atualizar senha
  const updatePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      // Implementar quando o backend tiver endpoint para atualizar senha
      console.log('🔄 Atualização de senha não implementada ainda');
      
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "A atualização de senha será implementada em breve",
        variant: "destructive",
      });
      
      return false;
    } catch (error) {
      console.error('❌ Erro ao atualizar senha:', error);
      
      toast({
        title: "Erro ao atualizar senha",
        description: "Ocorreu um erro ao tentar atualizar a senha",
        variant: "destructive",
      });
      
      return false;
    }
  };

  // Função para fazer logout
  const logout = () => {
    try {
      console.log('🚪 Fazendo logout...');
      
      // Limpar dados da API
      api.logout();
      
      // Limpar estado local
      setUser(null);
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
      
      console.log('✅ Logout concluído');
      
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      
      // Forçar limpeza mesmo com erro
      setUser(null);
      localStorage.removeItem('auth_token');
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        updateEmail,
        updatePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
