-- Rascunhos de PDV são dados privados do operador, não contratos nem reservas de estoque.
-- Um rascunho por operador; disponibilidade e preço são revalidados ao continuar.
CREATE TABLE IF NOT EXISTS public.pdv_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload)='object' AND pg_column_size(payload) < 131072),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pdv_drafts_owner_updated ON public.pdv_drafts(owner_id,updated_at DESC);
ALTER TABLE public.pdv_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pdv_drafts FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.pdv_drafts TO authenticated;
DROP POLICY IF EXISTS "Operator owns PDV drafts" ON public.pdv_drafts;
CREATE POLICY "Operator owns PDV drafts" ON public.pdv_drafts
 FOR ALL TO authenticated
 USING (owner_id=(select auth.uid()) AND (
   public.has_role((select auth.uid()),'admin') OR public.has_role((select auth.uid()),'manager')
   OR public.has_role((select auth.uid()),'staff') OR public.has_role((select auth.uid()),'cashier')
 ))
 WITH CHECK (owner_id=(select auth.uid()) AND (
   public.has_role((select auth.uid()),'admin') OR public.has_role((select auth.uid()),'manager')
   OR public.has_role((select auth.uid()),'staff') OR public.has_role((select auth.uid()),'cashier')
 ));
