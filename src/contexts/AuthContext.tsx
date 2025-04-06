
import React, { createContext, useState, useContext, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

// Definir o tipo de usuário
export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  avatar?: string;
}

// Definir o contexto de autenticação
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock de usuários para demonstração
const MOCK_USERS = [
  {
    id: "1",
    name: "Administrador",
    email: "admin@closetmanager.com",
    password: "admin123",
    role: "admin" as const,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  },
  {
    id: "2",
    name: "Usuário",
    email: "usuario@closetmanager.com",
    password: "user123",
    role: "user" as const,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lily",
  },
];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar se há um usuário salvo no sessionStorage
  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Erro ao recuperar usuário:", error);
        sessionStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  // Função para fazer login
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    // Simular atraso de rede
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      // Verificar se o usuário existe
      const foundUser = MOCK_USERS.find(
        (u) => u.email === email && u.password === password
      );
      
      if (foundUser) {
        // Remover senha antes de salvar
        const { password: _, ...userWithoutPassword } = foundUser;
        
        // Salvar no estado e no sessionStorage
        setUser(userWithoutPassword);
        sessionStorage.setItem("user", JSON.stringify(userWithoutPassword));
        
        toast({
          title: "Login bem-sucedido",
          description: `Bem-vindo, ${userWithoutPassword.name}!`,
        });
        
        return true;
      } else {
        toast({
          title: "Erro de autenticação",
          description: "Email ou senha incorretos",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      toast({
        title: "Erro de sistema",
        description: "Ocorreu um erro ao tentar fazer login",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Função para fazer logout
  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("user");
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
