// Shim de compatibilidade: a antiga camada de permissões foi substituída
// por Supabase Auth + tabela `user_roles`. Mantemos a mesma superfície de API
// usada pelo restante do código (PermissionManager.login, isAuthenticated, etc.)
// para evitar uma refatoração em todo o app.

import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "manager" | "seller" | "viewer";

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

const ROLE_LEVELS: Record<AppRole, number> = {
  admin: 1,
  manager: 2,
  seller: 3,
  viewer: 4,
};

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  manager: "Gerente",
  seller: "Vendedor",
  viewer: "Visualizador",
};

function buildUser(
  authUser: { id: string; email?: string | null; user_metadata?: any },
  role: AppRole,
  fullName?: string,
): User {
  return {
    id: authUser.id,
    username: authUser.email?.split("@")[0] ?? authUser.id,
    email: authUser.email ?? "",
    full_name: fullName ?? authUser.user_metadata?.full_name ?? authUser.email ?? "",
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

async function fetchRole(userId: string): Promise<AppRole> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role as AppRole);
  if (roles.includes("admin")) return "admin";
  if (roles.includes("manager")) return "manager";
  if (roles.includes("seller")) return "seller";
  return (roles[0] as AppRole) ?? "viewer";
}

async function buildSessionFromSupabase(): Promise<SessionData | null> {
  const { data } = await supabase.auth.getSession();
  const s = data.session;
  if (!s) return null;
  const role = await fetchRole(s.user.id);

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
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        cachedSession = null;
        window.dispatchEvent(new CustomEvent("user-logout"));
      } else {
        await buildSessionFromSupabase();
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
    if (!session) throw new Error("Não foi possível iniciar a sessão.");
    return session;
  },

  async logout() {
    await supabase.auth.signOut();
    cachedSession = null;
  },

  isAuthenticated(): boolean {
    return !!cachedSession;
  },

  getCurrentSession(): SessionData | null {
    return cachedSession;
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

  hasPermission(_resource: string, _action: string): boolean {
    return !!cachedSession;
  },
};

export default PermissionManager;
