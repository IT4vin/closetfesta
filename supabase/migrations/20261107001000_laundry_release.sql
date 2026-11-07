-- Conclui o ciclo de lavanderia com liberação auditada.
-- Depende de 20261106230000_rental_lifecycle.sql.
ALTER TABLE public.rental_item_events
  DROP CONSTRAINT IF EXISTS rental_item_events_event_type_check;
ALTER TABLE public.rental_item_events
  ADD CONSTRAINT rental_item_events_event_type_check
  CHECK (event_type IN ('pickup','return','laundry_release'));

CREATE OR REPLACE FUNCTION public.rental_release_laundry(p_item_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_item public.rental_items%ROWTYPE;
  v_unit public.product_units%ROWTYPE;
BEGIN
  IF v_actor IS NULL OR NOT (
    public.has_role(v_actor,'admin') OR public.has_role(v_actor,'manager')) THEN
    RAISE EXCEPTION 'Somente gerência pode liberar traje após lavanderia'
      USING ERRCODE='42501';
  END IF;
  IF p_item_id IS NULL THEN RAISE EXCEPTION 'Item obrigatório' USING ERRCODE='22023'; END IF;
  SELECT * INTO v_item FROM public.rental_items WHERE id=p_item_id FOR UPDATE;
  IF NOT FOUND OR v_item.status <> 'returned' THEN
    RAISE EXCEPTION 'É necessário registrar a devolução antes da liberação'
      USING ERRCODE='22023';
  END IF;
  SELECT * INTO v_unit FROM public.product_units WHERE id=v_item.unit_id FOR UPDATE;
  IF NOT FOUND OR v_unit.status <> 'laundry' THEN
    RAISE EXCEPTION 'A unidade não está aguardando liberação da lavanderia'
      USING ERRCODE='22023';
  END IF;
  IF EXISTS (SELECT 1 FROM public.rental_items
             WHERE unit_id=v_item.unit_id AND status='picked_up') THEN
    RAISE EXCEPTION 'Há uma retirada pendente para esta unidade'
      USING ERRCODE='22023';
  END IF;
  UPDATE public.product_units SET status='available' WHERE id=v_item.unit_id;
  INSERT INTO public.rental_item_events(item_id,actor_id,event_type,notes)
    VALUES(p_item_id,v_actor,'laundry_release','Traje conferido e liberado pela gerência');
  RETURN jsonb_build_object('id',p_item_id,'status','available');
END;
$$;
REVOKE ALL ON FUNCTION public.rental_release_laundry(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rental_release_laundry(uuid) TO authenticated;
