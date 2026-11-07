-- Ativação controlada do PRIMEIRO administrador, após confirmação de e-mail.
-- O gatilho não recebe dados enviados pelo cliente para atribuir papéis.
-- E-mail da organização proprietária confirmado via Supabase Auth.
CREATE OR REPLACE FUNCTION public.closet_grant_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL OR lower(btrim(NEW.email)) <> 'contato@closetfesta.com.br' THEN
    RETURN NEW;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'::public.app_role) THEN
    INSERT INTO public.user_roles(user_id,role)
      VALUES(NEW.id, 'admin'::public.app_role)
      ON CONFLICT (user_id,role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS closet_grant_first_admin ON auth.users;
CREATE TRIGGER closet_grant_first_admin
AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.closet_grant_first_admin();
-- Proibir chamadas externas da função privilegiada.
REVOKE ALL ON FUNCTION public.closet_grant_first_admin() FROM PUBLIC, anon, authenticated;
