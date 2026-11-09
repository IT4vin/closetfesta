-- Cadastro de funcionários vinculado ao ÚNICO login do Supabase Auth.
-- Sem duplicação de user_roles/profiles, sem CPF ou salários desnecessários.
CREATE TABLE public.closet_employee_details(
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  department text,
  job_title text,
  hired_on date,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.closet_employee_details ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.closet_employee_details FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.closet_employee_details TO authenticated;
CREATE POLICY "Funcionário vê seus próprios dados e admin vê todos"
  ON public.closet_employee_details FOR SELECT TO authenticated
  USING (user_id=(SELECT auth.uid()) OR
     public.has_role((SELECT auth.uid()),'admin'::public.app_role));

CREATE TABLE public.closet_employee_details_audit(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  previous_data jsonb NOT NULL,
  new_data jsonb NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX closet_employee_details_audit_target_date
 ON public.closet_employee_details_audit(target_id,changed_at DESC);
ALTER TABLE public.closet_employee_details_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.closet_employee_details_audit FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.closet_employee_details_audit TO authenticated;
CREATE POLICY "Admin consulta histórico de funcionários"
 ON public.closet_employee_details_audit FOR SELECT TO authenticated
 USING(public.has_role((SELECT auth.uid()),'admin'::public.app_role));

-- Dados cadastrais e vínculo de permissão são lidos somente pelo admin.
CREATE OR REPLACE FUNCTION public.closet_employee_directory()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE v_result jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin'::public.app_role)
 THEN RAISE EXCEPTION 'Somente o administrador pode consultar funcionários'
   USING ERRCODE='42501'; END IF;
 SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id',u.id,
    'full_name',COALESCE(p.full_name,u.raw_user_meta_data->>'full_name',u.email),
    'email',u.email,
    'phone',p.phone,
    'role',COALESCE(roles.role,'inactive'),
    'email_confirmed',u.email_confirmed_at IS NOT NULL,
    'created_at',u.created_at,
    'department',e.department,
    'job_title',e.job_title,
    'hired_on',e.hired_on
  ) ORDER BY u.created_at DESC),'[]'::jsonb) INTO v_result
 FROM auth.users u
 LEFT JOIN public.profiles p ON p.id=u.id
 LEFT JOIN public.closet_employee_details e ON e.user_id=u.id
 LEFT JOIN LATERAL (
   SELECT r.role::text AS role
   FROM public.user_roles r WHERE r.user_id=u.id
   ORDER BY CASE r.role
     WHEN 'admin'::public.app_role THEN 1
     WHEN 'manager'::public.app_role THEN 2
     WHEN 'staff'::public.app_role THEN 3
     ELSE 4 END LIMIT 1
 ) roles ON true;
 RETURN v_result;
END;
$fn$;
REVOKE ALL ON FUNCTION public.closet_employee_directory() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.closet_employee_directory() TO authenticated;

-- Dados pessoais são editados no servidor; alteração de papel usa RPC
-- EXISTENTE closet_assign_user_role(), que já audita e impede auto-revogação.
CREATE OR REPLACE FUNCTION public.closet_employee_update(
 p_target uuid, p_full_name text, p_phone text,
 p_department text, p_job_title text, p_hired_on date
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
 v_actor uuid:=auth.uid();
 v_digits text;
 v_before jsonb;
 v_after jsonb;
BEGIN
 IF v_actor IS NULL OR NOT public.has_role(v_actor,'admin'::public.app_role)
 THEN RAISE EXCEPTION 'Somente administradores podem alterar funcionários'
  USING ERRCODE='42501'; END IF;
 IF p_target IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_target)
 THEN RAISE EXCEPTION 'Funcionário não encontrado' USING ERRCODE='22023'; END IF;
 IF length(btrim(coalesce(p_full_name,''))) NOT BETWEEN 2 AND 140 OR
    length(coalesce(p_department,''))>100 OR
    length(coalesce(p_job_title,''))>100 OR
    (p_hired_on IS NOT NULL AND (p_hired_on<date '1950-01-01'
       OR p_hired_on>current_date+365))
 THEN RAISE EXCEPTION 'Confira nome, cargo, setor e data de admissão'
 USING ERRCODE='22023'; END IF;
 v_digits:=regexp_replace(coalesce(p_phone,''),'[^0-9]','','g');
 IF v_digits<>'' AND length(v_digits) NOT IN(10,11)
 THEN RAISE EXCEPTION 'Telefone deve conter DDD e 10 ou 11 dígitos'
  USING ERRCODE='22023'; END IF;
 -- O mesmo usuário pode ser atualizado simultaneamente; serializar.
 PERFORM 1 FROM auth.users WHERE id=p_target FOR UPDATE;
 SELECT jsonb_build_object('full_name',p.full_name,'phone',p.phone,
   'department',e.department,'job_title',e.job_title,'hired_on',e.hired_on)
 INTO v_before
 FROM public.profiles p LEFT JOIN public.closet_employee_details e
 ON e.user_id=p.id WHERE p.id=p_target;
 v_before:=COALESCE(v_before,'{}'::jsonb);
 INSERT INTO public.profiles(id,full_name,phone,email,updated_at)
 SELECT u.id,btrim(p_full_name),NULLIF(v_digits,''),u.email,clock_timestamp()
 FROM auth.users u WHERE u.id=p_target
 ON CONFLICT(id) DO UPDATE SET full_name=excluded.full_name,
   phone=excluded.phone,updated_at=clock_timestamp();
 INSERT INTO public.closet_employee_details(
   user_id,department,job_title,hired_on,updated_by
 ) VALUES(p_target,NULLIF(btrim(coalesce(p_department,'')),''),
   NULLIF(btrim(coalesce(p_job_title,'')),''),p_hired_on,v_actor)
 ON CONFLICT(user_id) DO UPDATE SET
   department=excluded.department,job_title=excluded.job_title,
   hired_on=excluded.hired_on,updated_at=clock_timestamp(),
   updated_by=v_actor;
 SELECT jsonb_build_object('full_name',p.full_name,'phone',p.phone,
   'department',e.department,'job_title',e.job_title,'hired_on',e.hired_on)
 INTO v_after FROM public.profiles p JOIN public.closet_employee_details e
 ON e.user_id=p.id WHERE p.id=p_target;
 IF v_before IS DISTINCT FROM v_after THEN
  INSERT INTO public.closet_employee_details_audit(
    target_id,actor_id,previous_data,new_data)
  VALUES(p_target,v_actor,v_before,v_after);
 END IF;
 RETURN jsonb_build_object('id',p_target,'saved',true,'data',v_after);
END;
$fn$;
REVOKE ALL ON FUNCTION public.closet_employee_update(uuid,text,text,text,text,date)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.closet_employee_update(uuid,text,text,text,text,date)
 TO authenticated;
