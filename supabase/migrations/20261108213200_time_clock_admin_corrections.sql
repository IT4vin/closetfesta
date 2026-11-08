-- Correções nunca alteram horário do registro original (recorded_at).
-- São permitidas somente à gerência e deixam histórico append-only auditável.
CREATE OR REPLACE FUNCTION public.time_clock_admin_adjust(
 p_punch uuid,p_user uuid,p_day date,p_kind text,
 p_effective_at timestamptz,p_reason text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
 v_actor uuid:=auth.uid();v_id uuid;v_employee uuid;v_day date;
 v_kind text;v_old timestamptz;v_store record;
 v_order text[]:=ARRAY['entry','lunch_out','lunch_in','exit'];
 v_row record;v_expected_pos integer:=1;v_prior timestamptz;
 v_action text;
BEGIN
 IF NOT public.time_clock_can_manage() THEN
  RAISE EXCEPTION 'Correção restrita à gerência' USING ERRCODE='42501'; END IF;
 IF p_effective_at IS NULL OR p_effective_at>clock_timestamp()
   OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 10 AND 1000
 THEN RAISE EXCEPTION 'Horário válido e justificativa de 10 a 1000 caracteres são obrigatórios'
  USING ERRCODE='22023'; END IF;
 SELECT id,tz INTO v_store FROM public.time_clock_stores WHERE singleton=true;
 IF p_punch IS NULL THEN
   IF p_user IS NULL OR p_day IS NULL OR p_kind IS NULL
    OR p_kind<>ALL(v_order)
   THEN RAISE EXCEPTION 'Informe funcionário, data e tipo para suprir marcação'
     USING ERRCODE='22023'; END IF;
   v_employee:=p_user;v_day:=p_day;v_kind:=p_kind;
   v_action:='insert_missing';
 ELSE
   SELECT user_id,work_date,kind,effective_at
    INTO v_employee,v_day,v_kind,v_old
   FROM public.time_clock_punches WHERE id=p_punch;
   IF v_employee IS NULL THEN RAISE EXCEPTION 'Marcação não encontrada' USING ERRCODE='P0002'; END IF;
   v_action:='correct_time';
 END IF;
 PERFORM 1 FROM public.profiles WHERE id=v_employee FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Funcionário não cadastrado' USING ERRCODE='22023'; END IF;
 IF (p_effective_at AT TIME ZONE v_store.tz)::date NOT BETWEEN v_day AND v_day+1
    OR (p_effective_at AT TIME ZONE v_store.tz)::date=v_day+1
       AND (p_effective_at AT TIME ZONE v_store.tz)::time>time '12:00'
 THEN RAISE EXCEPTION 'Correção deve pertencer à jornada informada (até meio-dia seguinte)'
  USING ERRCODE='22023'; END IF;
 IF v_action='correct_time' THEN
   IF p_effective_at=v_old THEN
    RAISE EXCEPTION 'O novo horário deve ser diferente do atual' USING ERRCODE='22023'; END IF;
   UPDATE public.time_clock_punches SET effective_at=p_effective_at
   WHERE id=p_punch RETURNING id INTO v_id;
 ELSE
   INSERT INTO public.time_clock_punches(
     user_id,store_id,work_date,kind,recorded_at,effective_at,source)
   VALUES(v_employee,v_store.id,v_day,v_kind,clock_timestamp(),p_effective_at,'admin')
   RETURNING id INTO v_id;
 END IF;
 -- Proíbe correções que criariam sequência fora de ordem, tempos iguais
 -- ou intervalos menores que um minuto.
 FOR v_row IN SELECT kind,effective_at FROM public.time_clock_punches
   WHERE user_id=v_employee AND work_date=v_day
   ORDER BY effective_at,id LOOP
   IF v_expected_pos>4 OR v_row.kind IS DISTINCT FROM v_order[v_expected_pos]
    OR (v_prior IS NOT NULL AND v_row.effective_at-v_prior<interval '1 minute')
   THEN RAISE EXCEPTION 'Correção quebra a sequência entrada / almoço / retorno / saída'
     USING ERRCODE='22023'; END IF;
   v_prior:=v_row.effective_at;
   v_expected_pos:=v_expected_pos+1;
 END LOOP;
 INSERT INTO public.time_clock_audit(
  punch_id,user_id,action,previous_at,new_at,reason,changed_by)
 VALUES(v_id,v_employee,v_action,v_old,p_effective_at,btrim(p_reason),v_actor);
 RETURN jsonb_build_object('id',v_id,'action',v_action,'user_id',v_employee,
    'work_date',v_day,'kind',v_kind,'previous_at',v_old,
    'effective_at',p_effective_at,'adjusted_by',v_actor);
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.time_clock_admin_adjust(uuid,uuid,date,text,timestamptz,text)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.time_clock_admin_adjust(uuid,uuid,date,text,timestamptz,text)
 TO authenticated;

CREATE OR REPLACE FUNCTION public.time_clock_audit_history(
 p_user uuid,p_from date,p_to date,p_limit integer DEFAULT 100
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE v_actor uuid:=auth.uid();v_target uuid;v_rows jsonb;
BEGIN
 IF NOT public.time_clock_can_punch() THEN
  RAISE EXCEPTION 'Sessão inválida' USING ERRCODE='42501';END IF;
 v_target:=coalesce(p_user,v_actor);
 IF v_target<>v_actor AND NOT public.time_clock_can_manage() THEN
   RAISE EXCEPTION 'Auditoria de terceiros restrita à gerência' USING ERRCODE='42501';END IF;
 IF p_from IS NULL OR p_to IS NULL OR p_to<p_from OR p_to-p_from>366
  OR p_limit NOT BETWEEN 1 AND 500
 THEN RAISE EXCEPTION 'Período de auditoria inválido' USING ERRCODE='22023';END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
   'id',a.id,'punch_id',a.punch_id,'work_date',p.work_date,
   'kind',p.kind,'action',a.action,'previous_at',a.previous_at,
   'new_at',a.new_at,'reason',a.reason,
   'changed_by',a.changed_by,'changed_by_name',
   coalesce(actor.full_name,actor.email,'Usuário'),'changed_at',a.changed_at)
   ORDER BY a.changed_at DESC),'[]'::jsonb) INTO v_rows
 FROM (SELECT * FROM public.time_clock_audit
   WHERE user_id=v_target ORDER BY changed_at DESC LIMIT p_limit) a
 JOIN public.time_clock_punches p ON p.id=a.punch_id
 LEFT JOIN public.profiles actor ON actor.id=a.changed_by
 WHERE p.work_date BETWEEN p_from AND p_to;
 RETURN v_rows;
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.time_clock_audit_history(uuid,date,date,integer)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.time_clock_audit_history(uuid,date,date,integer)
 TO authenticated;
