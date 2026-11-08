-- Controle de ponto integrado ao Supabase Auth / user_roles.
-- O QR fixo é uma credencial compartilhada de presença, NÃO é identidade;
-- somente auth.uid() define o funcionário. Nenhuma foto é coletada.
-- Requisitos legais de REP-P (Portaria MTP 671/2021) exigem avaliação e
-- componentes adicionais antes de usar como registro trabalhista oficial.

CREATE TABLE public.time_clock_stores(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE CHECK(singleton),
  name text NOT NULL DEFAULT 'Loja principal',
  tz text NOT NULL DEFAULT 'America/Sao_Paulo',
  qr_secret text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32),'hex')
    CHECK (length(qr_secret)=64),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
INSERT INTO public.time_clock_stores(singleton,name,tz)
VALUES(true,'Loja principal','America/Sao_Paulo')
ON CONFLICT(singleton) DO NOTHING;
-- Não conceder SELECT do token: somente RPC admin pode retorná-lo.
REVOKE ALL ON public.time_clock_stores FROM PUBLIC,anon,authenticated;
ALTER TABLE public.time_clock_stores ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.time_clock_schedules(
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  store_id uuid NOT NULL REFERENCES public.time_clock_stores(id),
  start_time time NOT NULL,
  expected_minutes integer NOT NULL CHECK(expected_minutes BETWEEN 60 AND 840),
  weekdays integer[] NOT NULL DEFAULT ARRAY[1,2,3,4,5]
    CHECK(cardinality(weekdays) BETWEEN 1 AND 7
      AND weekdays <@ ARRAY[0,1,2,3,4,5,6]),
  grace_minutes integer NOT NULL DEFAULT 0 CHECK(grace_minutes BETWEEN 0 AND 60),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.time_clock_schedules ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.time_clock_schedules FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.time_clock_schedules TO authenticated;
CREATE POLICY "Ponto: própria jornada ou gerência"
ON public.time_clock_schedules FOR SELECT TO authenticated
USING (
  user_id=(SELECT auth.uid())
  OR public.has_role((SELECT auth.uid()),'admin'::public.app_role)
  OR public.has_role((SELECT auth.uid()),'manager'::public.app_role)
);

CREATE TABLE public.time_clock_punches(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  store_id uuid NOT NULL REFERENCES public.time_clock_stores(id),
  work_date date NOT NULL,
  kind text NOT NULL CHECK(kind IN ('entry','lunch_out','lunch_in','exit')),
  recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  effective_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  source text NOT NULL CHECK(source IN ('qr','admin')),
  -- Localização informativa, opcional, consentida e não verificada.
  latitude numeric(8,4) CHECK(latitude BETWEEN -90 AND 90),
  longitude numeric(8,4) CHECK(longitude BETWEEN -180 AND 180),
  accuracy_m integer CHECK(accuracy_m BETWEEN 0 AND 1000000),
  UNIQUE(user_id,work_date,kind)
);
CREATE INDEX time_clock_punches_employee_date
  ON public.time_clock_punches(user_id,work_date,effective_at);
CREATE INDEX time_clock_punches_store_date
  ON public.time_clock_punches(store_id,work_date);
ALTER TABLE public.time_clock_punches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.time_clock_punches FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.time_clock_punches TO authenticated;
CREATE POLICY "Ponto: próprio registro ou gerência"
ON public.time_clock_punches FOR SELECT TO authenticated
USING (
  user_id=(SELECT auth.uid())
  OR public.has_role((SELECT auth.uid()),'admin'::public.app_role)
  OR public.has_role((SELECT auth.uid()),'manager'::public.app_role)
);

CREATE TABLE public.time_clock_audit(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  punch_id uuid NOT NULL REFERENCES public.time_clock_punches(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK(action IN ('correct_time','insert_missing')),
  previous_at timestamptz,
  new_at timestamptz NOT NULL,
  reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 10 AND 1000),
  changed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  changed_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX time_clock_audit_punch ON public.time_clock_audit(punch_id,changed_at);
CREATE INDEX time_clock_audit_user ON public.time_clock_audit(user_id,changed_at);
ALTER TABLE public.time_clock_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.time_clock_audit FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.time_clock_audit TO authenticated;
CREATE POLICY "Ponto: própria auditoria ou gerência"
ON public.time_clock_audit FOR SELECT TO authenticated
USING (
  user_id=(SELECT auth.uid())
  OR public.has_role((SELECT auth.uid()),'admin'::public.app_role)
  OR public.has_role((SELECT auth.uid()),'manager'::public.app_role)
);

-- O módulo reutiliza os mesmos usuários e papéis, sem cadastro paralelo.
CREATE OR REPLACE FUNCTION public.time_clock_can_punch() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
 SELECT auth.uid() IS NOT NULL AND EXISTS(
   SELECT 1 FROM public.user_roles r
   WHERE r.user_id=auth.uid()
     AND r.role IN ('admin'::public.app_role,'manager'::public.app_role,
                    'staff'::public.app_role,'cashier'::public.app_role)
 );
$fn$;
REVOKE EXECUTE ON FUNCTION public.time_clock_can_punch() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.time_clock_can_punch() TO authenticated;

CREATE OR REPLACE FUNCTION public.time_clock_can_manage() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
 SELECT auth.uid() IS NOT NULL AND EXISTS(
   SELECT 1 FROM public.user_roles r
   WHERE r.user_id=auth.uid()
     AND r.role IN ('admin'::public.app_role,'manager'::public.app_role)
 );
$fn$;
REVOKE EXECUTE ON FUNCTION public.time_clock_can_manage() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.time_clock_can_manage() TO authenticated;

CREATE OR REPLACE FUNCTION public.time_clock_admin_qr() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE s record;
BEGIN
 IF NOT public.time_clock_can_manage() THEN
   RAISE EXCEPTION 'Apenas a gerência pode visualizar o QR Code' USING ERRCODE='42501';
 END IF;
 SELECT id,name,tz,qr_secret INTO s FROM public.time_clock_stores WHERE singleton=true;
 IF s.id IS NULL THEN RAISE EXCEPTION 'Loja não configurada'; END IF;
 RETURN jsonb_build_object(
   'store_id',s.id,'store_name',s.name,'timezone',s.tz,
   'qr_payload','CF-PONTO:V1:'||s.qr_secret);
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.time_clock_admin_qr() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.time_clock_admin_qr() TO authenticated;

CREATE OR REPLACE FUNCTION public.time_clock_state() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
  v_user uuid:=auth.uid();v_store record;v_now timestamptz:=clock_timestamp();
  v_today date;v_day date;v_latest record;v_count integer;
  v_events jsonb;v_next text;
BEGIN
 IF NOT public.time_clock_can_punch() THEN
   RAISE EXCEPTION 'Usuário sem permissão para bater ponto' USING ERRCODE='42501';
 END IF;
 SELECT id,name,tz INTO v_store FROM public.time_clock_stores WHERE singleton=true;
 v_today:=(v_now AT TIME ZONE v_store.tz)::date;
 v_day:=v_today;
 -- Uma saída após meia-noite pertence à jornada iniciada antes,
 -- até 18h após a última marcação. Após isso, a gerência regulariza.
 SELECT work_date,kind,effective_at INTO v_latest
 FROM public.time_clock_punches WHERE user_id=v_user
 AND work_date BETWEEN v_today-1 AND v_today
 ORDER BY effective_at DESC LIMIT 1;
 IF v_latest.work_date=v_today-1 AND v_latest.kind<>'exit'
    AND v_now-v_latest.effective_at<=interval '18 hours'
 THEN v_day:=v_today-1; END IF;
 SELECT count(*) INTO v_count FROM public.time_clock_punches
 WHERE user_id=v_user AND work_date=v_day;
 v_next:=CASE v_count WHEN 0 THEN 'entry' WHEN 1 THEN 'lunch_out'
                     WHEN 2 THEN 'lunch_in' WHEN 3 THEN 'exit' ELSE NULL END;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
   'id',id,'kind',kind,'effective_at',effective_at,
   'recorded_at',recorded_at,'source',source
 ) ORDER BY effective_at),'[]'::jsonb) INTO v_events
 FROM public.time_clock_punches WHERE user_id=v_user AND work_date=v_day;
 RETURN jsonb_build_object('store_name',v_store.name,'timezone',v_store.tz,
   'server_time',v_now,'today',v_today,'work_date',v_day,
   'next_kind',v_next,'events',v_events);
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.time_clock_state() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.time_clock_state() TO authenticated;

CREATE OR REPLACE FUNCTION public.time_clock_record(
  p_qr text,p_location jsonb DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
  v_user uuid:=auth.uid();v_store record;v_now timestamptz;
  v_day date;v_last record;v_count integer;v_next text;
  v_id uuid;v_lat numeric;v_lon numeric;v_accuracy integer;
BEGIN
 IF NOT public.time_clock_can_punch() THEN
   RAISE EXCEPTION 'Login individual e permissão são obrigatórios' USING ERRCODE='42501';
 END IF;
 -- Lock de empregado serializa toques simultâneos de vários dispositivos.
 PERFORM 1 FROM public.profiles WHERE id=v_user FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Perfil de funcionário não encontrado' USING ERRCODE='42501'; END IF;
 SELECT id,qr_secret,tz INTO v_store FROM public.time_clock_stores WHERE singleton=true;
 IF p_qr IS NULL OR length(p_qr)<>76
    OR p_qr IS DISTINCT FROM 'CF-PONTO:V1:'||v_store.qr_secret
 THEN RAISE EXCEPTION 'QR Code inválido para esta loja' USING ERRCODE='22023'; END IF;
 v_now:=clock_timestamp();
 v_day:=(v_now AT TIME ZONE v_store.tz)::date;
 SELECT work_date,kind,effective_at INTO v_last
 FROM public.time_clock_punches WHERE user_id=v_user
 AND work_date BETWEEN v_day-1 AND v_day
 ORDER BY effective_at DESC LIMIT 1;
 IF v_last.work_date=v_day-1 AND v_last.kind<>'exit'
    AND v_now-v_last.effective_at<=interval '18 hours'
 THEN v_day:=v_day-1; END IF;
 SELECT count(*) INTO v_count FROM public.time_clock_punches
 WHERE user_id=v_user AND work_date=v_day;
 IF v_count>=4 THEN
   RAISE EXCEPTION 'As quatro marcações desta jornada já foram realizadas'
     USING ERRCODE='22023';
 END IF;
 v_next:=CASE v_count WHEN 0 THEN 'entry' WHEN 1 THEN 'lunch_out'
                     WHEN 2 THEN 'lunch_in' ELSE 'exit' END;
 IF v_last.effective_at IS NOT NULL
   AND v_last.work_date=v_day AND v_now-v_last.effective_at<interval '1 minute'
 THEN RAISE EXCEPTION 'Aguarde pelo menos um minuto entre marcações' USING ERRCODE='22023'; END IF;
 -- Na sessão atual, os tipos têm ordem estrita. Correções preservam essa ordem.
 IF EXISTS(
   SELECT 1 FROM public.time_clock_punches
   WHERE user_id=v_user AND work_date=v_day
   AND kind<>ALL(CASE v_count
     WHEN 0 THEN ARRAY[]::text[]
     WHEN 1 THEN ARRAY['entry']::text[]
     WHEN 2 THEN ARRAY['entry','lunch_out']::text[]
     ELSE ARRAY['entry','lunch_out','lunch_in']::text[] END)
 ) THEN RAISE EXCEPTION 'A sequência do ponto precisa de revisão gerencial' USING ERRCODE='22023'; END IF;
 IF p_location IS NOT NULL THEN
   IF jsonb_typeof(p_location)<>'object'
      OR NOT p_location ? 'latitude' OR NOT p_location ? 'longitude'
   THEN RAISE EXCEPTION 'Localização opcional inválida' USING ERRCODE='22023'; END IF;
   v_lat:=round((p_location->>'latitude')::numeric,4);
   v_lon:=round((p_location->>'longitude')::numeric,4);
   v_accuracy:=round(coalesce((p_location->>'accuracy_m')::numeric,0))::integer;
   IF v_lat NOT BETWEEN -90 AND 90 OR v_lon NOT BETWEEN -180 AND 180
      OR v_accuracy NOT BETWEEN 0 AND 1000000
   THEN RAISE EXCEPTION 'Coordenadas inválidas' USING ERRCODE='22023'; END IF;
 END IF;
 INSERT INTO public.time_clock_punches(
   user_id,store_id,work_date,kind,recorded_at,effective_at,source,
   latitude,longitude,accuracy_m
 ) VALUES(v_user,v_store.id,v_day,v_next,v_now,v_now,'qr',
   v_lat,v_lon,v_accuracy)
 RETURNING id INTO v_id;
 RETURN jsonb_build_object('id',v_id,'kind',v_next,'work_date',v_day,
   'server_time',v_now,'next_kind',
   CASE v_next WHEN 'entry' THEN 'lunch_out' WHEN 'lunch_out' THEN 'lunch_in'
     WHEN 'lunch_in' THEN 'exit' ELSE NULL END);
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.time_clock_record(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.time_clock_record(text,jsonb) TO authenticated;
