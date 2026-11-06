/**
 * Permissões de interface — não substituem políticas RLS no Supabase.
 * Quando uma permissão não estiver explicitamente definida, o acesso é negado.
 */
export type AppRole = "admin" | "manager" | "staff" | "cashier" | "viewer";

export const ROLE_LEVELS: Record<AppRole, number> = {
  admin: 1,
  manager: 2,
  staff: 3,
  cashier: 3,
  viewer: 4,
};

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  manager: "Gerente",
  staff: "Vendedor / atendimento",
  cashier: "Operador de caixa",
  viewer: "Sem acesso",
};

type PermissionMatrix = Readonly<Record<string, readonly string[]>>;

// Recursos conhecidos. Ações não cadastradas são negadas inclusive para administradores.
const ADMIN_ACTIONS: PermissionMatrix = {
  orders: ["read", "create", "update", "delete", "return", "cancel", "approve"],
  reservations: ["read", "create", "update", "delete", "cancel", "approve"],
  products: ["read", "create", "update", "delete"],
  clients: ["read", "create", "update", "delete"],
  cash: ["read", "create", "update", "delete", "close"],
  financial: ["read", "create", "update", "delete", "approve"],
  payments: ["read", "create", "update", "cancel", "refund"],
  inventory: ["read", "create", "update", "delete"],
  reports: ["read", "export"],
  settings: ["read", "update"],
  users: ["read", "create", "update", "delete"],
};

const PERMISSIONS: Record<AppRole, PermissionMatrix> = {
  admin: ADMIN_ACTIONS,
  manager: {
    orders: ADMIN_ACTIONS.orders,
    reservations: ADMIN_ACTIONS.reservations,
    products: ADMIN_ACTIONS.products,
    clients: ADMIN_ACTIONS.clients,
    cash: ADMIN_ACTIONS.cash,
    financial: ADMIN_ACTIONS.financial,
    payments: ADMIN_ACTIONS.payments,
    inventory: ADMIN_ACTIONS.inventory,
    reports: ADMIN_ACTIONS.reports,
    settings: ["read"],
    users: ["read"],
  },
  staff: {
    orders: ["read", "create", "update"],
    reservations: ["read", "create", "update"],
    products: ["read"],
    clients: ["read", "create", "update"],
    inventory: ["read"],
  },
  cashier: {
    orders: ["read", "create"],
    products: ["read"],
    clients: ["read", "create"],
    cash: ["read", "create", "update", "close"],
    payments: ["read", "create"],
    reports: ["read"],
  },
  viewer: {},
};

/** Precedência explícita e alinhada ao enum public.app_role das migrations. */
export function resolveAppRole(roles: readonly string[]): AppRole {
  for (const role of ["admin", "manager", "staff", "cashier"] as const) {
    if (roles.includes(role)) return role;
  }
  return "viewer";
}

export function hasRolePermission(
  role: string | null | undefined,
  resource: string,
  action: string,
): boolean {
  if (!role || !resource || !action) return false;
  const knownRole = role as AppRole;
  const allowedActions = PERMISSIONS[knownRole]?.[resource];
  return allowedActions?.includes(action) ?? false;
}
