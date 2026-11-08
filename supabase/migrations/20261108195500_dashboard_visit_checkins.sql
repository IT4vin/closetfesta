-- Confirmação de comparecimento na dashboard: independente de movimentar o estoque.
-- Presença em "Retirada" ou "Devolução" NÃO marca o traje como entregue/devolvido.
-- Essas movimentações seguem os RPCs transacionais rental_confirm_pickup/return.
CREATE TABLE public.rental_visit_checkins (
  contract_id uuid NOT NULL REFERENCES public.rental_contracts(id) ON DELETE RESTRICT,
  kind text NOT NULL CHECK(kind IN ('prova','retirada','devolucao')),
  visit_day date NOT NULL,
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  confirmed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  PRIMARY KEY (contract_id,kind,visit_day)
);
CREATE INDEX idx_rental_visit_checkins_day ON public.rental_visit_checkins(visit_day,kind);
ALTER TABLE public.rental_visit_checkins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rental_visit_checkins FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.rental_visit_checkins TO authenticated;
CREATE POLICY "Equipe consulta confirmacoes de comparecimento"
  ON public.rental_visit_checkins FOR SELECT TO authenticated
  USING (
    public.has_role((SELECT auth.uid()),'admin'::public.app_role)
    OR public.has_role((SELECT auth.uid()),'manager'::public.app_role)
    OR public.has_role((SELECT auth.uid()),'staff'::public.app_role)
    OR public.has_role((SELECT auth.uid()),'cashier'::public.app_role)
  );

CREATE OR REPLACE FUNCTION public.closet_dashboard_visits(
  p_period text,
  p_kind text DEFAULT NULL,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 30
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_counts jsonb;
  v_records jsonb;
  v_selected_total integer;
BEGIN
  IF auth.uid() IS NULL OR NOT (
    public.has_role(auth.uid(),'admin'::public.app_role) OR
    public.has_role(auth.uid(),'manager'::public.app_role) OR
    public.has_role(auth.uid(),'staff'::public.app_role) OR
    public.has_role(auth.uid(),'cashier'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Seu perfil não pode consultar os comparecimentos'
      USING ERRCODE='42501';
  END IF;
  IF p_period NOT IN ('overdue','today','next10')
    OR (p_kind IS NOT NULL AND p_kind NOT IN ('prova','retirada','devolucao'))
    OR p_limit NOT BETWEEN 1 AND 100 OR p_offset NOT BETWEEN 0 AND 1000000
  THEN RAISE EXCEPTION 'Período, operação ou paginação inválidos' USING ERRCODE='22023'; END IF;

  WITH scheduled AS (
    SELECT
      c.id AS contract_id,c.contract_number,cl.full_name AS client_name,
      v.kind,v.visit_day,
      count(*)::int AS items_total,
      bool_and(CASE
        WHEN v.kind='retirada' THEN i.picked_up_at IS NOT NULL
        WHEN v.kind='devolucao' THEN i.actual_return_at IS NOT NULL
        ELSE false END) AS physical_complete
    FROM public.rental_items i
    JOIN public.rental_contracts c ON c.id=i.contract_id
    JOIN public.clients cl ON cl.id=c.client_id
    CROSS JOIN LATERAL (VALUES
      ('prova'::text,i.try_on_date),
      ('retirada'::text,i.pickup_date),
      ('devolucao'::text,i.return_date)
    ) v(kind,visit_day)
    WHERE i.status<>'cancelled' AND c.status<>'cancelled'
      AND v.visit_day IS NOT NULL
      AND CASE p_period
       WHEN 'today' THEN v.visit_day=v_today
       WHEN 'next10' THEN v.visit_day>v_today AND v.visit_day<=v_today+10
       ELSE v.visit_day<v_today END
    GROUP BY c.id,c.contract_number,cl.full_name,v.kind,v.visit_day
  ), details AS (
    SELECT s.*,
       checked.confirmed_at, checked.confirmed_by,
       coalesce(checked.confirmed_at IS NOT NULL, false) OR s.physical_complete AS completed,
       (SELECT to_char(a.start_at AT TIME ZONE 'America/Sao_Paulo','HH24:MI')
        FROM public.appointments a
        WHERE a.contract_id=s.contract_id
          AND a.status<>'cancelled'
          AND a.title=CASE s.kind WHEN 'prova' THEN 'Prova'
                                 WHEN 'retirada' THEN 'Retirada'
                                 ELSE 'Devolução' END
          AND (a.start_at AT TIME ZONE 'America/Sao_Paulo')::date=s.visit_day
        ORDER BY a.start_at LIMIT 1
       ) AS visit_time
    FROM scheduled s
    LEFT JOIN public.rental_visit_checkins checked
      ON checked.contract_id=s.contract_id AND checked.kind=s.kind
        AND checked.visit_day=s.visit_day
  ), in_period AS (
    SELECT * FROM details
    WHERE p_period<>'overdue' OR NOT completed
  ), category_counts AS (
    SELECT kind,count(*)::int AS total,count(*) FILTER(WHERE completed)::int AS done
    FROM in_period GROUP BY kind
  ), filtered AS (
    SELECT * FROM in_period
    WHERE p_kind IS NULL OR kind=p_kind
  ), page AS (
    SELECT * FROM filtered
    ORDER BY visit_day,visit_time NULLS LAST,contract_number,kind
    LIMIT p_limit OFFSET p_offset
  )
  SELECT
    COALESCE((SELECT jsonb_object_agg(kind,jsonb_build_object(
      'total',total,'confirmed',done,'pending',total-done)) FROM category_counts),'{}'::jsonb),
    COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'contract_id',x.contract_id,'contract_number',x.contract_number,
      'client_name',x.client_name,'kind',x.kind,'day',x.visit_day,
      'time',x.visit_time,'items_total',x.items_total,
      'confirmed',x.completed,'confirmed_at',x.confirmed_at,
      'confirmed_by',x.confirmed_by,
      'physical_complete',x.physical_complete
    ) ORDER BY x.visit_day,x.visit_time NULLS LAST,x.contract_number,x.kind)
    FROM page x),'[]'::jsonb),
    (SELECT count(*)::int FROM filtered)
  INTO v_counts,v_records,v_selected_total;

  RETURN jsonb_build_object('period',p_period,'kind',p_kind,
    'today',v_today,'counts',v_counts,'rows',v_records,
    'total',v_selected_total,'offset',p_offset,'limit',p_limit);
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.closet_dashboard_visits(text,text,integer,integer)
  FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.closet_dashboard_visits(text,text,integer,integer)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.closet_confirm_visit_attendance(
  p_contract_ids uuid[],p_kind text,p_day date
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_requested integer;
  v_valid integer;
  v_inserted integer;
BEGIN
  IF v_actor IS NULL OR NOT (
    public.has_role(v_actor,'admin'::public.app_role)
    OR public.has_role(v_actor,'manager'::public.app_role)
    OR public.has_role(v_actor,'staff'::public.app_role)
    OR public.has_role(v_actor,'cashier'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Sem permissão para confirmar comparecimentos'
      USING ERRCODE='42501';
  END IF;
  IF p_contract_ids IS NULL OR cardinality(p_contract_ids) NOT BETWEEN 1 AND 100
    OR array_position(p_contract_ids,NULL) IS NOT NULL
    OR p_kind NOT IN ('prova','retirada','devolucao')
    OR p_day IS NULL OR p_day>v_today
  THEN
    RAISE EXCEPTION 'Confira os pedidos, tipo e data. Não é possível confirmar presença futura'
      USING ERRCODE='22023';
  END IF;
  SELECT count(*)::int INTO v_requested
  FROM (SELECT DISTINCT id FROM unnest(p_contract_ids) AS ids(id)) a;

  -- Trava os pedidos para evitar que um cancelamento simultâneo passe despercebido.
  PERFORM 1 FROM public.rental_contracts c
  WHERE c.id IN (SELECT DISTINCT id FROM unnest(p_contract_ids) AS ids(id))
  ORDER BY c.id FOR SHARE;

  SELECT count(DISTINCT c.id)::int INTO v_valid
    FROM public.rental_contracts c
    JOIN public.rental_items i ON i.contract_id=c.id
   WHERE c.id=ANY(p_contract_ids)
     AND c.status<>'cancelled' AND i.status<>'cancelled'
     AND (CASE p_kind
       WHEN 'prova' THEN i.try_on_date
       WHEN 'retirada' THEN i.pickup_date
       ELSE i.return_date END)=p_day;
  IF v_valid<>v_requested THEN
    RAISE EXCEPTION 'Um ou mais pedidos não possuem esse compromisso ativo na data informada'
      USING ERRCODE='22023';
  END IF;

  INSERT INTO public.rental_visit_checkins
    (contract_id,kind,visit_day,confirmed_by)
  SELECT DISTINCT id,p_kind,p_day,v_actor
  FROM unnest(p_contract_ids) AS selected(id)
  ON CONFLICT (contract_id,kind,visit_day) DO NOTHING;
  GET DIAGNOSTICS v_inserted=ROW_COUNT;
  RETURN jsonb_build_object('confirmed',v_requested,
    'new_confirmations',v_inserted,'kind',p_kind,'day',p_day);
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.closet_confirm_visit_attendance(uuid[],text,date)
  FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.closet_confirm_visit_attendance(uuid[],text,date)
  TO authenticated;
