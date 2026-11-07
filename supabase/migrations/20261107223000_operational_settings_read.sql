-- Permite que colaboradores autorizados leiam SOMENTE as regras operacionais
-- utilizadas pela agenda. Dados cadastrais, fiscais e financeiros permanecem restritos.
-- A política de escrita de public.settings não é alterada.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'settings'
      AND policyname = 'Operational staff read appointment settings'
  ) THEN
    CREATE POLICY "Operational staff read appointment settings"
      ON public.settings FOR SELECT TO authenticated
      USING (
        key = 'closet_festa.config.v1.operations'
        AND (
          public.has_role((select auth.uid()), 'staff'::public.app_role)
          OR public.has_role((select auth.uid()), 'cashier'::public.app_role)
        )
      );
  END IF;
END $$;
