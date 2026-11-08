-- Preparação do novo projeto Supabase Closet Festa.
-- Permissões do bucket e RPCs. Executada em ambiente novo em 06/11/2026.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 VALUES('product-images','product-images',false,8388608,ARRAY['image/jpeg','image/png','image/webp'])
 ON CONFLICT(id) DO NOTHING;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_rental_contract(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cashier_open(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cashier_move(uuid,text,numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cashier_close(uuid,numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rental_confirm_pickup(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rental_confirm_return(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rental_record_payment(uuid,uuid,text,numeric,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rental_release_laundry(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
 AS $f$
 SELECT auth.uid() IS NOT NULL AND _user_id=auth.uid()
   AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
 $f$;
REVOKE ALL ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
 REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;
