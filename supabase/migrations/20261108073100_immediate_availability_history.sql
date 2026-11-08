-- Disponibilidade consultada ao inserir traje/alterar datas, sem esperar fechamento.
-- Segurança: somente operador autenticado com acesso às locações.
CREATE OR REPLACE FUNCTION public.rental_check_product_availability(
  p_product_id uuid, p_pickup date, p_return date, p_quantity integer DEFAULT 1
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $check$
DECLARE
  v_free int;
  v_total int;
  v_history jsonb;
  v_conflicts jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT (
    public.has_role(auth.uid(),'admin'::public.app_role) OR
    public.has_role(auth.uid(),'manager'::public.app_role) OR
    public.has_role(auth.uid(),'staff'::public.app_role) OR
    public.has_role(auth.uid(),'cashier'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Operador sem permissão de consulta de locações' USING ERRCODE='42501';
  END IF;
  IF p_product_id IS NULL OR p_pickup IS NULL OR p_return IS NULL
     OR p_pickup > p_return OR p_quantity NOT BETWEEN 1 AND 20 THEN
    RAISE EXCEPTION 'Produto, datas ou quantidade inválidos' USING ERRCODE='22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.products
    WHERE id=p_product_id AND active AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Produto não encontrado ou inativo' USING ERRCODE='22023';
  END IF;

  SELECT count(*)::int INTO v_total FROM public.product_units u
    WHERE u.product_id=p_product_id AND u.status='available';
  SELECT count(*)::int INTO v_free FROM public.product_units u
    WHERE u.product_id=p_product_id AND u.status='available'
      AND NOT EXISTS (
        SELECT 1 FROM public.rental_items ri
        WHERE ri.unit_id=u.id AND ri.status IN ('confirmed','picked_up')
          AND daterange(ri.pickup_date,ri.return_date,'[]') &&
              daterange(p_pickup,p_return,'[]')
      );

  -- Histórico completo: sem corte de datas e incluindo concluídos e cancelados,
  -- sem divulgar documentos, telefone ou recebimentos do cliente.
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id',i.id,'contract_id',i.contract_id,'contract_number',c.contract_number,
    'contract_status',c.status,
    'unit_number',u.unit_number,
    'try_on_date',i.try_on_date,'pickup_date',i.pickup_date,
    'event_date',i.event_date,'return_date',i.return_date,
    'actual_return_at',i.actual_return_at,'status',i.status,
    'override',i.conflict_override
  ) ORDER BY i.pickup_date DESC,i.created_at DESC,i.id), '[]'::jsonb)
    INTO v_history
    FROM public.rental_items i
    JOIN public.rental_contracts c ON c.id=i.contract_id
    JOIN public.product_units u ON u.id=i.unit_id
   WHERE i.product_id=p_product_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id',i.id,'contract_id',i.contract_id,'contract_number',c.contract_number,
    'unit_number',u.unit_number,'pickup_date',i.pickup_date,
    'event_date',i.event_date,'return_date',i.return_date,'status',i.status
  ) ORDER BY i.pickup_date DESC,i.id),'[]'::jsonb)
    INTO v_conflicts
    FROM public.rental_items i
    JOIN public.rental_contracts c ON c.id=i.contract_id
    JOIN public.product_units u ON u.id=i.unit_id
   WHERE i.product_id=p_product_id
     AND i.status IN ('confirmed','picked_up')
     AND daterange(i.pickup_date,i.return_date,'[]') &&
         daterange(p_pickup,p_return,'[]');

  RETURN jsonb_build_object(
    'product_id',p_product_id,'pickup_date',p_pickup,'return_date',p_return,
    'requested_quantity',p_quantity,'free_units',v_free,
    'physical_available_units',v_total,'available',v_free>=p_quantity,
    'history',v_history,'conflicts',v_conflicts
  );
END;
$check$;
REVOKE EXECUTE ON FUNCTION public.rental_check_product_availability(uuid,date,date,integer)
  FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rental_check_product_availability(uuid,date,date,integer)
  TO authenticated;
