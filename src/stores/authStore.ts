import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";
import PermissionManager, { User, SessionData } from "@/lib/permissions";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastActivity: Date | null;

  login: (identifier: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, fullName?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
  updateActivity: () => void;

  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    lastActivity: null,

    initialize: async () => {
      try {
        await PermissionManager.initialize();
        const session = PermissionManager.getCurrentSession();
        if (session) {
          set({
            user: session.user,
            isAuthenticated: true,
            lastActivity: new Date(session.last_activity),
            error: null,
          });
        } else {
          set({ user: null, isAuthenticated: false, error: null });
        }
      } catch (error) {
        set({ error: (error as Error).message, isAuthenticated: false, user: null });
      } finally {
        set({ isLoading: false });
      }
    },

    login: async (identifier, password) => {
      set({ isLoading: true, error: null });
      try {
        const session = await PermissionManager.login(identifier, password);
        set({
          user: session.user,
          isAuthenticated: true,
          lastActivity: new Date(session.last_activity),
          isLoading: false,
        });
        return true;
      } catch (error) {
        set({
          error: (error as Error).message,
          isAuthenticated: false,
          user: null,
          isLoading: false,
        });
        return false;
      }
    },

    signup: async (email, password, fullName) => {
      set({ isLoading: true, error: null });
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName ?? email },
          },
        });
        if (error) throw error;
        // Auto-confirm habilitado: tenta login direto
        const ok = await get().login(email, password);
        return ok;
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        return false;
      }
    },

    logout: async () => {
      try {
        await PermissionManager.logout();
      } finally {
        set({ user: null, isAuthenticated: false, lastActivity: null, error: null });
      }
    },

    refreshSession: async () => {
      const session = PermissionManager.getCurrentSession();
      if (session) {
        set({
          user: session.user,
          isAuthenticated: true,
          lastActivity: new Date(session.last_activity),
        });
      } else if (get().isAuthenticated) {
        set({ user: null, isAuthenticated: false, error: "Sessão expirada" });
      }
    },

    clearError: () => set({ error: null }),
    updateActivity: () => {
      PermissionManager.updateLastActivity();
      set({ lastActivity: new Date() });
    },
  })),
);

export const useAuth = () => {
  const { isAuthenticated, user, isLoading, error } = useAuthStore();
  return { isAuthenticated, user, isLoading, error };
};

export const useAuthActions = () => {
  const { login, signup, logout, clearError, updateActivity } = useAuthStore();
  return { login, signup, logout, clearError, updateActivity };
};

let isInitialized = false;
export const initializeAuthStore = () => {
  if (isInitialized) return;
  isInitialized = true;
  void useAuthStore.getState().initialize();
  window.addEventListener("user-logout", () => {
    useAuthStore.getState().logout();
  });
};
