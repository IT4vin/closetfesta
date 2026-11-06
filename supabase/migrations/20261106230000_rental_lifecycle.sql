-- Gestão auditável de retirada, devolução e recebimentos complementares.
-- Depende de 20261106190000_rental_contracts.sql. Aplicar somente em HOMOLOGAÇÃO
-- após backup, validação de schema e teste com diferentes papéis.
ALTER TABLE public.rental_items
  ADD COLUMN IF NOT EXISTS picked_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS picked_up_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS returned_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS return_notes text;

ALTER TABLE public.rental_payments
  ADD COLUMN IF NOT EXISTS request_id uuid UNIQUE;

CREATE TABLE IF NOT EXISTS public.rental_item_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.rental_items(id) ON DELETE RESTRICT,
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  event_type text NOT NULL CHECK (event_type IN ('pickup', 'return')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  notes text
);
CREATE INDEX IF NOT EXISTS idx_rental_item_events_item
  ON public.rental_item_events(item_id, occurred_at DESC);
ALTER TABLE public.rental_item_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rental_item_events FROM anon, authenticated;
GRANT SELECT ON public.rental_item_events TO authenticated;
DROP POLICY IF EXISTS "Authorized read rental events" ON public.rental_item_events;
CREATE POLICY "Authorized read rental events"
  ON public.rental_item_events FOR SELECT TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin')
    OR public.has_role((SELECT auth.uid()), 'manager')
    OR public.has_role((SELECT auth.uid()), 'staff')
    OR public.has_role((SELECT auth.uid()), 'cashier'));

-- Mudança de status no servidor; não confiar em datas enviadas pelo navegador.
CREATE OR REPLACE FUNCTION public.rental_confirm_pickup(p_item_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.rental_confirm_return(p_item_id uuid, p_notes text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_item public.rental_items%ROWTYPE;
  v_remaining integer;
BEGIN
  IF v_actor IS NULL OR NOT (
    public.has_role(v_actor, 'admin') OR public.has_role(v_actor, 'manager')
    OR public.has_role(v_actor, 'staff')) THEN
    RAISE EXCEPTION 'Sem permissão para registrar devolução' USING ERRCODE = '42501';
  END IF;
  IF p_item_id IS NULL OR length(COALESCE(p_notes,'')) > 2000 THEN
    RAISE EXCEPTION 'Dados de devolução inválidos' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_item FROM public.rental_items WHERE id = p_item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item de aluguel não encontrado' USING ERRCODE = 'P0002'; END IF;
  -- Serializar todas as devoluções do mesmo contrato.
  PERFORM 1 FROM public.rental_contracts WHERE id = v_item.contract_id FOR UPDATE;
  IF v_item.status <> 'picked_up' THEN
    RAISE EXCEPTION 'Somente um traje retirado pode ser devolvido' USING ERRCODE = '22023';
  END IF;
  PERFORM 1 FROM public.product_units WHERE id = v_item.unit_id FOR UPDATE;
  UPDATE public.rental_items
    SET status = 'returned', actual_return_at = now(),
        returned_by = v_actor, return_notes = NULLIF(btrim(p_notes),'')
    WHERE id = p_item_id;
  -- Não liberar um traje para novo aluguel antes de conferir e lavar.
  UPDATE public.product_units SET status = 'laundry' WHERE id = v_item.unit_id;
  INSERT INTO public.rental_item_events(item_id, actor_id, event_type, notes)
    VALUES (p_item_id, v_actor, 'return', NULLIF(btrim(p_notes),''));
  SELECT count(*) INTO v_remaining FROM public.rental_items
    WHERE contract_id = v_item.contract_id AND status NOT IN ('returned', 'cancelled');
  IF v_remaining = 0 THEN
    UPDATE public.rental_contracts SET status = 'completed', updated_at = now()
      WHERE id = v_item.contract_id;
  END IF;
  RETURN jsonb_build_object('id', p_item_id, 'status', 'returned', 'requires_laundry', true);
END;
$$;

-- Registro de recebimento complementar com idempotência.
-- Não é confirmação de adquirente: registra apenas valores conferidos pelo operador.
CREATE OR REPLACE FUNCTION public.rental_record_payment(
  p_contract_id uuid, p_request_id uuid, p_method text,
  p_amount numeric, p_installments integer DEFAULT 1
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_contract public.rental_contracts%ROWTYPE;
  v_payment public.rental_payments%ROWTYPE;
  v_paid numeric(12,2);
  v_id uuid;
BEGIN
  IF v_actor IS NULL OR NOT (
    public.has_role(v_actor,'admin') OR public.has_role(v_actor,'manager')
    OR public.has_role(v_actor,'cashier')) THEN
    RAISE EXCEPTION 'Sem permissão para registrar pagamento' USING ERRCODE='42501';
  END IF;
  IF p_contract_id IS NULL OR p_request_id IS NULL
     OR p_method NOT IN ('cash','credit','debit','pix','transfer')
     OR p_amount IS NULL OR p_amount <= 0 OR p_amount > 1000000
     OR p_installments IS NULL OR p_installments NOT BETWEEN 1 AND 24 THEN
    RAISE EXCEPTION 'Dados de pagamento inválidos' USING ERRCODE='22023';
  END IF;
  SELECT * INTO v_payment FROM public.rental_payments WHERE request_id = p_request_id;
  IF FOUND THEN
    IF v_payment.contract_id <> p_contract_id OR v_payment.recorded_by <> v_actor THEN
      RAISE EXCEPTION 'Chave de pagamento reutilizada em outro registro' USING ERRCODE='42501';
    END IF;
    RETURN jsonb_build_object('id',v_payment.id,'already_exists',true);
  END IF;
  SELECT * INTO v_contract FROM public.rental_contracts WHERE id=p_contract_id FOR UPDATE;
  IF NOT FOUND OR v_contract.status='cancelled' THEN
    RAISE EXCEPTION 'Contrato inexistente ou cancelado' USING ERRCODE='22023';
  END IF;
  -- Segunda verificação após adquirir o lock do contrato.
  SELECT * INTO v_payment FROM public.rental_payments WHERE request_id=p_request_id;
  IF FOUND THEN
    IF v_payment.contract_id <> p_contract_id OR v_payment.recorded_by <> v_actor THEN
      RAISE EXCEPTION 'Chave de pagamento reutilizada em outro registro' USING ERRCODE='42501';
    END IF;
    RETURN jsonb_build_object('id',v_payment.id,'already_exists',true);
  END IF;
  SELECT COALESCE(sum(amount) FILTER (WHERE status <> 'reversed'), 0)
    INTO v_paid FROM public.rental_payments WHERE contract_id=p_contract_id;
  IF v_paid + round(p_amount,2) > v_contract.total THEN
    RAISE EXCEPTION 'Pagamento excede o saldo do contrato' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.rental_payments
    (contract_id,request_id,method,amount,installments,recorded_by)
  VALUES (p_contract_id,p_request_id,p_method,round(p_amount,2),p_installments,v_actor)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('id',v_id,'already_exists',false,
    'balance',v_contract.total-v_paid-round(p_amount,2));
END;
$$;

REVOKE ALL ON FUNCTION public.rental_confirm_pickup(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rental_confirm_return(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rental_record_payment(uuid,uuid,text,numeric,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rental_confirm_pickup(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rental_confirm_return(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rental_record_payment(uuid,uuid,text,numeric,integer) TO authenticated;

-- Remover as funções preliminares antigas com regras menos restritas.
DROP FUNCTION IF EXISTS public.pickup_rental_item(uuid,uuid,text);
DROP FUNCTION IF EXISTS public.return_rental_item(uuid,uuid,text);
