-- Atribuição administrativa de funções sem expor a chave de serviço.
-- O único admin pode gerir outros perfis, mas não revogar o próprio acesso.
CREATE TABLE IF NOT EXISTS public.closet_role_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 actor_id uuid NOT NULL REFERENCES auth.users(id),
 target_id uuid NOT NULL REFERENCES auth.users(id),
 previous_roles text[] NOT NULL DEFAULT '{}'::text[],
 new_role text,
 changed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.closet_role_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.closet_role_audit FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.closet_role_audit TO authenticated;
CREATE POLICY "Admin can audit role changes" ON public.closet_role_audit
FOR SELECT TO authenticated
USING (public.has_role((select auth.uid()),'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.closet_assign_user_role(p_target uuid,p_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp
AS $$
DECLARE
  actor uuid := auth.uid();
  before_roles text[];
BEGIN
  IF actor IS NULL OR NOT public.has_role(actor,'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Somente administradores podem alterar perfis de acesso' USING ERRCODE='42501';
  END IF;
  IF p_target IS NULL OR p_target=actor THEN
    RAISE EXCEPTION 'Não é permitido modificar o próprio perfil' USING ERRCODE='22023';
  END IF;
  IF p_role IS NOT NULL AND p_role NOT IN ('admin','manager','staff','cashier') THEN
    RAISE EXCEPTION 'Perfil inválido' USING ERRCODE='22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id=p_target) THEN
    RAISE EXCEPTION 'Usuário não encontrado' USING ERRCODE='22023';
  END IF;
  -- Lock explícito por alvo evita corrida entre administradores.
  PERFORM pg_advisory_xact_lock(hashtext(p_target::text));
  SELECT coalesce(array_agg(role::text ORDER BY role::text),'{}'::text[]) INTO before_roles
    FROM public.user_roles WHERE user_id=p_target;
  DELETE FROM public.user_roles WHERE user_id=p_target;
  IF p_role IS NOT NULL THEN
    INSERT INTO public.user_roles(user_id,role) VALUES(p_target,p_role::public.app_role);
  END IF;
  INSERT INTO public.closet_role_audit(actor_id,target_id,previous_roles,new_role)
    VALUES(actor,p_target,before_roles,p_role);
END;
$$;
REVOKE ALL ON FUNCTION public.closet_assign_user_role(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.closet_assign_user_role(uuid,text) TO authenticated;
