-- Apuração calculada sempre no servidor, sem saldo manual e sem dados fictícios.
-- Sem escala configurada não se presume carga de trabalho nem atraso.
-- Dias sem marcação não são tratados automaticamente como falta.
CREATE OR REPLACE FUNCTION public.time_clock_admin_users() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE v_result jsonb;
BEGIN
 IF NOT public.time_clock_can_manage() THEN
  RAISE EXCEPTION 'Acesso restrito à gerência' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',p.id,
  'name',coalesce(nullif(p.full_name,''),p.email,'Usuário'),
  'email',p.email,'role',roles.role,'has_schedule',s.user_id IS NOT NULL)
  ORDER BY coalesce(p.full_name,p.email),'id'),'[]'::jsonb)
 INTO v_result
 FROM public.profiles p
 JOIN LATERAL (
  SELECT r.role::text AS role FROM public.user_roles r
  WHERE r.user_id=p.id
    AND r.role IN ('admin'::public.app_role,'manager'::public.app_role,
                   'staff'::public.app_role,'cashier'::public.app_role)
  ORDER BY CASE r.role WHEN 'admin' THEN 1 WHEN 'manager' THEN 2
    WHEN 'staff' THEN 3 ELSE 4 END LIMIT 1
 ) roles ON true
 LEFT JOIN public.time_clock_schedules s ON s.user_id=p.id;
 RETURN v_result;
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.time_clock_admin_users() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.time_clock_admin_users() TO authenticated;

CREATE OR REPLACE FUNCTION public.time_clock_set_schedule(
 p_user uuid,p_start time,p_expected integer,p_weekdays integer[],
 p_grace integer,p_reason text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE v_store uuid;v_previous jsonb;v_actor uuid:=auth.uid();
BEGIN
 IF NOT public.time_clock_can_manage() THEN
  RAISE EXCEPTION 'Apenas gerente e administrador podem definir a jornada'
   USING ERRCODE='42501'; END IF;
 IF p_user IS NULL OR p_start IS NULL OR p_expected NOT BETWEEN 60 AND 840
 OR p_grace NOT BETWEEN 0 AND 60 OR p_weekdays IS NULL
 OR cardinality(p_weekdays) NOT BETWEEN 1 AND 7
 OR NOT p_weekdays <@ ARRAY[0,1,2,3,4,5,6]
 OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 10 AND 300
 THEN RAISE EXCEPTION 'Horário, dias, tolerância ou justificativa inválidos'
   USING ERRCODE='22023'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.profiles p JOIN public.user_roles r
    ON r.user_id=p.id WHERE p.id=p_user
    AND r.role IN ('admin'::public.app_role,'manager'::public.app_role,
                   'staff'::public.app_role,'cashier'::public.app_role))
 THEN RAISE EXCEPTION 'Funcionário sem login ativo' USING ERRCODE='22023'; END IF;
 SELECT id INTO v_store FROM public.time_clock_stores WHERE singleton=true;
 SELECT to_jsonb(s) INTO v_previous FROM public.time_clock_schedules s WHERE user_id=p_user;
 INSERT INTO public.time_clock_schedules(user_id,store_id,start_time,
  expected_minutes,weekdays,grace_minutes,updated_by)
 VALUES(p_user,v_store,p_start,p_expected,p_weekdays,p_grace,v_actor)
 ON CONFLICT(user_id) DO UPDATE SET
  start_time=excluded.start_time,expected_minutes=excluded.expected_minutes,
  weekdays=excluded.weekdays,grace_minutes=excluded.grace_minutes,
  updated_at=clock_timestamp(),updated_by=v_actor;
 INSERT INTO public.time_clock_schedule_audit(
  user_id,changed_by,reason,before_schedule,after_schedule)
 SELECT p_user,v_actor,btrim(p_reason),v_previous,to_jsonb(s)
 FROM public.time_clock_schedules s WHERE s.user_id=p_user;
 RETURN jsonb_build_object('user_id',p_user,'saved',true);
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.time_clock_set_schedule(uuid,time,integer,integer[],integer,text)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.time_clock_set_schedule(uuid,time,integer,integer[],integer,text)
 TO authenticated;

-- Configurações também têm trilha imutável.
CREATE TABLE public.time_clock_schedule_audit(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 changed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 changed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 reason text NOT NULL,
 before_schedule jsonb,after_schedule jsonb NOT NULL
);
ALTER TABLE public.time_clock_schedule_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.time_clock_schedule_audit FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.time_clock_schedule_audit TO authenticated;
CREATE POLICY "Ponto: histórico de escala próprio ou gerencial"
 ON public.time_clock_schedule_audit FOR SELECT TO authenticated
 USING(user_id=(SELECT auth.uid())
 OR public.has_role((SELECT auth.uid()),'admin'::public.app_role)
 OR public.has_role((SELECT auth.uid()),'manager'::public.app_role));

CREATE OR REPLACE FUNCTION public.time_clock_report(
 p_from date,p_to date,p_user uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
 v_actor uuid:=auth.uid();v_target uuid;v_store record;v_now timestamptz:=clock_timestamp();
 v_today date;v_day date;v_entry timestamptz;v_out timestamptz;
 v_back timestamptz;v_exit timestamptz;v_minutes integer;v_expected integer;
 v_extra integer;v_late integer;v_balance integer;v_start time;
 v_grace integer;v_weekdays integer[];v_has_schedule boolean:=false;
 v_complete boolean;v_rows jsonb:='[]'::jsonb;v_events jsonb;
 v_total integer:=0;v_extra_total integer:=0;v_late_total integer:=0;v_balance_total integer:=0;
 v_partial integer:=0;v_unscheduled integer:=0;v_days integer:=0;
 v_name text;v_count integer;v_start_at timestamptz;
BEGIN
 IF NOT public.time_clock_can_punch() THEN
  RAISE EXCEPTION 'Sessão inválida para consulta de ponto' USING ERRCODE='42501'; END IF;
 v_target:=coalesce(p_user,v_actor);
 IF v_target<>v_actor AND NOT public.time_clock_can_manage() THEN
  RAISE EXCEPTION 'Não pode consultar o ponto de outro funcionário' USING ERRCODE='42501'; END IF;
 IF p_from IS NULL OR p_to IS NULL OR p_to<p_from
 OR p_to-p_from>366 OR p_from>current_date+366
 THEN RAISE EXCEPTION 'Período de consulta inválido' USING ERRCODE='22023'; END IF;
 SELECT full_name INTO v_name FROM public.profiles WHERE id=v_target;
 IF NOT FOUND THEN RAISE EXCEPTION 'Funcionário não localizado' USING ERRCODE='22023'; END IF;
 SELECT tz INTO v_store FROM public.time_clock_stores WHERE singleton=true;
 v_today:=(v_now AT TIME ZONE v_store.tz)::date;
 SELECT start_time,expected_minutes,weekdays,grace_minutes INTO
   v_start,v_expected,v_weekdays,v_grace
 FROM public.time_clock_schedules WHERE user_id=v_target;
 v_has_schedule:=FOUND;
 FOR v_day IN SELECT gs::date FROM generate_series(p_from,p_to,interval '1 day') gs LOOP
  SELECT count(*)::integer,
   max(effective_at) FILTER(WHERE kind='entry'),
   max(effective_at) FILTER(WHERE kind='lunch_out'),
   max(effective_at) FILTER(WHERE kind='lunch_in'),
   max(effective_at) FILTER(WHERE kind='exit'),
   coalesce(jsonb_agg(jsonb_build_object(
    'id',id,'kind',kind,'effective_at',effective_at,
    'recorded_at',recorded_at,'source',source
   ) ORDER BY effective_at),'[]'::jsonb)
  INTO v_count,v_entry,v_out,v_back,v_exit,v_events
  FROM public.time_clock_punches WHERE user_id=v_target AND work_date=v_day;
  IF v_count=0 THEN CONTINUE; END IF;
  v_complete:=v_entry IS NOT NULL AND v_out IS NOT NULL
   AND v_back IS NOT NULL AND v_exit IS NOT NULL
   AND v_entry<v_out AND v_out<v_back AND v_back<v_exit;
  v_minutes:=0;
  IF v_entry IS NOT NULL THEN
    IF v_out IS NOT NULL THEN
      v_minutes:=v_minutes+greatest(0,floor(extract(epoch FROM (v_out-v_entry))/60)::int);
    ELSIF v_day=v_today AND v_exit IS NULL THEN
      v_minutes:=v_minutes+greatest(0,floor(extract(epoch FROM (v_now-v_entry))/60)::int);
    END IF;
  END IF;
  IF v_back IS NOT NULL THEN
    IF v_exit IS NOT NULL THEN
      v_minutes:=v_minutes+greatest(0,floor(extract(epoch FROM (v_exit-v_back))/60)::int);
    ELSIF v_day=v_today THEN
      v_minutes:=v_minutes+greatest(0,floor(extract(epoch FROM (v_now-v_back))/60)::int);
    END IF;
  END IF;
  -- Saldo, extra e atraso só são calculados com jornada definida e
  -- o dia fechado; uma jornada incompleta NÃO recebe saldo negativo fictício.
  v_extra:=NULL;v_late:=NULL;v_balance:=NULL;
  IF v_has_schedule AND v_complete THEN
    v_expected:=CASE WHEN extract(dow FROM v_day)::int=ANY(v_weekdays)
      THEN (SELECT expected_minutes FROM public.time_clock_schedules
        WHERE user_id=v_target) ELSE 0 END;
    v_extra:=greatest(0,v_minutes-v_expected);
    v_balance:=v_minutes-v_expected;
    v_start_at:=(v_day+v_start) AT TIME ZONE v_store.tz;
    v_late:=CASE WHEN v_expected=0 THEN 0 ELSE
      greatest(0,floor(extract(epoch FROM (v_entry-v_start_at))/60)::int-v_grace)
    END;
    v_extra_total:=v_extra_total+v_extra;
    v_late_total:=v_late_total+v_late;
    v_balance_total:=v_balance_total+v_balance;
  END IF;
  IF NOT v_has_schedule THEN v_unscheduled:=v_unscheduled+1;END IF;
  IF NOT v_complete THEN v_partial:=v_partial+1;END IF;
  v_total:=v_total+v_minutes;
  v_days:=v_days+1;
  v_rows:=v_rows||jsonb_build_array(jsonb_build_object(
    'work_date',v_day,'minutes',v_minutes,'expected_minutes',
    CASE WHEN v_has_schedule THEN
      CASE WHEN extract(dow FROM v_day)::int=ANY(v_weekdays)
      THEN (SELECT expected_minutes FROM public.time_clock_schedules
        WHERE user_id=v_target) ELSE 0 END ELSE NULL END,
    'extra_minutes',v_extra,'late_minutes',v_late,
    'balance_minutes',v_balance,'complete',v_complete,'punches',v_events));
 END LOOP;
 RETURN jsonb_build_object(
   'user_id',v_target,'name',v_name,'from',p_from,'to',p_to,
   'server_time',v_now,'timezone',v_store.tz,
   'schedule',CASE WHEN v_has_schedule THEN jsonb_build_object(
     'start_time',v_start,'expected_minutes',
     (SELECT expected_minutes FROM public.time_clock_schedules WHERE user_id=v_target),
     'weekdays',v_weekdays,'grace_minutes',v_grace)
     ELSE NULL END,
   'days',v_rows,'totals',jsonb_build_object(
      'worked_minutes',v_total,'extra_minutes',
      CASE WHEN v_has_schedule THEN v_extra_total ELSE NULL END,
      'late_minutes',CASE WHEN v_has_schedule THEN v_late_total ELSE NULL END,
      'balance_minutes',CASE WHEN v_has_schedule THEN v_balance_total ELSE NULL END,
      'recorded_days',v_days,'incomplete_days',v_partial,
      'days_without_schedule',v_unscheduled));
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.time_clock_report(date,date,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.time_clock_report(date,date,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.time_clock_admin_records(
 p_user uuid,p_from date,p_to date,p_limit integer DEFAULT 50,p_offset integer DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE v_rows jsonb;v_total integer;
BEGIN
 IF NOT public.time_clock_can_manage() THEN
  RAISE EXCEPTION 'Registros de terceiros restritos à gerência' USING ERRCODE='42501'; END IF;
 IF p_from IS NULL OR p_to IS NULL OR p_to<p_from OR p_to-p_from>366
  OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 200
  OR p_offset IS NULL OR p_offset NOT BETWEEN 0 AND 10000000
 THEN RAISE EXCEPTION 'Filtro ou paginação inválida' USING ERRCODE='22023';END IF;
 SELECT count(*)::integer INTO v_total FROM public.time_clock_punches p
 WHERE (p_user IS NULL OR p.user_id=p_user)
 AND p.work_date BETWEEN p_from AND p_to;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id',z.id,'user_id',z.user_id,'name',z.full_name,
    'work_date',z.work_date,'kind',z.kind,'recorded_at',z.recorded_at,
    'effective_at',z.effective_at,'source',z.source,
    'corrected',z.correction_count>0,'correction_count',z.correction_count
   ) ORDER BY z.work_date DESC,z.effective_at DESC),'[]'::jsonb)
 INTO v_rows FROM(
  SELECT p.*,coalesce(pr.full_name,pr.email,'Usuário') AS full_name,
     (SELECT count(*)::integer FROM public.time_clock_audit a
      WHERE a.punch_id=p.id) AS correction_count
  FROM public.time_clock_punches p JOIN public.profiles pr ON pr.id=p.user_id
  WHERE (p_user IS NULL OR p.user_id=p_user)
    AND p.work_date BETWEEN p_from AND p_to
  ORDER BY p.work_date DESC,p.effective_at DESC LIMIT p_limit OFFSET p_offset
 ) z;
 RETURN jsonb_build_object('rows',v_rows,'total',v_total,
  'limit',p_limit,'offset',p_offset);
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.time_clock_admin_records(uuid,date,date,integer,integer)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.time_clock_admin_records(uuid,date,date,integer,integer)
 TO authenticated;
