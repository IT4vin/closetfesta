-- Registro auditável de retirada/devolução por exemplar.
-- Esta migration depende de 20261106190000_rental_contracts.sql.
CREATE TABLE IF NOT EXISTS public.rental_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.rental_contracts(id) ON DELETE RESTRICT,
  item_id uuid REFERENCES public.rental_items(id) ON DELETE RESTRICT,
  event_type text NOT NULL CHECK (event_type IN ('pickup','return','note')),
  notes text,
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rental_events_contract ON public.rental_events(contract_id, occurred_at DESC);
ALTER TABLE public.rental_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rental_events FROM anon, authenticated;
GRANT SELECT ON public.rental_events TO authenticated;
CREATE POLICY "Staff read rental lifecycle events" ON public.rental_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR
         public.has_role(auth.uid(),'staff') OR public.has_role(auth.uid(),'cashier'));

CREATE OR REPLACE FUNCTION public.pickup_rental_item(p_contract_id uuid, p_item_id uuid, p_note text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_item public.rental_items%ROWTYPE;
BEGIN
  IF v_actor IS NULL OR NOT (
    public.has_role(v_actor,'admin') OR public.has_role(v_actor,'manager') OR
    public.has_role(v_actor,'staff') OR public.has_role(v_actor,'cashier')
  ) THEN RAISE EXCEPTION 'Operador não autorizado' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_item FROM public.rental_items WHERE id=p_item_id AND contract_id=p_contract_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Traje não encontrado no contrato' USING ERRCODE='22023'; END IF;
  IF v_item.status = 'picked_up' THEN RETURN p_item_id; END IF;
  IF v_item.status <> 'confirmed' THEN
    RAISE EXCEPTION 'Este traje não pode ser retirado neste estado' USING ERRCODE='22023';
  END IF;
  UPDATE public.rental_items SET status='picked_up' WHERE id=p_item_id;
  UPDATE public.rental_contracts SET status='picked_up', updated_at=now()
    WHERE id=p_contract_id AND status='confirmed';
  INSERT INTO public.rental_events(contract_id,item_id,event_type,notes,actor_id)
    VALUES(p_contract_id,p_item_id,'pickup',NULLIF(btrim(p_note),''),v_actor);
  RETURN p_item_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.return_rental_item(p_contract_id uuid, p_item_id uuid, p_note text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_item public.rental_items%ROWTYPE;
BEGIN
  IF v_actor IS NULL OR NOT (
    public.has_role(v_actor,'admin') OR public.has_role(v_actor,'manager') OR
    public.has_role(v_actor,'staff') OR public.has_role(v_actor,'cashier')
  ) THEN RAISE EXCEPTION 'Operador não autorizado' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_item FROM public.rental_items WHERE id=p_item_id AND contract_id=p_contract_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Traje não encontrado no contrato' USING ERRCODE='22023'; END IF;
  IF v_item.status = 'returned' THEN RETURN p_item_id; END IF;
  IF v_item.status NOT IN ('confirmed','picked_up') THEN
    RAISE EXCEPTION 'Este traje não pode ser devolvido neste estado' USING ERRCODE='22023';
  END IF;
  UPDATE public.rental_items SET status='returned', actual_return_at=now() WHERE id=p_item_id;
  -- A peça não volta a ficar disponível até a liberação manual após a lavanderia.
  UPDATE public.product_units SET status='laundry' WHERE id=v_item.unit_id;
  INSERT INTO public.rental_events(contract_id,item_id,event_type,notes,actor_id)
    VALUES(p_contract_id,p_item_id,'return',NULLIF(btrim(p_note),''),v_actor);
  IF NOT EXISTS (
    SELECT 1 FROM public.rental_items
      WHERE contract_id=p_contract_id AND status IN ('confirmed','picked_up')
  ) THEN
    UPDATE public.rental_contracts SET status='completed', updated_at=now()
      WHERE id=p_contract_id AND status IN ('confirmed','picked_up');
  END IF;
  RETURN p_item_id;
END;
$$;
REVOKE ALL ON FUNCTION public.pickup_rental_item(uuid,uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.return_rental_item(uuid,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pickup_rental_item(uuid,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.return_rental_item(uuid,uuid,text) TO authenticated;
