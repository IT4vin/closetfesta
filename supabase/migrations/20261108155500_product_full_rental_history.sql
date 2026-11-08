-- Histórico integral de locações por produto, inclusive canceladas.
-- Consulta paginada no servidor para não omitir contratos antigos depois de 100/1000 registros.
-- SECURITY INVOKER mantém RLS dos produtos, itens, contratos, clientes e exemplares.
CREATE INDEX IF NOT EXISTS idx_rental_items_product_history
  ON public.rental_items(product_id, created_at DESC, id DESC);

CREATE OR REPLACE FUNCTION public.rental_product_full_history(
  p_product_id uuid,
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $body$
DECLARE
  v_total bigint := 0;
  v_contract_count bigint := 0;
  v_historical_value numeric(18,2) := 0;
  v_valid_value numeric(18,2) := 0;
  v_out_value numeric(18,2) := 0;
  v_cancelled_count bigint := 0;
  v_rows jsonb := '[]'::jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT (
    public.has_role(auth.uid(),'admin'::public.app_role) OR
    public.has_role(auth.uid(),'manager'::public.app_role) OR
    public.has_role(auth.uid(),'staff'::public.app_role) OR
    public.has_role(auth.uid(),'cashier'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Operador não autorizado a consultar histórico de locações'
      USING ERRCODE='42501';
  END IF;
  IF p_product_id IS NULL OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100
    OR p_offset IS NULL OR p_offset < 0 OR p_offset > 100000000
  THEN
    RAISE EXCEPTION 'Produto ou paginação inválidos' USING ERRCODE='22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE id=p_product_id) THEN
    RAISE EXCEPTION 'Produto não encontrado ou sem permissão'
      USING ERRCODE='P0002';
  END IF;

  -- Totais de TODO o histórico, não apenas da página exibida.
  -- Valores históricos não são receita recebida; incluem itens cancelados.
  SELECT count(*)::bigint,
         count(DISTINCT i.contract_id)::bigint,
         COALESCE(sum(i.unit_price-i.discount),0),
         COALESCE(sum(i.unit_price-i.discount) FILTER (
           WHERE i.status<>'cancelled' AND c.status<>'cancelled'
         ),0),
         COALESCE(sum(i.unit_price-i.discount) FILTER (
           WHERE i.status<>'cancelled' AND c.status<>'cancelled'
             AND (i.picked_up_at IS NOT NULL OR i.status='returned')
         ),0),
         count(*) FILTER (
           WHERE i.status='cancelled' OR c.status='cancelled'
         )::bigint
    INTO v_total,v_contract_count,v_historical_value,v_valid_value,
         v_out_value,v_cancelled_count
    FROM public.rental_items i
    JOIN public.rental_contracts c ON c.id=i.contract_id
   WHERE i.product_id=p_product_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', h.id,
    'contract_id',h.contract_id,
    'contract_number',h.contract_number,
    'contract_status',h.contract_status,
    'customer_name',h.customer_name,
    'unit_number',h.unit_number,
    'try_on_date',h.try_on_date,
    'pickup_date',h.pickup_date,
    'event_date',h.event_date,
    'return_date',h.return_date,
    'actual_return_at',h.actual_return_at,
    'picked_up_at',h.picked_up_at,
    'status',h.status,
    'unit_price',h.unit_price,
    'discount',h.discount,
    'conflict_override',h.conflict_override
  ) ORDER BY h.created_at DESC,h.id DESC),'[]'::jsonb)
    INTO v_rows
  FROM (
    SELECT i.id,i.contract_id,c.contract_number,c.status AS contract_status,
      cl.full_name AS customer_name,u.unit_number,
      i.try_on_date,i.pickup_date,i.event_date,i.return_date,
      i.actual_return_at,i.picked_up_at,i.status,i.unit_price,i.discount,
      i.conflict_override,i.created_at
    FROM public.rental_items i
    JOIN public.rental_contracts c ON c.id=i.contract_id
    JOIN public.clients cl ON cl.id=c.client_id
    JOIN public.product_units u ON u.id=i.unit_id
    WHERE i.product_id=p_product_id
    ORDER BY i.created_at DESC,i.id DESC
    LIMIT p_limit OFFSET p_offset
  ) AS h;

  RETURN jsonb_build_object(
    'product_id',p_product_id,
    'total_count',v_total,
    'contract_count',v_contract_count,
    'cancelled_count',v_cancelled_count,
    'total_historical_value',v_historical_value,
    'total_valid_value',v_valid_value,
    'total_out_value',v_out_value,
    'items',v_rows
  );
END;
$body$;

REVOKE EXECUTE ON FUNCTION public.rental_product_full_history(uuid,integer,integer)
  FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rental_product_full_history(uuid,integer,integer)
  TO authenticated;
