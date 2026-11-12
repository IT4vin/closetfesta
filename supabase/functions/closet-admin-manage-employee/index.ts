import { withSupabase } from "npm:@supabase/server@1";

const origins = new Set([
  "https://closet-festa-administrativo.onrender.com",
  "https://sistema.closetfesta.com.br",
  "https://www.sistema.closetfesta.com.br"
]);
const fallbackOrigin = "https://closet-festa-administrativo.onrender.com";
function headers(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && origins.has(origin) ? origin : fallbackOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin"
  };
}
function reply(data: Record<string, unknown>, status: number, origin: string | null) {
  return new Response(JSON.stringify(data), { status, headers: headers(origin) });
}
const isUsername = (s: string) => /^[a-z0-9][a-z0-9._-]{2,31}$/.test(s);
const isStrongPassword = (s: string) =>
  s.length >= 12 && s.length <= 72 && new TextEncoder().encode(s).byteLength <= 72 &&
  /\p{L}/u.test(s) && /\d/u.test(s);
const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const handler = withSupabase({ auth: "user" }, async (req, ctx) => {
  const origin = req.headers.get("origin");
  if (req.method !== "POST") return reply({ error: "Método não permitido." },405,origin);
  if (origin && !origins.has(origin)) return reply({ error: "Origem não autorizada." },403,origin);
  const actorId = ctx.userClaims?.id;
  if (!actorId) return reply({ error: "Sessão não autenticada." },401,origin);
  // Authorization is from the database, never from user_metadata or request body.
  const { data: roles, error: roleError } = await ctx.supabase
    .from("user_roles").select("role").eq("user_id",actorId).eq("role","admin").limit(1);
  if (roleError || !roles?.length) return reply({ error: "Apenas administradores podem gerenciar credenciais." },403,origin);

  let body: Record<string,unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 7000) return reply({ error: "Dados excedem o limite." },413,origin);
    body = JSON.parse(raw);
    if (!body || Array.isArray(body) || typeof body !== "object") throw new Error("invalid");
  } catch { return reply({ error: "Dados inválidos." },400,origin); }

  const action = String(body.action || "");
  const username = String(body.username || "").trim().toLowerCase();
  if (!isUsername(username)) return reply({ error: "Usuário: 3 a 32 caracteres, com letras minúsculas, números, ponto, hífen ou _." },400,origin);
  const loginEmail = username + "@closetmanager.local";

  if (action === "create") {
    const fullName = String(body.full_name || "").trim();
    const password = typeof body.password === "string" ? body.password : "";
    const role = String(body.role || "");
    const phone = String(body.phone || "").replace(/\D/g, "");
    const department = String(body.department || "").trim();
    const jobTitle = String(body.job_title || "").trim();
    const hiredOn = body.hired_on ? String(body.hired_on) : null;
    const contactEmail = String(body.contact_email || "").trim().toLowerCase();
    if (fullName.length < 2 || fullName.length > 140 ||
        !isStrongPassword(password) || !["staff","cashier","manager"].includes(role) ||
        (phone && ![10,11].includes(phone.length)) ||
        department.length > 100 || jobTitle.length > 100 ||
        (hiredOn !== null && !/^\d{4}-\d{2}-\d{2}$/.test(hiredOn)) ||
        (contactEmail && (contactEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)))) {
      return reply({ error: "Confira os dados. Senha: 12 a 72 caracteres, incluindo letras e números." },400,origin);
    }

    const created = await ctx.supabaseAdmin.auth.admin.createUser({
      email: loginEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });
    if (created.error || !created.data?.user?.id) {
      return reply({ error: "Não foi possível criar a conta. Verifique se o usuário já existe." },409,origin);
    }
    const targetId = created.data.user.id;
    // Creation is fail-closed: if role or profile cannot be configured, revoke the new account.
    const assigned = await ctx.supabase.rpc("closet_assign_user_role", {
      p_target: targetId, p_role: role
    });
    const profile = assigned.error ? null : await ctx.supabase.rpc("closet_employee_update", {
      p_target: targetId, p_full_name: fullName,
      p_phone: phone || null, p_department: department || null,
      p_job_title: jobTitle || null, p_hired_on: hiredOn
    });
    const contact = !assigned.error && !profile?.error && contactEmail
      ? await ctx.supabaseAdmin.from("profiles").update({ email: contactEmail }).eq("id",targetId)
      : null;
    if (assigned.error || profile?.error || contact?.error) {
      const removed = await ctx.supabaseAdmin.auth.admin.deleteUser(targetId);
      return reply({
        error: removed.error
          ? "Conta criada parcialmente. A configuração falhou e precisa de revisão administrativa."
          : "Falha ao configurar perfil; conta criada foi desfeita.",
        ...(removed.error ? { user_id: targetId, partial: true } : {})
      },500,origin);
    }
    // Audit contains only actor, target and outcome; never the password.
    await ctx.supabaseAdmin.from("closet_employee_password_audit")
      .insert({ actor_id: actorId, target_id: targetId, status: "changed", finished_at: new Date().toISOString() });
    return reply({ created: true, user_id: targetId, username, message: "Funcionário cadastrado com usuário e senha." },200,origin);
  }

  if (action === "set_username") {
    const targetId = String(body.target_id || "");
    if (!isUuid(targetId) || targetId === actorId) {
      return reply({ error: "Selecione outro funcionário válido." },400,origin);
    }
    const existing = await ctx.supabaseAdmin.auth.admin.getUserById(targetId);
    const account = existing.data?.user;
    if (existing.error || !account?.id) return reply({ error: "Funcionário não encontrado no Auth." },404,origin);
    if (account.email?.toLowerCase() === loginEmail) return reply({ updated: true, username },200,origin);

    // Preserve contact email from existing account before changing the login alias.
    const oldLogin = account.email || "";
    const { data: currentProfile } = await ctx.supabaseAdmin
      .from("profiles").select("email").eq("id",targetId).maybeSingle();
    if (!currentProfile?.email && oldLogin && !oldLogin.endsWith("@closetmanager.local")) {
      const saved = await ctx.supabaseAdmin.from("profiles").update({ email: oldLogin }).eq("id",targetId);
      if (saved.error) return reply({ error: "Não foi possível preservar o e-mail de contato." },500,origin);
    }
    const updated = await ctx.supabaseAdmin.auth.admin.updateUserById(targetId,{
      email: loginEmail, email_confirm: true
    });
    if (updated.error || updated.data?.user?.email?.toLowerCase() !== loginEmail) {
      return reply({ error: "Usuário em uso ou alteração recusada pelo Supabase Auth." },409,origin);
    }
    const { error: auditError } = await ctx.supabaseAdmin
      .from("closet_employee_login_audit")
      .insert({ actor_id: actorId, target_id: targetId, previous_username: oldLogin, new_username: username });
    return reply({
      updated:true,username,audit_confirmed:!auditError,
      message: auditError ? "Login alterado; verifique a auditoria." : "Nome de usuário atualizado."
    },200,origin);
  }
  return reply({ error: "Ação desconhecida." },400,origin);
});

export default {
  fetch: (req: Request) => {
    const origin = req.headers.get("origin");
    if (req.method === "OPTIONS") return new Response(null,{
      status: origin && !origins.has(origin) ? 403 : 204,
      headers: headers(origin)
    });
    return handler(req);
  }
};