-- Guardar a versão EXATA dos dados utilizados no documento emitido.
-- Somente inserção e leitura: não é permitido modificar a versão já emitida.
CREATE TABLE IF NOT EXISTS public.rental_document_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.rental_contracts(id) ON DELETE RESTRICT,
  revision integer NOT NULL DEFAULT 1 CHECK (revision >= 1),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload)='object'),
  issued_by uuid NOT NULL REFERENCES auth.users(id),
  issued_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rental_document_snapshots_version_unique UNIQUE (contract_id,revision)
);
CREATE INDEX IF NOT EXISTS idx_rental_document_snapshots_contract
  ON public.rental_document_snapshots(contract_id,revision DESC);
ALTER TABLE public.rental_document_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rental_document_snapshots FROM PUBLIC,anon,authenticated;
GRANT SELECT, INSERT ON public.rental_document_snapshots TO authenticated;
CREATE POLICY "Authorized workers can read issued rental documents"
ON public.rental_document_snapshots FOR SELECT TO authenticated
USING (
  public.has_role((select auth.uid()), 'admin'::public.app_role)
  OR public.has_role((select auth.uid()), 'manager'::public.app_role)
  OR public.has_role((select auth.uid()), 'staff'::public.app_role)
);
CREATE POLICY "Authorized workers can issue rental documents"
ON public.rental_document_snapshots FOR INSERT TO authenticated
WITH CHECK (
 issued_by=(select auth.uid())
 AND (
  public.has_role((select auth.uid()), 'admin'::public.app_role)
  OR public.has_role((select auth.uid()), 'manager'::public.app_role)
  OR public.has_role((select auth.uid()), 'staff'::public.app_role)
 )
);
