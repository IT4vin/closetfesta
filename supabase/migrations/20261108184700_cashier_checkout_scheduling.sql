-- Compatibilidade: caixa já podia criar contrato, mas não reagendar livremente na agenda.
CREATE OR REPLACE FUNCTION public.closet_schedule_contract_visit(p_contract_id uuid, p_kind text, p_day date, p_time text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 v_actor uuid:=auth.uid();
 v_client uuid;
 v_status text;
 v_owner uuid;
 v_created_at timestamptz;
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
    public.has_role(v_actor,'staff'::public.app_role) OR
    public.has_role(v_actor,'cashier'::public.app_role)
 ) THEN RAISE EXCEPTION 'Seu perfil não pode agendar atendimentos' USING ERRCODE='42501'; END IF;
 IF p_contract_id IS NULL OR p_day IS NULL OR p_kind NOT IN ('Prova','Retirada')
   OR p_time IS NULL OR p_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
 THEN RAISE EXCEPTION 'Informe contrato, tipo, data e horário válidos' USING ERRCODE='22023'; END IF;
 SELECT client_id,status,created_by,created_at INTO v_client,v_status,v_owner,v_created_at
 FROM public.rental_contracts WHERE id=p_contract_id FOR UPDATE;
 IF v_client IS NULL OR v_status IN ('cancelled','completed') THEN
   RAISE EXCEPTION 'Contrato não encontrado ou encerrado para agendamento' USING ERRCODE='22023';
 END IF;
 -- Caixas podem reservar horário apenas nos contratos que acabaram de criar
 -- pelo PDV. Alterações posteriores são responsabilidade da agenda da loja.
 IF public.has_role(v_actor,'cashier'::public.app_role)
    AND NOT (
      public.has_role(v_actor,'admin'::public.app_role) OR
      public.has_role(v_actor,'manager'::public.app_role) OR
      public.has_role(v_actor,'staff'::public.app_role)
    )
    AND (v_owner IS DISTINCT FROM v_actor OR v_created_at<now()-interval '10 minutes')
 THEN
   RAISE EXCEPTION 'Caixa só pode registrar horários em seus contratos recém-criados'
     USING ERRCODE='42501';
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
