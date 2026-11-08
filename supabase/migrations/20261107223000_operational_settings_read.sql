-- Configurações necessárias aos operadores do PDV, agenda e impressão.
-- Cada chave é autorizada separadamente. Dados fiscais, metas e segredos
-- não ficam visíveis aos perfis de atendimento/caixa.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='settings'
      AND policyname='Operational staff read essential settings'
  ) THEN
    CREATE POLICY "Operational staff read essential settings"
      ON public.settings FOR SELECT TO authenticated
      USING (
        key IN (
          'closet_festa.config.v1.operations',
          'closet_festa.config.v1.payments',
          'closet_festa.config.v1.company',
          'closet_festa.config.v1.documents',
          'closet_festa.config.v1.messages'
        ) AND (
          public.has_role((select auth.uid()), 'staff'::public.app_role)
          OR public.has_role((select auth.uid()), 'cashier'::public.app_role)
        )
      );
  END IF;
END $$;
