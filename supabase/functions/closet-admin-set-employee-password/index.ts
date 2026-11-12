// Somente administradores podem atribuir/redefinir senhas de contas do PDV.
// A senha transita diretamente por HTTPS ao Supabase Auth Admin, sem persistencia
// em profiles, funcionarios, auditoria, analytics ou logs.
import { withSupabase } from "npm:@supabase/server@1";

const appOrigin = "https://closet-festa-administrativo.onrender.com";
const allowedOrigins = new Set([
  "https://closet-festa-administrativo.onrender.com",
  "https://sistema.closetfesta.com.br",
  "https://www.sistema.closetfesta.com.br"
]);
const corsHeaders = {
  "Access-Control-Allow-Origin": appOrigin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "no-store",
  "Pragma": "no-cache",
  "Content-Type": "application/json; charset=utf-8",
  "Vary": "Origin",
};
const respond = (data: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: corsHeaders });

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const handle = withSupabase({ auth: "user" }, async (req, ctx) => {
  if (req.method !== "POST") return respond({ error: "Método não permitido." }, 405);
  const origin = req.headers.get("origin");
  if (origin && !allowedOrigins.has(origin)) {
    return respond({ error: "Origem não autorizada." }, 403);
  }
  if (!(req.headers.get("content-type") || "").includes("application/json")) {
    return respond({ error: "Envie os dados no formato JSON." }, 415);
  }

  const actorId = ctx.userClaims?.id;
  if (!actorId) return respond({ error: "Sessão não autenticada." }, 401);

  // A checagem usa o banco atual, nao claims ou metadados manipulaveis.
  const { data: adminRoles, error: roleError } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", actorId)
    .eq("role", "admin")
    .limit(1);
  if (roleError || !adminRoles?.length) {
    return respond({ error: "Somente administradores podem alterar senhas." }, 403);
  }

  let data: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 2500) return respond({ error: "Dados excedem o limite permitido." }, 413);
    data = JSON.parse(raw);
  } catch {
    return respond({ error: "Dados de redefinição inválidos." }, 400);
  }
  if (!data || Array.isArray(data) || typeof data !== "object") {
    return respond({ error: "Dados de redefinição inválidos." }, 400);
  }

  const targetId = typeof data.target_id === "string" ? data.target_id : "";
  const password = typeof data.password === "string" ? data.password : "";
  if (!uuidPattern.test(targetId)) {
    return respond({ error: "Selecione um funcionário válido." }, 400);
  }
  if (
    password.length < 12 || password.length > 72 ||
    new TextEncoder().encode(password).byteLength > 72 ||
    !/\p{L}/u.test(password) || !/\d/u.test(password)
  ) {
    return respond({
      error: "Use uma senha de 12 a 72 caracteres, contendo letras e números.",
    }, 400);
  }

  // Nunca mudar e-mail, perfil ou confirmacao de e-mail neste fluxo.
  const existing = await ctx.supabaseAdmin.auth.admin.getUserById(targetId);
  if (existing.error || !existing.data?.user?.id) {
    return respond({ error: "Conta de login não encontrada no Supabase Auth." }, 404);
  }

  // Falha de auditoria impede alterar a credencial (fail-closed).
  const { data: audit, error: auditError } = await ctx.supabaseAdmin
    .from("closet_employee_password_audit")
    .insert({ actor_id: actorId, target_id: targetId, status: "started" })
    .select("id")
    .single();
  if (auditError || !audit?.id) {
    return respond({ error: "Não foi possível iniciar o registro de auditoria. Senha não alterada." }, 500);
  }

  const changed = await ctx.supabaseAdmin.auth.admin.updateUserById(targetId, { password });
  const updated = !changed.error && changed.data?.user?.id === targetId;

  const { error: auditFinalError } = await ctx.supabaseAdmin
    .from("closet_employee_password_audit")
    .update({
      status: updated ? "changed" : "failed",
      finished_at: new Date().toISOString(),
    })
    .eq("id", audit.id);

  if (!updated) {
    return respond({ error: "O Supabase Auth não confirmou a nova senha. Tente novamente." }, 502);
  }
  if (auditFinalError) {
    // A alteração já ocorreu no Auth. Não solicitar repetição inconsciente.
    return respond({
      updated: true,
      user_id: targetId,
      audit_confirmed: false,
      message: "Senha atualizada; registro final da auditoria precisa de verificação.",
    });
  }
  return respond({
    updated: true,
    user_id: targetId,
    audit_confirmed: true,
    message: "Senha de login atualizada no Supabase Auth.",
  });
});

export default {
  fetch: async (req: Request) => {
    const origin = req.headers.get("origin");
    if (origin && !allowedOrigins.has(origin)) return new Response(null,{status:403});
    if (req.method === "OPTIONS") {
      return new Response(null, {status: 204, headers: {...corsHeaders,
        "Access-Control-Allow-Origin": origin || appOrigin}});
    }
    const response = await handle(req);
    response.headers.set("Access-Control-Allow-Origin",origin || appOrigin);
    return response;
  }
};