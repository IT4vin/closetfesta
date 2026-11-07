-- Caixa persistente e auditável (aplicar primeiro em homologação).
-- Bloqueia escrita direta do frontend, exigindo RPC transacional com papel apropriado.
DROP POLICY IF EXISTS "Auth read cash" ON public.cash_registers;
DROP POLICY IF EXISTS "Auth read movements" ON public.cash_movements;
DROP POLICY IF EXISTS "Cashier insert cash registers v2" ON public.cash_registers;
DROP POLICY IF EXISTS "Cashier update cash registers v2" ON public.cash_registers;
DROP POLICY IF EXISTS "Cashier insert movements v2" ON public.cash_movements;
REVOKE ALL ON public.cash_registers FROM anon, authenticated;
REVOKE ALL ON public.cash_movements FROM anon, authenticated;
GRANT SELECT ON public.cash_registers TO authenticated;
GRANT SELECT ON public.cash_movements TO authenticated;
CREATE POLICY "Cash roles read registers v3" ON public.cash_registers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR
    (public.has_role(auth.uid(),'cashier') AND opened_by = auth.uid()));
CREATE POLICY "Cash roles read movements v3" ON public.cash_movements FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_register_id
  ));
-- Exige correção manual se já houver múltiplos caixas abertos simultaneamente pelo mesmo operador.
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_register_per_operator
  ON public.cash_registers(opened_by) WHERE status = 'open';

CREATE OR REPLACE FUNCTION public.cashier_open(p_amount numeric)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_actor IS NULL OR NOT (public.has_role(v_actor,'admin') OR
    public.has_role(v_actor,'manager') OR public.has_role(v_actor,'cashier')) THEN
    RAISE EXCEPTION 'Sem permissão para abrir caixa' USING ERRCODE='42501';
  END IF;
  IF p_amount IS NULL OR p_amount < 0 OR p_amount > 1000000 THEN
    RAISE EXCEPTION 'Valor de abertura inválido' USING ERRCODE='22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(v_actor::text, 1));
  IF EXISTS (SELECT 1 FROM public.cash_registers WHERE opened_by=v_actor AND status='open') THEN
    RAISE EXCEPTION 'Já existe caixa aberto para este operador' USING ERRCODE='23505';
  END IF;
  INSERT INTO public.cash_registers(opened_by,opening_amount,status)
    VALUES (v_actor,round(p_amount,2),'open') RETURNING id INTO v_id;
  INSERT INTO public.cash_movements(cash_register_id,type,amount,description,created_by)
    VALUES(v_id,'opening',0,'Abertura de caixa',v_actor);
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cashier_move(p_cash_id uuid,p_kind text,p_amount numeric,p_description text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_cash public.cash_registers%ROWTYPE;
  v_balance numeric(12,2);
  v_id uuid;
  v_signed numeric(12,2);
BEGIN
  IF v_actor IS NULL OR NOT (public.has_role(v_actor,'admin') OR
    public.has_role(v_actor,'manager') OR public.has_role(v_actor,'cashier')) THEN
    RAISE EXCEPTION 'Sem permissão para movimentar caixa' USING ERRCODE='42501';
  END IF;
  IF p_kind NOT IN ('withdrawal','reinforcement') OR p_amount IS NULL
     OR p_amount <= 0 OR p_amount > 1000000 THEN
    RAISE EXCEPTION 'Tipo ou valor da movimentação inválido' USING ERRCODE='22023';
  END IF;
  SELECT * INTO v_cash FROM public.cash_registers WHERE id=p_cash_id FOR UPDATE;
  IF NOT FOUND OR v_cash.status <> 'open' OR
     (v_cash.opened_by <> v_actor AND NOT
       (public.has_role(v_actor,'admin') OR public.has_role(v_actor,'manager'))) THEN
    RAISE EXCEPTION 'Caixa indisponível para este operador' USING ERRCODE='42501';
  END IF;
  SELECT v_cash.opening_amount + COALESCE(SUM(amount),0) INTO v_balance
    FROM public.cash_movements WHERE cash_register_id=p_cash_id;
  v_signed := CASE WHEN p_kind='withdrawal' THEN -round(p_amount,2) ELSE round(p_amount,2) END;
  IF v_balance + v_signed < 0 THEN
    RAISE EXCEPTION 'Saldo em dinheiro insuficiente' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.cash_movements(cash_register_id,type,amount,description,created_by)
    VALUES(p_cash_id,p_kind,v_signed,NULLIF(btrim(p_description),''),v_actor)
    RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cashier_close(p_cash_id uuid,p_counted numeric,p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_cash public.cash_registers%ROWTYPE;
  v_expected numeric(12,2);
BEGIN
  IF v_actor IS NULL OR NOT (public.has_role(v_actor,'admin') OR
    public.has_role(v_actor,'manager') OR public.has_role(v_actor,'cashier')) THEN
    RAISE EXCEPTION 'Sem permissão para fechar caixa' USING ERRCODE='42501';
  END IF;
  IF p_counted IS NULL OR p_counted < 0 OR p_counted > 1000000 THEN
    RAISE EXCEPTION 'Valor contado inválido' USING ERRCODE='22023';
  END IF;
  SELECT * INTO v_cash FROM public.cash_registers WHERE id=p_cash_id FOR UPDATE;
  IF NOT FOUND OR v_cash.status <> 'open' OR
    (v_cash.opened_by <> v_actor AND NOT
      (public.has_role(v_actor,'admin') OR public.has_role(v_actor,'manager'))) THEN
    RAISE EXCEPTION 'Caixa fechado ou não autorizado' USING ERRCODE='42501';
  END IF;
  SELECT v_cash.opening_amount + COALESCE(SUM(amount),0) INTO v_expected
    FROM public.cash_movements WHERE cash_register_id=p_cash_id;
  UPDATE public.cash_registers SET status='closed',closed_by=v_actor,
    closed_at=now(),closing_amount=round(p_counted,2),
    expected_amount=v_expected,difference=round(p_counted,2)-v_expected,
    notes=NULLIF(btrim(p_note),'') WHERE id=p_cash_id;
  INSERT INTO public.cash_movements(cash_register_id,type,amount,description,created_by)
    VALUES(p_cash_id,'closing',0,'Fechamento de caixa',v_actor);
  RETURN jsonb_build_object('expected',v_expected,'counted',round(p_counted,2),
    'difference',round(p_counted,2)-v_expected);
END;
$$;
REVOKE ALL ON FUNCTION public.cashier_open(numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cashier_move(uuid,text,numeric,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cashier_close(uuid,numeric,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cashier_open(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cashier_move(uuid,text,numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cashier_close(uuid,numeric,text) TO authenticated;
