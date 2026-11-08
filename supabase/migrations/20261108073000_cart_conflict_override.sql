-- Ponto de venda: desbloqueio gerencial excepcional, com auditoria.
ALTER TABLE public.rental_items
  ADD COLUMN IF NOT EXISTS conflict_override boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS override_reason text,
  ADD COLUMN IF NOT EXISTS override_authorized_by uuid REFERENCES auth.users(id);
ALTER TABLE public.rental_items
  ADD CONSTRAINT rental_override_reason_check
    CHECK (
      (NOT conflict_override AND override_reason IS NULL AND override_authorized_by IS NULL)
      OR (conflict_override AND COALESCE(length(btrim(override_reason)),0) BETWEEN 10 AND 500
          AND override_authorized_by IS NOT NULL)
    );
-- Preservar exclusão estrita para reservas normais; autorizações ficam fora da constraint
-- mas são levadas em conta nas consultas RPC e na validação de novas locações.
ALTER TABLE public.rental_items DROP CONSTRAINT no_double_booking_per_unit;
ALTER TABLE public.rental_items ADD CONSTRAINT no_double_booking_per_unit
  EXCLUDE USING gist (
    unit_id WITH =,
    daterange(pickup_date,return_date,'[]') WITH &&
  ) WHERE (status IN ('confirmed','picked_up') AND NOT conflict_override);

CREATE TABLE public.rental_conflict_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL UNIQUE REFERENCES public.rental_items(id) ON DELETE RESTRICT,
  contract_id uuid NOT NULL REFERENCES public.rental_contracts(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  unit_id uuid NOT NULL REFERENCES public.product_units(id) ON DELETE RESTRICT,
  authorized_by uuid NOT NULL REFERENCES auth.users(id),
  reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 10 AND 500),
  conflicts_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_conflict_overrides_contract ON public.rental_conflict_overrides(contract_id);
CREATE INDEX idx_conflict_overrides_unit ON public.rental_conflict_overrides(unit_id,created_at DESC);
ALTER TABLE public.rental_conflict_overrides ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rental_conflict_overrides FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.rental_conflict_overrides TO authenticated;
CREATE POLICY "Authorized rental operators inspect conflict overrides"
  ON public.rental_conflict_overrides FOR SELECT TO authenticated
  USING (
    public.has_role((select auth.uid()),'admin'::public.app_role) OR
    public.has_role((select auth.uid()),'manager'::public.app_role) OR
    public.has_role((select auth.uid()),'staff'::public.app_role)
  );

-- Impedir que inserções convencionais ignorem as reservas excepcionais.
-- O bloqueio transacional do produto serializa a consulta com o fechamento normal.
CREATE OR REPLACE FUNCTION public.closet_guard_rental_item_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $insert_guard$
BEGIN
  IF NEW.status NOT IN ('confirmed','picked_up') THEN RETURN NEW; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.product_id::text,0));
  IF NEW.conflict_override THEN
    IF auth.uid() IS NULL OR NEW.override_authorized_by IS DISTINCT FROM auth.uid()
       OR NOT (public.has_role(auth.uid(),'admin'::public.app_role)
                OR public.has_role(auth.uid(),'manager'::public.app_role)) THEN
      RAISE EXCEPTION 'Reserva excepcional exige gerente autenticado' USING ERRCODE='42501';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.rental_items ri
      WHERE ri.unit_id=NEW.unit_id AND ri.status IN ('confirmed','picked_up')
        AND daterange(ri.pickup_date,ri.return_date,'[]') &&
            daterange(NEW.pickup_date,NEW.return_date,'[]')
    ) THEN
      RAISE EXCEPTION 'Não há conflito que justifique desbloqueio excepcional'
        USING ERRCODE='22023';
    END IF;
  ELSIF EXISTS (
    SELECT 1 FROM public.rental_items ri
    WHERE ri.unit_id=NEW.unit_id AND ri.status IN ('confirmed','picked_up')
      AND daterange(ri.pickup_date,ri.return_date,'[]') &&
          daterange(NEW.pickup_date,NEW.return_date,'[]')
  ) THEN
    RAISE EXCEPTION 'Reserva convencional conflita com outro contrato'
      USING ERRCODE='23P01';
  END IF;
  RETURN NEW;
END;
$insert_guard$;
REVOKE EXECUTE ON FUNCTION public.closet_guard_rental_item_insert() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS trg_closet_guard_rental_item_insert ON public.rental_items;
CREATE TRIGGER trg_closet_guard_rental_item_insert
  BEFORE INSERT ON public.rental_items FOR EACH ROW
  EXECUTE FUNCTION public.closet_guard_rental_item_insert();

-- Ao alterar as datas, usar todas as reservas existentes, inclusive as excepcionais.
CREATE OR REPLACE FUNCTION public.closet_guard_rental_item_reschedule()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $guard$
BEGIN
  IF (OLD.pickup_date,OLD.event_date,OLD.return_date,OLD.unit_id,OLD.product_id)
      IS NOT DISTINCT FROM
     (NEW.pickup_date,NEW.event_date,NEW.return_date,NEW.unit_id,NEW.product_id)
     THEN RETURN NEW; END IF;
  IF OLD.conflict_override THEN
    RAISE EXCEPTION 'Reserva desbloqueada exige cancelamento e nova autorização para alterar datas ou exemplar'
      USING ERRCODE='22023';
  END IF;
  IF NEW.status IN ('confirmed','picked_up') THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.product_id::text,0));
    IF EXISTS (
      SELECT 1 FROM public.rental_items ri
       WHERE ri.unit_id=NEW.unit_id AND ri.id<>NEW.id
         AND ri.status IN ('confirmed','picked_up')
         AND daterange(ri.pickup_date,ri.return_date,'[]') &&
             daterange(NEW.pickup_date,NEW.return_date,'[]')
    ) THEN
      RAISE EXCEPTION 'Novas datas conflitantes com outra locação; confira o histórico'
        USING ERRCODE='23P01';
    END IF;
  END IF;
  RETURN NEW;
END;
$guard$;
REVOKE EXECUTE ON FUNCTION public.closet_guard_rental_item_reschedule() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS trg_closet_guard_rental_item_reschedule ON public.rental_items;
CREATE TRIGGER trg_closet_guard_rental_item_reschedule
  BEFORE UPDATE OF pickup_date,event_date,return_date,unit_id,product_id
  ON public.rental_items FOR EACH ROW EXECUTE FUNCTION public.closet_guard_rental_item_reschedule();

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
  INSERT INTO public.rental_contracts
    (request_id, client_id, created_by, subtotal, total_discount, total, notes)
  VALUES
    (v_request_id, v_client_id, v_actor, v_subtotal, v_total_discount, v_total,
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
  RETURN jsonb_build_object('id',v_contract_id,'number',v_number,'total',v_total,
    'paid',v_paid,'already_exists',false);
END;
$function$


CREATE OR REPLACE FUNCTION public.rental_confirm_pickup(p_item_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_item public.rental_items%ROWTYPE;
  v_contract public.rental_contracts%ROWTYPE;
  v_unit_status text;
  v_paid numeric(12,2);
BEGIN
  IF v_actor IS NULL OR NOT (
    public.has_role(v_actor, 'admin') OR public.has_role(v_actor, 'manager')
    OR public.has_role(v_actor, 'staff')) THEN
    RAISE EXCEPTION 'Sem permissão para registrar retirada' USING ERRCODE = '42501';
  END IF;
  IF p_item_id IS NULL THEN
    RAISE EXCEPTION 'Item obrigatório' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_item FROM public.rental_items WHERE id = p_item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item de aluguel não encontrado' USING ERRCODE = 'P0002'; END IF;
  SELECT * INTO v_contract FROM public.rental_contracts WHERE id = v_item.contract_id FOR UPDATE;
  IF v_contract.status IN ('cancelled', 'completed') OR v_item.status <> 'confirmed' THEN
    RAISE EXCEPTION 'Item não pode ser retirado no estado atual' USING ERRCODE = '22023';
  END IF;
  -- Exigir quitação do contrato antes da retirada.
  SELECT COALESCE(sum(amount) FILTER (WHERE status <> 'reversed'),0)
    INTO v_paid FROM public.rental_payments WHERE contract_id=v_contract.id;
  IF v_paid < v_contract.total THEN
    RAISE EXCEPTION 'Saldo pendente: registre o pagamento complementar antes da retirada'
      USING ERRCODE='22023';
  END IF;
  IF CURRENT_DATE < v_item.pickup_date AND NOT (
    public.has_role(v_actor, 'admin') OR public.has_role(v_actor, 'manager')) THEN
    RAISE EXCEPTION 'Retirada antecipada exige gerente' USING ERRCODE = '42501';
  END IF;
  SELECT status INTO v_unit_status FROM public.product_units WHERE id = v_item.unit_id FOR UPDATE;
  IF v_unit_status <> 'available' THEN
    RAISE EXCEPTION 'Traje não está liberado para retirada' USING ERRCODE = '22023';
  END IF;
  -- A reserva original tem prioridade: o item excepcional não pode ser
  -- retirado enquanto o contrato que justificou o bloqueio ainda estiver confirmado.
  IF v_item.conflict_override AND EXISTS (
    SELECT 1 FROM public.rental_items earlier
    WHERE earlier.unit_id=v_item.unit_id AND earlier.id<>v_item.id
      AND earlier.status='confirmed'
      AND daterange(earlier.pickup_date,earlier.return_date,'[]') &&
          daterange(v_item.pickup_date,v_item.return_date,'[]')
      AND earlier.created_at<=v_item.created_at
  ) THEN
    RAISE EXCEPTION 'Reserva original ainda ativa; gerente precisa resolver o conflito antes da retirada'
      USING ERRCODE='23P01';
  END IF;
  -- A exceção permite a reserva, mas jamais entrega física simultânea.
  IF EXISTS (
    SELECT 1 FROM public.rental_items other_item
    WHERE other_item.unit_id=v_item.unit_id AND other_item.id<>v_item.id
      AND other_item.status='picked_up'
  ) THEN
    RAISE EXCEPTION 'Exemplar entregue em outro contrato; resolva o conflito antes da retirada'
      USING ERRCODE='23P01';
  END IF;
  UPDATE public.rental_items
    SET status = 'picked_up', picked_up_at = now(), picked_up_by = v_actor
    WHERE id = p_item_id;
  UPDATE public.rental_contracts
    SET status = 'picked_up', updated_at = now()
    WHERE id = v_contract.id AND status = 'confirmed';
  INSERT INTO public.rental_item_events(item_id, actor_id, event_type)
    VALUES (p_item_id, v_actor, 'pickup');
  RETURN jsonb_build_object('id', p_item_id, 'status', 'picked_up');
END;
$function$

