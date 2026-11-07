// Shim de compatibilidade: a antiga camada de permissões foi substituída
// por Supabase Auth + tabela `user_roles`. Mantemos a mesma superfície de API
// usada pelo restante do código (PermissionManager.login, isAuthenticated, etc.)
// para evitar uma refatoração em todo o app.

import { supabase } from "@/integrations/supabase/client";
import { hasRolePermission, resolveAppRole, ROLE_LABELS, ROLE_LEVELS, type AppRole } from "@/lib/accessControl";

export type { AppRole } from "@/lib/accessControl";

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  name: string;
  avatar?: string;
  role: UserRole;
  status: "active" | "inactive" | "suspended";
  created_at: string;
  last_login?: string;
  permissions: Permission[];
  settings: UserSettings;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  level: number;
  permissions: Permission[];
}

export interface Permission {
  resource: string;
  actions: string[];
}

export interface UserSettings {
  theme: "light" | "dark" | "auto";
  language: "pt-BR" | "en-US";
  notifications: {
    email: boolean;
    push: boolean;
    rental_reminders: boolean;
    payment_alerts: boolean;
  };
  dashboard_preferences: {
    default_period: "7d" | "30d" | "90d" | "1y";
    widgets: string[];
  };
}

export interface SessionData {
  user: User;
  token: string;
  expires_at: string;
  last_activity: string;
  device_info: { user_agent: string; ip?: string };
}

function buildUser(
  authUser: { id: string; email?: string | null; user_metadata?: any },
  role: AppRole,
  fullName?: string,
): User {
  const display = fullName ?? authUser.user_metadata?.full_name ?? authUser.email ?? "";
  return {
    id: authUser.id,
    username: authUser.email?.split("@")[0] ?? authUser.id,
    email: authUser.email ?? "",
    full_name: display,
    name: display,
    status: "active",
    created_at: new Date().toISOString(),
    permissions: [],
    settings: {
      theme: "light",
      language: "pt-BR",
      notifications: {
        email: true,
        push: true,
        rental_reminders: true,
        payment_alerts: true,
      },
      dashboard_preferences: { default_period: "30d", widgets: [] },
    },
    role: {
      id: role,
      name: ROLE_LABELS[role],
      description: ROLE_LABELS[role],
      level: ROLE_LEVELS[role],
      permissions: [],
    },
  };
}

let cachedSession: SessionData | null = null;

function activeSession(): SessionData | null {
  if (!cachedSession) return null;
  if (Date.parse(cachedSession.expires_at) <= Date.now()) return null;
  return cachedSession;
}

async function fetchRole(userId: string): Promise<AppRole> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error("Não foi possível verificar as permissões deste usuário.");
  return resolveAppRole((data ?? []).map((entry) => entry.role));
}

async function buildSessionFromSupabase(): Promise<SessionData | null> {
  const { data } = await supabase.auth.getSession();
  const s = data.session;
  if (!s) return null;
  const role = await fetchRole(s.user.id);
  if (role === "viewer") {
    cachedSession = null;
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", s.user.id)
    .maybeSingle();

  const session: SessionData = {
    user: buildUser(s.user, role, profile?.full_name ?? undefined),
    token: s.access_token,
    expires_at: new Date((s.expires_at ?? 0) * 1000).toISOString(),
    last_activity: new Date().toISOString(),
    device_info: { user_agent: navigator.userAgent },
  };
  cachedSession = session;
  return session;
}

const PermissionManager = {
  async initialize() {
    await buildSessionFromSupabase();
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // defer async work to avoid deadlocks inside the callback
        setTimeout(() => { void buildSessionFromSupabase(); }, 0);
      } else {
        cachedSession = null;
        // Only broadcast on explicit sign-out — INITIAL_SESSION with no
        // session would otherwise trigger an infinite logout loop.
        if (event === "SIGNED_OUT") {
          window.dispatchEvent(new CustomEvent("user-logout"));
        }
      }
    });
  },

  async login(identifier: string, password: string): Promise<SessionData> {
    const email = identifier.includes("@")
      ? identifier
      : `${identifier}@closetmanager.local`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    const session = await buildSessionFromSupabase();
    if (!session) {
      await supabase.auth.signOut();
      throw new Error("Usuário sem perfil autorizado. Solicite acesso ao administrador.");
    }
    return session;
  },

  async logout() {
    await supabase.auth.signOut();
    cachedSession = null;
  },

  isAuthenticated(): boolean {
    return activeSession() !== null;
  },

  getCurrentSession(): SessionData | null {
    return activeSession();
  },

  updateLastActivity() {
    if (cachedSession) {
      cachedSession = {
        ...cachedSession,
        last_activity: new Date().toISOString(),
      };
    }
  },

  async resetSystem() {
    await supabase.auth.signOut();
    cachedSession = null;
  },

  hasPermission(resource: string, action: string): boolean {
    const session = activeSession();
    return session ? hasRolePermission(session.user.role.id, resource, action) : false;
  },

  getCurrentUser(): User | null {
    return activeSession()?.user ?? null;
  },
};

export function usePermissions() {
  return {
    user: PermissionManager.getCurrentUser(),
    hasPermission: (resource?: string, action?: string) =>
      resource !== undefined && action !== undefined
        ? PermissionManager.hasPermission(resource, action)
        : false,
    isAuthenticated: PermissionManager.isAuthenticated(),
    logout: () => PermissionManager.logout(),
  };
}

export default PermissionManager;
