import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type ClosetSettingsSection =
  | "company" | "operations" | "payments" | "documents"
  | "permissions" | "messages" | "goals" | "tax";

export type ClosetSettingValues = Record<string, string | number | boolean>;
const prefix = "closet_festa.config.v1.";

function isSettingValues(value: unknown): value is ClosetSettingValues {
  return !!value && typeof value === "object" && !Array.isArray(value) &&
    Object.values(value).every(item =>
      typeof item === "string" || typeof item === "number" || typeof item === "boolean");
}

export function closetSettingsKey(section: ClosetSettingsSection): string {
  return prefix + section;
}

/**
 * Configurações compartilhadas entre usuários com acesso administrativo.
 * Nunca retorna dados demonstrativos como se fossem dados cadastrados.
 * O Supabase aplica as policies RLS da tabela public.settings.
 */
export async function loadClosetSettings(section: ClosetSettingsSection): Promise<ClosetSettingValues> {
  const { data, error } = await supabase.from("settings")
    .select("value")
    .eq("key", closetSettingsKey(section))
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar as configurações: " + error.message);
  if (!data) return {};
  if (!isSettingValues(data.value)) {
    throw new Error("O formato das configurações cadastradas é inválido. Nenhum dado foi alterado.");
  }
  return { ...data.value };
}

export async function saveClosetSettings(
  section: ClosetSettingsSection,
  values: ClosetSettingValues,
): Promise<ClosetSettingValues> {
  if (!isSettingValues(values)) throw new Error("Valores inválidos nas configurações.");
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Sua sessão expirou. Entre novamente.");
  const { data, error } = await supabase.from("settings").upsert({
    key: closetSettingsKey(section),
    value: values as Json,
    updated_by: auth.user.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: "key" }).select("value").single();
  if (error || !data) throw new Error("Não foi possível salvar: " + (error?.message ?? "gravação não confirmada"));
  if (!isSettingValues(data.value)) throw new Error("O banco retornou configurações em formato inesperado.");
  return { ...data.value };
}
