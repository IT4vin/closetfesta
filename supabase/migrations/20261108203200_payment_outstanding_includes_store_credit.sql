-- Pagamentos reais não podem ultrapassar o contrato depois de aplicar crédito.
CREATE OR REPLACE FUNCTION public.rental_record_payment(p_contract_id uuid, p_request_id uuid, p_method text, p_amount numeric, p_installments integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
  -- Resgates de créditos anteriores abatem o valor que pode ser pago
  -- em dinheiro, cartão, Pix ou transferência.
  SELECT v_paid + COALESCE(-sum(delta),0) INTO v_paid
  FROM public.client_credit_entries
  WHERE source_contract_id=p_contract_id AND kind='redemption';
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
$function$;
