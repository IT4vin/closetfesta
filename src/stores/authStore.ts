import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import PermissionManager, { User, SessionData } from '@/lib/permissions';

interface AuthState {
  // Estado
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastActivity: Date | null;
  
  // Ações
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshSession: () => void;
  clearError: () => void;
  updateActivity: () => void;
  
  // Listeners internos
  initialize: () => void;
  handleSessionExpiry: () => void;
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set, get) => ({
    // Estado inicial
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    lastActivity: null,

    // Inicializar store
    initialize: () => {
      try {
        console.log('🔧 Inicializando AuthStore...');
        
        // Inicializar PermissionManager
        PermissionManager.initialize();
        
        // Verificar sessão existente
        const session = PermissionManager.getCurrentSession();
        
        if (session) {
          set({
            user: session.user,
            isAuthenticated: true,
            lastActivity: new Date(session.last_activity),
            error: null,
          });
          console.log('✅ Sessão existente encontrada:', session.user.username);
        } else {
          set({
            user: null,
            isAuthenticated: false,
            lastActivity: null,
            error: null,
          });
          console.log('ℹ️ Nenhuma sessão ativa encontrada');
        }
      } catch (error) {
        console.error('❌ Erro na inicialização do AuthStore:', error);
        set({
          error: (error as Error).message,
          isAuthenticated: false,
          user: null,
        });
      } finally {
        set({ isLoading: false });
      }
    },

    // Login
    login: async (username: string, password: string) => {
      set({ isLoading: true, error: null });
      
      try {
        console.log('🔑 Tentativa de login via AuthStore:', username);
        
        const session = await PermissionManager.login(username, password);
        
        set({
          user: session.user,
          isAuthenticated: true,
          lastActivity: new Date(session.last_activity),
          error: null,
          isLoading: false,
        });
        
        console.log('✅ Login bem-sucedido via AuthStore');
        return true;
        
      } catch (error) {
        console.error('❌ Erro de login via AuthStore:', error);
        set({
          error: (error as Error).message,
          isAuthenticated: false,
          user: null,
          isLoading: false,
        });
        return false;
      }
    },

    // Logout
    logout: () => {
      try {
        console.log('🚪 Logout via AuthStore...');
        
        // Chamar logout do PermissionManager
        PermissionManager.logout();
        
        // Atualizar estado local
        set({
          user: null,
          isAuthenticated: false,
          lastActivity: null,
          error: null,
        });
        
        console.log('✅ Logout concluído via AuthStore');
        
      } catch (error) {
        console.error('❌ Erro no logout via AuthStore:', error);
        // Forçar limpeza do estado mesmo com erro
        set({
          user: null,
          isAuthenticated: false,
          lastActivity: null,
          error: 'Erro no logout',
        });
        
        // Fallback: recarregar página
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    },

    // Atualizar sessão
    refreshSession: () => {
      const session = PermissionManager.getCurrentSession();
      
      if (session) {
        set({
          user: session.user,
          isAuthenticated: true,
          lastActivity: new Date(session.last_activity),
          error: null,
        });
      } else {
        const currentState = get();
        if (currentState.isAuthenticated) {
          console.log('🔍 Sessão expirada detectada, fazendo logout...');
          get().handleSessionExpiry();
        }
      }
    },

    // Lidar com expiração de sessão
    handleSessionExpiry: () => {
      console.log('⏰ Sessão expirada, fazendo logout automático...');
      set({
        user: null,
        isAuthenticated: false,
        lastActivity: null,
        error: 'Sessão expirada',
      });
    },

    // Limpar erro
    clearError: () => {
      set({ error: null });
    },

    // Atualizar atividade
    updateActivity: () => {
      PermissionManager.updateLastActivity();
      set({ lastActivity: new Date() });
    },
  }))
);

// Hook para subscrever apenas autenticação
export const useAuth = () => {
  const { isAuthenticated, user, isLoading, error } = useAuthStore();
  return { isAuthenticated, user, isLoading, error };
};

// Hook para ações de autenticação
export const useAuthActions = () => {
  const { login, logout, clearError, updateActivity } = useAuthStore();
  return { login, logout, clearError, updateActivity };
};

// Inicialização automática da store
let isInitialized = false;

export const initializeAuthStore = () => {
  if (!isInitialized) {
    useAuthStore.getState().initialize();
    
    // Configurar verificação periódica
    setInterval(() => {
      useAuthStore.getState().refreshSession();
    }, 5000); // Verificar a cada 5 segundos
    
    // Listener para eventos de logout do PermissionManager
    window.addEventListener('user-logout', () => {
      console.log('📡 Evento user-logout recebido na AuthStore');
      useAuthStore.getState().logout();
    });
    
    isInitialized = true;
    console.log('🚀 AuthStore inicializada e configurada');
  }
}; 