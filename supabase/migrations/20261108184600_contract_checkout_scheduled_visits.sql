-- Preserva regras atuais de preço, estoque, conflitos, sinal e contador transacional.
-- Entra depois da migração da agenda para gravar horários atomicamente.
CREATE OR REPLACE FUNCTION public.create_rental_contract(p_request jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_request_id uuid;
  v_existing public.rental_contracts%ROWTYPE;
  v_client_id uuid;
  v_client_name text;
  v_doc text;
  v_product public.products%ROWTYPE;
  v_item jsonb;
  v_payment jsonb;
  v_product_id uuid;
  v_unit_id uuid;
  v_quantity integer;
  v_unit_index integer;
  v_split_discount numeric(12,2);
  v_unit_discount numeric(12,2);
  v_price numeric(12,2);
  v_item_discount numeric(12,2);
  v_subtotal numeric(12,2) := 0;
  v_item_discounts numeric(12,2) := 0;
  v_total_discount numeric(12,2);
  v_total numeric(12,2);
  v_paid numeric(12,2) := 0;
  v_method text;
  v_installments integer;
  v_pickup date;
  v_event date;
  v_return date;
  v_try_on date;
  v_contract_id uuid;
  v_number bigint;
  v_manager boolean;
  v_override boolean;
  v_override_reason text;
  v_inserted_item uuid;
BEGIN
  IF v_actor IS NULL OR NOT (
    public.has_role(v_actor,'admin') OR public.has_role(v_actor,'manager') OR
    public.has_role(v_actor,'staff') OR public.has_role(v_actor,'cashier')
  ) THEN
    RAISE EXCEPTION 'Operador sem autorização para criar contratos' USING ERRCODE = '42501';
  END IF;
  v_manager := public.has_role(v_actor,'admin') OR public.has_role(v_actor,'manager');
  IF p_request IS NULL OR jsonb_typeof(p_request) <> 'object' THEN
    RAISE EXCEPTION 'Dados de contrato inválidos' USING ERRCODE = '22023';
  END IF;
  v_request_id := NULLIF(p_request->>'request_id','')::uuid;
  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'Chave de idempotência obrigatória' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(v_request_id::text, 0));
  SELECT * INTO v_existing FROM public.rental_contracts WHERE request_id = v_request_id;
  IF FOUND THEN
    IF v_existing.created_by <> v_actor THEN
      RAISE EXCEPTION 'Chave de idempotência pertence a outro operador' USING ERRCODE = '42501';
    END IF;
    RETURN jsonb_build_object('id', v_existing.id, 'number', v_existing.contract_number,
      'total', v_existing.total, 'already_exists', true);
  END IF;
  IF jsonb_typeof(p_request->'items') <> 'array' OR
     jsonb_array_length(p_request->'items') = 0 OR
     jsonb_array_length(p_request->'items') > 100 THEN
    RAISE EXCEPTION 'Informe entre 1 e 100 itens' USING ERRCODE = '22023';
  END IF;
  v_client_name := NULLIF(btrim(p_request->>'customer_name'), '');
  IF v_client_name IS NULL OR length(v_client_name) < 2 THEN
    RAISE EXCEPTION 'Nome do cliente obrigatório' USING ERRCODE = '22023';
  END IF;
  v_client_id := NULLIF(p_request->>'client_id', '')::uuid;
  v_doc := NULLIF(btrim(p_request->>'customer_document'), '');
  IF v_client_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.clients WHERE id = v_client_id) THEN
    RAISE EXCEPTION 'Cliente não encontrado' USING ERRCODE = '22023';
  END IF;

  -- Validar a composição ANTES de criar registros, usando preço cadastrado.
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_request->'items') LOOP
    IF v_item->>'item_type' <> 'rental' THEN
      RAISE EXCEPTION 'Não misturar vendas e aluguéis no contrato' USING ERRCODE = '22023';
    END IF;
    v_product_id := (v_item->>'product_id')::uuid;
    SELECT * INTO v_product FROM public.products
     WHERE id = v_product_id AND active = true AND deleted_at IS NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado ou inativo' USING ERRCODE = '22023'; END IF;
    v_quantity := COALESCE((v_item->>'quantity')::integer, 1);
    v_price := round((v_item->>'unit_price')::numeric, 2);
    v_item_discount := round(COALESCE((v_item->>'discount')::numeric, 0),2);
    IF v_quantity < 1 OR v_quantity > 20 OR v_price IS NULL OR v_price < 0
       OR v_item_discount < 0 OR v_item_discount > v_price * v_quantity THEN
      RAISE EXCEPTION 'Quantidade, preço ou desconto inválido' USING ERRCODE = '22023';
    END IF;
    IF NOT v_manager AND v_price <> round(COALESCE(NULLIF(v_product.metadata->>'rental_price','')::numeric, v_product.price),2) THEN
      RAISE EXCEPTION 'Alteração de preço requer gerente' USING ERRCODE = '42501';
    END IF;
    v_pickup := (v_item->>'pickup_date')::date;
    v_event := (v_item->>'event_date')::date;
    v_return := (v_item->>'return_date')::date;
    v_try_on := NULLIF(v_item->>'try_on_date','')::date;
    IF v_pickup IS NULL OR v_event IS NULL OR v_return IS NULL OR
       v_pickup > v_event OR v_event > v_return OR
       (v_try_on IS NOT NULL AND v_try_on >= v_pickup) THEN
      RAISE EXCEPTION 'Datas de aluguel inválidas' USING ERRCODE = '22023';
    END IF;
    v_subtotal := v_subtotal + v_quantity * v_price;
    v_item_discounts := v_item_discounts + v_item_discount;
  END LOOP;
  v_total_discount := round(COALESCE((p_request->>'total_discount')::numeric,0),2);
  v_total := round((p_request->>'total')::numeric,2);
  IF v_total_discount < v_item_discounts OR v_total_discount > v_subtotal
     OR v_total IS NULL OR v_total <> v_subtotal - v_total_discount THEN
    RAISE EXCEPTION 'Total financeiro inconsistente com os itens' USING ERRCODE = '22023';
  END IF;
  IF v_total_discount > 0 AND NOT v_manager THEN
    RAISE EXCEPTION 'Descontos precisam de autorização de gerente' USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(p_request->'payments') = 'array' THEN
    FOR v_payment IN SELECT value FROM jsonb_array_elements(p_request->'payments') LOOP
      v_method := v_payment->>'method';
      v_price := round((v_payment->>'value')::numeric,2);
      v_installments := COALESCE((v_payment->>'installments')::integer, 1);
      IF v_method NOT IN ('cash','credit','debit','pix','transfer') OR
         v_price IS NULL OR v_price <= 0 OR v_installments < 1 OR v_installments > 24 THEN
        RAISE EXCEPTION 'Meio de pagamento inválido' USING ERRCODE = '22023';
      END IF;
      v_paid := v_paid + v_price;
    END LOOP;
  END IF;
  IF v_paid > v_total THEN
    RAISE EXCEPTION 'Pagamento superior ao total do contrato' USING ERRCODE = '22023';
  END IF;

  IF v_client_id IS NULL AND v_doc IS NOT NULL THEN
    SELECT id INTO v_client_id FROM public.clients WHERE document = v_doc ORDER BY created_at LIMIT 1;
  END IF;
  IF v_client_id IS NULL THEN
    INSERT INTO public.clients (full_name, document, phone, created_by)
      VALUES (v_client_name, v_doc, NULLIF(p_request->>'customer_phone',''), v_actor)
      RETURNING id INTO v_client_id;
  END IF;
  -- O contador é uma linha PostgreSQL transacional, NÃO uma SEQUENCE/IDENTITY.
  -- A atualização bloqueia esta linha até a confirmação ou rollback do contrato.
  -- Se houver conflito de datas, erro de pagamento ou qualquer falha posterior,
  -- o UPDATE também é desfeito, sem gastar um número de contrato.
  UPDATE public.rental_contract_number_counter
     SET last_number=last_number+1, updated_at=now()
   WHERE id=1
   RETURNING last_number INTO v_number;
  IF v_number IS NULL THEN
    RAISE EXCEPTION 'Contador de contratos indisponível; criação cancelada'
      USING ERRCODE='55000';
  END IF;
  INSERT INTO public.rental_contracts
    (contract_number, request_id, client_id, created_by, subtotal, total_discount, total, notes)
  VALUES
    (v_number, v_request_id, v_client_id, v_actor, v_subtotal, v_total_discount, v_total,
      NULLIF(p_request->>'observations',''))
  RETURNING id, contract_number INTO v_contract_id, v_number;

  -- Ordem estável reduz deadlocks quando dois operadores adicionam múltiplos produtos.
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_request->'items')
    ORDER BY value->>'product_id' LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := COALESCE((v_item->>'quantity')::integer,1);
    v_price := round((v_item->>'unit_price')::numeric,2);
    v_item_discount := round(COALESCE((v_item->>'discount')::numeric,0),2);
    v_pickup := (v_item->>'pickup_date')::date;
    v_event := (v_item->>'event_date')::date;
    v_return := (v_item->>'return_date')::date;
    v_try_on := NULLIF(v_item->>'try_on_date','')::date;
    PERFORM pg_advisory_xact_lock(hashtextextended(v_product_id::text,0));
    -- Distribui desconto total entre exemplares sem exceder o preço unitário.
    v_split_discount := trunc(v_item_discount / v_quantity, 2);
    FOR v_unit_index IN 1..v_quantity LOOP
      v_unit_discount := v_split_discount + CASE WHEN v_unit_index = 1
        THEN v_item_discount - v_split_discount * v_quantity ELSE 0 END;
      SELECT u.id INTO v_unit_id FROM public.product_units u
      WHERE u.product_id = v_product_id AND u.status = 'available'
        AND NOT EXISTS (
          SELECT 1 FROM public.rental_items ri
           WHERE ri.unit_id = u.id AND ri.status IN ('confirmed','picked_up')
             AND daterange(ri.pickup_date, ri.return_date,'[]') &&
                 daterange(v_pickup,v_return,'[]')
        )
      ORDER BY u.unit_number
      FOR UPDATE OF u LIMIT 1;
      v_override := false;
      v_override_reason := NULL;
      IF v_unit_id IS NULL THEN
        IF NOT v_manager OR COALESCE(v_item->>'override_conflict','false') <> 'true' THEN
          RAISE EXCEPTION 'Produto % indisponível para as datas solicitadas. Confira o carrinho.',v_product_id
            USING ERRCODE='23P01';
        END IF;
        v_override_reason := NULLIF(btrim(v_item->>'override_reason'),'');
        IF length(COALESCE(v_override_reason,'')) NOT BETWEEN 10 AND 500 THEN
          RAISE EXCEPTION 'Desbloqueio excepcional exige justificativa de gerente (10 a 500 caracteres)'
            USING ERRCODE='22023';
        END IF;
        -- Não alocar o mesmo exemplar duas vezes no novo contrato.
        -- O desbloqueio nunca usa unidade em lavanderia, manutenção, inativa ou consignada.
        SELECT u.id INTO v_unit_id FROM public.product_units u
         WHERE u.product_id=v_product_id AND u.status='available'
           AND NOT EXISTS (
             SELECT 1 FROM public.rental_items same_order
              WHERE same_order.contract_id=v_contract_id AND same_order.unit_id=u.id
                AND same_order.status IN ('confirmed','picked_up')
           )
         ORDER BY (
           SELECT count(*) FROM public.rental_items occupied
            WHERE occupied.unit_id=u.id AND occupied.status IN ('confirmed','picked_up')
              AND daterange(occupied.pickup_date,occupied.return_date,'[]') &&
                  daterange(v_pickup,v_return,'[]')
         ),u.unit_number
         FOR UPDATE OF u LIMIT 1;
        IF v_unit_id IS NULL THEN
          RAISE EXCEPTION 'Não existe exemplar físico apto ao desbloqueio do produto %',v_product_id
            USING ERRCODE='23P01';
        END IF;
        v_override := true;
      END IF;
      INSERT INTO public.rental_items
        (contract_id,product_id,unit_id,unit_price,discount,try_on_date,pickup_date,event_date,return_date,
         conflict_override,override_reason,override_authorized_by)
      VALUES (v_contract_id,v_product_id,v_unit_id,v_price,
        v_unit_discount,v_try_on,v_pickup,v_event,v_return,
        v_override,v_override_reason,CASE WHEN v_override THEN v_actor ELSE NULL END)
      RETURNING id INTO v_inserted_item;
      IF v_override THEN
        INSERT INTO public.rental_conflict_overrides
          (item_id,contract_id,product_id,unit_id,authorized_by,reason,conflicts_snapshot)
        SELECT v_inserted_item,v_contract_id,v_product_id,v_unit_id,v_actor,v_override_reason,
          COALESCE(jsonb_agg(jsonb_build_object(
            'item_id',ri.id,'contract_id',ri.contract_id,'pickup_date',ri.pickup_date,
            'return_date',ri.return_date,'status',ri.status
          ) ORDER BY ri.pickup_date,ri.id),'[]'::jsonb)
          FROM public.rental_items ri
          WHERE ri.unit_id=v_unit_id AND ri.id<>v_inserted_item
            AND ri.status IN ('confirmed','picked_up')
            AND daterange(ri.pickup_date,ri.return_date,'[]') &&
                daterange(v_pickup,v_return,'[]');
      END IF;
    END LOOP;
  END LOOP;

  IF jsonb_typeof(p_request->'payments') = 'array' THEN
    FOR v_payment IN SELECT value FROM jsonb_array_elements(p_request->'payments') LOOP
      INSERT INTO public.rental_payments (contract_id,method,amount,installments,recorded_by)
      VALUES (v_contract_id,v_payment->>'method',
        round((v_payment->>'value')::numeric,2),
        COALESCE((v_payment->>'installments')::integer,1),v_actor);
    END LOOP;
  END IF;
  -- O mesmo contrato e o mesmo cliente têm UM agendamento por tipo.
  -- Horário omitido por integrações antigas preserva compatibilidade e
  -- aparecerá como "Horário a definir" na agenda.
  IF NULLIF(btrim(p_request->>'try_on_time'),'') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.rental_items i
      WHERE i.contract_id=v_contract_id AND i.try_on_date IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Horário de prova informado sem data de prova' USING ERRCODE='22023';
    END IF;
    IF (SELECT count(DISTINCT i.try_on_date) FROM public.rental_items i
        WHERE i.contract_id=v_contract_id AND i.status<>'cancelled')<>1 THEN
      RAISE EXCEPTION 'Itens com datas de prova diferentes: agende por contrato após criação'
        USING ERRCODE='22023';
    END IF;
    PERFORM public.closet_schedule_contract_visit(
      v_contract_id,'Prova',
      (SELECT min(i.try_on_date) FROM public.rental_items i
       WHERE i.contract_id=v_contract_id AND i.status<>'cancelled'),
      p_request->>'try_on_time'
    );
  END IF;
  IF NULLIF(btrim(p_request->>'pickup_time'),'') IS NOT NULL THEN
    IF (SELECT count(DISTINCT i.pickup_date) FROM public.rental_items i
       WHERE i.contract_id=v_contract_id AND i.status<>'cancelled')<>1 THEN
      RAISE EXCEPTION 'Itens com datas de retirada diferentes: agende por contrato após criação'
        USING ERRCODE='22023';
    END IF;
    PERFORM public.closet_schedule_contract_visit(
      v_contract_id,'Retirada',
      (SELECT min(i.pickup_date) FROM public.rental_items i
       WHERE i.contract_id=v_contract_id AND i.status<>'cancelled'),
      p_request->>'pickup_time'
    );
  END IF;
  RETURN jsonb_build_object('id',v_contract_id,'number',v_number,'total',v_total,
    'paid',v_paid,'already_exists',false);
END;
$function$;
