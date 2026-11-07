import { describe, expect, it } from "vitest";
import { hasRolePermission, resolveAppRole } from "@/lib/accessControl";

describe("controle de acesso (frontend — não substitui RLS)", () => {
  it("usa apenas papéis existentes no schema Supabase", () => {
    expect(resolveAppRole(["staff"])).toBe("staff");
    expect(resolveAppRole(["cashier"])).toBe("cashier");
    expect(resolveAppRole(["cashier", "manager"])).toBe("manager");
    expect(resolveAppRole(["seller"])).toBe("viewer");
    expect(resolveAppRole([])).toBe("viewer");
  });

  it("restringe ações críticas a perfis autorizados", () => {
    expect(hasRolePermission("admin", "users", "delete")).toBe(true);
    expect(hasRolePermission("manager", "financial", "read")).toBe(true);
    expect(hasRolePermission("staff", "orders", "create")).toBe(true);
    expect(hasRolePermission("admin", "schedule", "create")).toBe(true);
    expect(hasRolePermission("manager", "schedule", "create")).toBe(true);
    expect(hasRolePermission("staff", "schedule", "create")).toBe(true);
    expect(hasRolePermission("cashier", "schedule", "read")).toBe(true);
    expect(hasRolePermission("cashier", "schedule", "create")).toBe(false);
    expect(hasRolePermission("staff", "financial", "delete")).toBe(false);
    expect(hasRolePermission("cashier", "payments", "create")).toBe(true);
    expect(hasRolePermission("cashier", "products", "delete")).toBe(false);
    expect(hasRolePermission("viewer", "orders", "read")).toBe(false);
  });

  it("nega papéis, recursos e ações desconhecidos por padrão", () => {
    expect(hasRolePermission(null, "orders", "read")).toBe(false);
    expect(hasRolePermission("seller", "orders", "create")).toBe(false);
    expect(hasRolePermission("admin", "unknown", "read")).toBe(false);
    expect(hasRolePermission("admin", "orders", "unknown")).toBe(false);
    expect(hasRolePermission("staff", "", "")).toBe(false);
  });
});
