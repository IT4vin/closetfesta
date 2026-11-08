-- Agenda única para contratos, provas, retiradas e devoluções.
-- A tabela appointments já registra compromissos manuais. Os agendamentos
-- vinculados ao contrato são gravados na mesma transação que cria a locação.
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS contract_id uuid REFERENCES public.rental_contracts(id) ON DELETE RESTRICT;
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';
ALTER TABLE public.appointments
  ADD CONSTRAINT closet_appointments_source_valid
  CHECK (source IN ('manual','contract') AND
        (source <> 'contract' OR (contract_id IS NOT NULL AND title IN ('Prova','Retirada'))));

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_one_active_contract_kind
 ON public.appointments (contract_id,title)
 WHERE source='contract' AND status <> 'cancelled';
CREATE INDEX IF NOT EXISTS idx_appointments_month ON public.appointments(start_at) WHERE status<>'cancelled';
CREATE INDEX IF NOT EXISTS idx_rental_item_try_on_calendar ON public.rental_items(try_on_date) WHERE status<>'cancelled';
CREATE INDEX IF NOT EXISTS idx_rental_item_pickup_calendar ON public.rental_items(pickup_date) WHERE status<>'cancelled';
CREATE INDEX IF NOT EXISTS idx_rental_item_return_calendar ON public.rental_items(return_date) WHERE status<>'cancelled';

-- Capacidade inicial: 3 atendimentos simultâneos. Administração pode ajustar
-- no editor existente de Configurações > Operações.
UPDATE public.settings
SET value=jsonb_set(value,'{max_per_slot}','3'::jsonb,true),
    updated_at=now()
WHERE key='closet_festa.config.v1.operations' AND NOT (value ? 'max_per_slot');

-- Corrige configuração contraditória já existente: retirada encerrava às 11:00,
-- exatamente no horário de abertura da costura. Regra operacional da loja: 17:30.
UPDATE public.settings
SET value=jsonb_set(value,'{pickup_close}','"17:30"'::jsonb,true),
    updated_at=now()
WHERE key='closet_festa.config.v1.company'
  AND value->>'pickup_close'='11:00'
  AND value->>'sewing_open'='11:00';

-- Agenda única: os contratos anteriores têm datas mas não horários. Eles aparecem
-- no calendário como "Horário a definir", sem criar agendamentos fictícios.
CREATE OR REPLACE FUNCTION public.closet_calendar_month(p_start date,p_end date)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $function$
DECLARE v_result jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT (
   public.has_role(auth.uid(),'admin'::public.app_role) OR
   public.has_role(auth.uid(),'manager'::public.app_role) OR
   public.has_role(auth.uid(),'staff'::public.app_role) OR
   public.has_role(auth.uid(),'cashier'::public.app_role)
 ) THEN RAISE EXCEPTION 'Sem permissão para visualizar agenda' USING ERRCODE='42501'; END IF;
 IF p_start IS NULL OR p_end IS NULL OR p_start>p_end OR p_end-p_start>62
 THEN RAISE EXCEPTION 'Informe intervalo de até 63 dias para a agenda' USING ERRCODE='22023'; END IF;

 WITH planned AS (
   SELECT DISTINCT
     c.id AS contract_id,c.contract_number,cl.full_name AS client_name,
     v.kind,v.visit_day
   FROM public.rental_items i
   JOIN public.rental_contracts c ON c.id=i.contract_id
   JOIN public.clients cl ON cl.id=c.client_id
   CROSS JOIN LATERAL (VALUES
     ('Prova'::text,i.try_on_date),
     ('Retirada'::text,i.pickup_date),
     ('Devolução'::text,i.return_date)
   ) v(kind,visit_day)
   WHERE i.status<>'cancelled' AND c.status<>'cancelled'
     AND v.visit_day BETWEEN p_start AND p_end
 ), booked AS (
   SELECT a.id,a.contract_id,a.title AS kind,
     (a.start_at AT TIME ZONE 'America/Sao_Paulo')::date AS visit_day,
     to_char(a.start_at AT TIME ZONE 'America/Sao_Paulo','HH24:MI') AS visit_time,
     a.start_at,a.end_at,a.status,a.description,
     c.contract_number,cl.full_name AS client_name
   FROM public.appointments a
   LEFT JOIN public.rental_contracts c ON c.id=a.contract_id
   JOIN public.clients cl ON cl.id=a.client_id
   WHERE a.status<>'cancelled'
     AND (a.start_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN p_start AND p_end
     AND (c.id IS NULL OR c.status<>'cancelled')
 ), events AS (
   SELECT ('appointment:'||b.id::text) AS id,b.contract_id,b.contract_number,
     b.client_name,b.kind,b.visit_day,b.visit_time,b.status,
     'appointment'::text AS source,b.description
   FROM booked b
   UNION ALL
   SELECT ('contract:'||p.contract_id::text||':'||p.kind||':'||p.visit_day::text),
     p.contract_id,p.contract_number,p.client_name,p.kind,p.visit_day,
     NULL::text,'unscheduled'::text,'contract_date'::text,NULL::text
   FROM planned p
   WHERE NOT EXISTS (
     SELECT 1 FROM booked b
     WHERE b.contract_id=p.contract_id AND b.kind=p.kind AND b.visit_day=p.visit_day
   )
 )
 SELECT COALESCE(jsonb_agg(jsonb_build_object(
  'id',e.id,'contract_id',e.contract_id,'contract_number',e.contract_number,
  'client_name',e.client_name,'kind',e.kind,'day',e.visit_day,
  'time',e.visit_time,'status',e.status,'source',e.source,'description',e.description
 ) ORDER BY e.visit_day,e.visit_time NULLS LAST,e.kind,e.client_name),'[]'::jsonb)
 INTO v_result FROM events e;
 RETURN jsonb_build_object('events',COALESCE(v_result,'[]'::jsonb),
    'start',p_start,'end',p_end);
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.closet_calendar_month(date,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.closet_calendar_month(date,date) TO authenticated;

-- Verificador de ocupação do horário; trigger de appointments é autoridade final.
CREATE OR REPLACE FUNCTION public.closet_visit_slot_capacity(
 p_kind text,p_day date,p_time text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $function$
DECLARE
 v_cfg jsonb:='{}'::jsonb;
 v_company jsonb:='{}'::jsonb;
 v_minutes int;
 v_interval int;
 v_limit int;
 v_occupied int;
 v_start timestamptz;
 v_end timestamptz;
 v_local_start timestamp;
 v_local_end timestamp;
 v_earliest text;
 v_latest text;
 v_reason text:=NULL;
 v_notice int;
BEGIN
 IF auth.uid() IS NULL OR NOT (
  public.has_role(auth.uid(),'admin'::public.app_role) OR
  public.has_role(auth.uid(),'manager'::public.app_role) OR
  public.has_role(auth.uid(),'staff'::public.app_role) OR
  public.has_role(auth.uid(),'cashier'::public.app_role)
 ) THEN RAISE EXCEPTION 'Operador sem permissão de agenda' USING ERRCODE='42501'; END IF;
 IF p_kind NOT IN ('Prova','Retirada') OR p_day IS NULL OR
    p_time IS NULL OR p_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
 THEN RAISE EXCEPTION 'Tipo, data ou horário inválidos' USING ERRCODE='22023'; END IF;
 SELECT value INTO v_cfg FROM public.settings WHERE key='closet_festa.config.v1.operations';
 SELECT value INTO v_company FROM public.settings WHERE key='closet_festa.config.v1.company';
 v_cfg:=COALESCE(v_cfg,'{}'::jsonb);
 v_company:=COALESCE(v_company,'{}'::jsonb);
 v_limit:=CASE WHEN (v_cfg->>'max_per_slot') ~ '^[0-9]+$'
  THEN LEAST(100,GREATEST(1,(v_cfg->>'max_per_slot')::int)) ELSE 3 END;
 v_minutes:=CASE WHEN (v_cfg->>(CASE WHEN p_kind='Prova' THEN 'fitting_minutes' ELSE 'pickup_minutes' END)) ~ '^[0-9]+$'
  THEN LEAST(480,GREATEST(5,(v_cfg->>(CASE WHEN p_kind='Prova' THEN 'fitting_minutes' ELSE 'pickup_minutes' END))::int))
  ELSE 30 END;
 v_interval:=CASE WHEN (v_cfg->>'interval_minutes') ~ '^[0-9]+$'
  THEN LEAST(240,(v_cfg->>'interval_minutes')::int) ELSE 0 END;
 v_notice:=CASE WHEN (v_cfg->>'min_notice_hours') ~ '^[0-9]+$'
  THEN LEAST(8760,(v_cfg->>'min_notice_hours')::int) ELSE 0 END;
 v_local_start:=p_day::timestamp+p_time::time;
 v_local_end:=v_local_start+v_minutes*interval '1 minute';
 v_start:=v_local_start AT TIME ZONE 'America/Sao_Paulo';
 v_end:=v_local_end AT TIME ZONE 'America/Sao_Paulo';
 SELECT count(*)::int INTO v_occupied
  FROM public.appointments a
  WHERE a.status<>'cancelled'
    AND a.start_at<v_end+v_interval*interval '1 minute'
    AND a.end_at+v_interval*interval '1 minute'>v_start;
 v_earliest:=CASE WHEN p_kind='Prova' THEN COALESCE(NULLIF(v_company->>'fitting_open',''),v_company->>'store_open')
                       ELSE COALESCE(NULLIF(v_company->>'sewing_open',''),v_company->>'store_open') END;
 v_latest:=CASE WHEN p_kind='Prova' THEN COALESCE(NULLIF(v_company->>'fitting_close',''),v_company->>'store_close')
                       ELSE COALESCE(NULLIF(v_company->>'pickup_close',''),NULLIF(v_company->>'sewing_close',''),v_company->>'store_close') END;
 IF v_occupied>=v_limit THEN v_reason:='Limite de atendimentos simultâneos atingido'; END IF;
 IF v_earliest ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
   AND v_local_start::time<v_earliest::time THEN v_reason:='Horário anterior ao início do atendimento'; END IF;
 IF v_latest ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
   AND v_local_end::time>v_latest::time THEN v_reason:='Horário posterior ao encerramento do atendimento'; END IF;
 IF v_company->>'store_open' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
   AND v_local_start::time<(v_company->>'store_open')::time THEN v_reason:='Loja ainda fechada'; END IF;
 IF v_company->>'store_close' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
   AND v_local_end::time>(v_company->>'store_close')::time THEN v_reason:='Loja fechada'; END IF;
 IF v_notice>0 AND v_start<now()+v_notice*interval '1 hour'
 THEN v_reason:='Antecedência mínima não atendida'; END IF;
 IF p_day::text=ANY(string_to_array(COALESCE(v_cfg->>'blocked_dates',''),','))
 THEN v_reason:='Data bloqueada na agenda'; END IF;
 RETURN jsonb_build_object('kind',p_kind,'day',p_day,'time',p_time,
  'occupied',v_occupied,'capacity',v_limit,'available',v_reason IS NULL,
  'reason',v_reason,'duration_minutes',v_minutes);
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.closet_visit_slot_capacity(text,date,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.closet_visit_slot_capacity(text,date,text) TO authenticated;

-- Horários podem ser definidos/reagendados inclusive para contratos anteriores.
-- O banco valida se a data está realmente no contrato, horário de funcionamento,
-- capacidade, intervalos e conflitos de um mesmo cliente.
CREATE OR REPLACE FUNCTION public.closet_schedule_contract_visit(
 p_contract_id uuid,p_kind text,p_day date,p_time text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $function$
DECLARE
 v_actor uuid:=auth.uid();
 v_client uuid;
 v_status text;
 v_cfg jsonb;
 v_minutes int:=30;
 v_existing uuid;
 v_start timestamptz;
 v_end timestamptz;
 v_id uuid;
BEGIN
 IF v_actor IS NULL OR NOT (
    public.has_role(v_actor,'admin'::public.app_role) OR
    public.has_role(v_actor,'manager'::public.app_role) OR
    public.has_role(v_actor,'staff'::public.app_role)
 ) THEN RAISE EXCEPTION 'Seu perfil não pode agendar atendimentos' USING ERRCODE='42501'; END IF;
 IF p_contract_id IS NULL OR p_day IS NULL OR p_kind NOT IN ('Prova','Retirada')
   OR p_time IS NULL OR p_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
 THEN RAISE EXCEPTION 'Informe contrato, tipo, data e horário válidos' USING ERRCODE='22023'; END IF;
 SELECT client_id,status INTO v_client,v_status
 FROM public.rental_contracts WHERE id=p_contract_id FOR UPDATE;
 IF v_client IS NULL OR v_status IN ('cancelled','completed') THEN
   RAISE EXCEPTION 'Contrato não encontrado ou encerrado para agendamento' USING ERRCODE='22023';
 END IF;
 IF NOT EXISTS (
  SELECT 1 FROM public.rental_items i
  WHERE i.contract_id=p_contract_id AND i.status<>'cancelled'
    AND (CASE WHEN p_kind='Prova' THEN i.try_on_date ELSE i.pickup_date END)=p_day
 ) THEN RAISE EXCEPTION 'A data escolhida não consta na prova/retirada do contrato' USING ERRCODE='22023'; END IF;
 SELECT value INTO v_cfg FROM public.settings
 WHERE key='closet_festa.config.v1.operations';
 v_cfg:=COALESCE(v_cfg,'{}'::jsonb);
 IF (v_cfg->>(CASE WHEN p_kind='Prova' THEN 'fitting_minutes' ELSE 'pickup_minutes' END)) ~ '^[0-9]+$'
 THEN v_minutes:=LEAST(480,GREATEST(5,(v_cfg->>(CASE WHEN p_kind='Prova' THEN 'fitting_minutes' ELSE 'pickup_minutes' END))::int)); END IF;
 v_start:=(p_day::timestamp+p_time::time) AT TIME ZONE 'America/Sao_Paulo';
 v_end:=v_start+v_minutes*interval '1 minute';
 -- Serializar reagendamentos do mesmo contrato/tipo.
 PERFORM pg_advisory_xact_lock(hashtextextended(p_contract_id::text||p_kind,0));
 SELECT id INTO v_existing FROM public.appointments
 WHERE contract_id=p_contract_id AND title=p_kind
   AND source='contract' AND status<>'cancelled' FOR UPDATE;
 IF v_existing IS NULL THEN
  INSERT INTO public.appointments
    (client_id,title,start_at,end_at,status,created_by,contract_id,source,metadata)
  VALUES (v_client,p_kind,v_start,v_end,'scheduled',v_actor,p_contract_id,'contract',
          jsonb_build_object('origin','rental_contract'))
  RETURNING id INTO v_id;
 ELSE
  UPDATE public.appointments
  SET start_at=v_start,end_at=v_end,updated_at=now()
  WHERE id=v_existing RETURNING id INTO v_id;
 END IF;
 RETURN jsonb_build_object('id',v_id,'contract_id',p_contract_id,'kind',p_kind,
 'day',p_day,'time',p_time,'status','scheduled');
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.closet_schedule_contract_visit(uuid,text,date,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.closet_schedule_contract_visit(uuid,text,date,text) TO authenticated;

-- Remover horários antigos quando o contrato é cancelado.
CREATE OR REPLACE FUNCTION public.closet_cancel_contract_visits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
BEGIN
 IF NEW.status='cancelled' AND OLD.status IS DISTINCT FROM NEW.status THEN
  UPDATE public.appointments SET status='cancelled'
  WHERE contract_id=NEW.id AND source='contract' AND status<>'cancelled';
 END IF;
 RETURN NEW;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.closet_cancel_contract_visits() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS trg_cancel_contract_visits ON public.rental_contracts;
CREATE TRIGGER trg_cancel_contract_visits AFTER UPDATE OF status ON public.rental_contracts
 FOR EACH ROW EXECUTE FUNCTION public.closet_cancel_contract_visits();

-- Se a prova/retirada do item mudar de data ou o item for cancelado, os horários
-- que não correspondem mais a nenhum item ativo do mesmo contrato são cancelados.
CREATE OR REPLACE FUNCTION public.closet_cancel_outdated_contract_visits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
BEGIN
 IF (OLD.try_on_date,OLD.pickup_date,OLD.status)
  IS NOT DISTINCT FROM (NEW.try_on_date,NEW.pickup_date,NEW.status)
 THEN RETURN NEW; END IF;
 UPDATE public.appointments a SET status='cancelled'
 WHERE a.contract_id=NEW.contract_id AND a.source='contract' AND a.status<>'cancelled'
 AND a.title IN ('Prova','Retirada')
 AND NOT EXISTS (
   SELECT 1 FROM public.rental_items i
   WHERE i.contract_id=NEW.contract_id AND i.status<>'cancelled'
     AND (CASE WHEN a.title='Prova' THEN i.try_on_date ELSE i.pickup_date END)=
       (a.start_at AT TIME ZONE 'America/Sao_Paulo')::date
 );
 RETURN NEW;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.closet_cancel_outdated_contract_visits() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS trg_cancel_outdated_contract_visits ON public.rental_items;
CREATE TRIGGER trg_cancel_outdated_contract_visits
 AFTER UPDATE OF try_on_date,pickup_date,status ON public.rental_items
 FOR EACH ROW EXECUTE FUNCTION public.closet_cancel_outdated_contract_visits();
