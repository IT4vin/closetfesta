-- Registro auditavel de definicoes/redefinicoes de senha por administradores.
-- Nenhuma senha, hash ou token eh armazenado nesta tabela.
CREATE TABLE IF NOT EXISTS public.closet_employee_password_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  target_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'started'
    CHECK (status IN ('started','changed','failed')),
  requested_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS closet_employee_password_audit_target_date
  ON public.closet_employee_password_audit(target_id,requested_at DESC);

ALTER TABLE public.closet_employee_password_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.closet_employee_password_audit FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.closet_employee_password_audit TO authenticated;

DROP POLICY IF EXISTS "Somente admin consulta redefinicoes de senha"
  ON public.closet_employee_password_audit;
CREATE POLICY "Somente admin consulta redefinicoes de senha"
  ON public.closet_employee_password_audit
  FOR SELECT TO authenticated
  USING (
    public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

COMMENT ON TABLE public.closet_employee_password_audit IS
  'Historico de redefinicoes de senha via Supabase Auth Admin; nunca armazena credenciais.';
