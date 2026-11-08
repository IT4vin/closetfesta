-- Operação de lavanderia e manutenção sem alterar contratos históricos.
-- Políticas por perfil: administração altera configuração; gerência lê.
DROP POLICY IF EXISTS "Managers write settings" ON public.settings;
DROP POLICY IF EXISTS "Only admins write settings" ON public.settings;
CREATE POLICY "Only admins write settings"
  ON public.settings FOR ALL TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.product_care_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.product_units(id) ON DELETE RESTRICT,
  kind text NOT NULL CHECK (kind IN ('laundry','maintenance')),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','completed','superseded')),
  source_item_id uuid REFERENCES public.rental_items(id) ON DELETE RESTRICT,
  reason text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 3 AND 500),
  operation_id uuid UNIQUE,
  opened_by uuid REFERENCES auth.users(id),
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_by uuid REFERENCES auth.users(id),
  closed_at timestamptz,
  closing_notes text CHECK (char_length(coalesce(closing_notes,'')) <= 1000),
  CONSTRAINT care_closed_fields_consistent CHECK (
    (status='open' AND closed_at IS NULL) OR
    (status<>'open' AND closed_at IS NOT NULL)
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_care_one_open_per_unit
  ON public.product_care_tasks(unit_id) WHERE status='open';
CREATE INDEX IF NOT EXISTS idx_product_care_status_date
  ON public.product_care_tasks(status,opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_care_unit_date
  ON public.product_care_tasks(unit_id,opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_care_source_item
  ON public.product_care_tasks(source_item_id) WHERE source_item_id IS NOT NULL;
ALTER TABLE public.product_care_tasks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.product_care_tasks FROM anon,authenticated;
GRANT SELECT ON TABLE public.product_care_tasks TO authenticated;
DROP POLICY IF EXISTS "Workers read garment care" ON public.product_care_tasks;
CREATE POLICY "Workers read garment care"
  ON public.product_care_tasks FOR SELECT TO authenticated
  USING (
    public.has_role((select auth.uid()),'admin'::public.app_role) OR
    public.has_role((select auth.uid()),'manager'::public.app_role) OR
    public.has_role((select auth.uid()),'staff'::public.app_role)
  );

-- No direct UPDATE is granted for physical units; the transactional RPCs are authoritative.
-- The trigger keeps legacy return/laundry-release actions synchronized with care orders.
CREATE OR REPLACE FUNCTION public.closet_care_track_unit_state()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  v_source_item uuid;
  v_existing_kind text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  IF NEW.status IN ('laundry','maintenance') THEN
    SELECT kind INTO v_existing_kind
      FROM public.product_care_tasks
      WHERE unit_id=NEW.id AND status='open';
    IF v_existing_kind IS NOT NULL AND v_existing_kind<>NEW.status THEN
      RAISE EXCEPTION 'Há um atendimento anterior aberto para este exemplar'
        USING ERRCODE='22023';
    END IF;
    IF v_existing_kind IS NULL THEN
      IF NEW.status='laundry' THEN
        SELECT id INTO v_source_item FROM public.rental_items
          WHERE unit_id=NEW.id AND status='returned'
            AND actual_return_at >= now()-interval '10 minutes'
          ORDER BY actual_return_at DESC LIMIT 1;
      END IF;
      INSERT INTO public.product_care_tasks
        (unit_id,kind,source_item_id,reason,opened_by)
      VALUES (
        NEW.id,NEW.status,v_source_item,
        CASE WHEN NEW.status='laundry'
          THEN 'Lavanderia após devolução'
          ELSE 'Manutenção do exemplar' END,
        auth.uid()
      );
    END IF;
  ELSIF NEW.status='available' THEN
    -- Legacy rental_release_laundry still works and its release is audited here.
    UPDATE public.product_care_tasks
       SET status='completed',closed_by=auth.uid(),closed_at=now(),
           closing_notes='Exemplar liberado pelo fluxo de locações'
     WHERE unit_id=NEW.id AND status='open';
  ELSIF EXISTS (
    SELECT 1 FROM public.product_care_tasks
    WHERE unit_id=NEW.id AND status='open'
  ) THEN
    RAISE EXCEPTION 'Conclua a ordem de lavanderia/manutenção antes de alterar o estado do exemplar'
      USING ERRCODE='22023';
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.closet_care_track_unit_state() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS trg_closet_care_unit_state ON public.product_units;
CREATE TRIGGER trg_closet_care_unit_state
AFTER UPDATE OF status ON public.product_units
FOR EACH ROW EXECUTE FUNCTION public.closet_care_track_unit_state();

-- A single atomic operation can place an available/returned garment in maintenance.
CREATE OR REPLACE FUNCTION public.closet_care_start_maintenance(
  p_unit_id uuid, p_reason text, p_operation_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_unit public.product_units%ROWTYPE;
  v_old_task public.product_care_tasks%ROWTYPE;
  v_existing public.product_care_tasks%ROWTYPE;
  v_task_id uuid;
BEGIN
  IF v_actor IS NULL OR NOT (
    public.has_role(v_actor,'admin'::public.app_role) OR
    public.has_role(v_actor,'manager'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Somente a gerência pode iniciar manutenção'
      USING ERRCODE='42501';
  END IF;
  IF p_unit_id IS NULL OR p_operation_id IS NULL
    OR char_length(btrim(coalesce(p_reason,''))) NOT BETWEEN 5 AND 500
  THEN
    RAISE EXCEPTION 'Informe o exemplar, justificativa e identificador da operação'
      USING ERRCODE='22023';
  END IF;

  SELECT * INTO v_existing FROM public.product_care_tasks
    WHERE operation_id=p_operation_id;
  IF FOUND THEN
    IF v_existing.unit_id<>p_unit_id OR v_existing.kind<>'maintenance'
      OR v_existing.reason<>btrim(p_reason) THEN
      RAISE EXCEPTION 'Identificador de operação já utilizado com outros dados'
        USING ERRCODE='22023';
    END IF;
    RETURN jsonb_build_object('id',v_existing.id,'status',v_existing.status);
  END IF;

  SELECT * INTO v_unit FROM public.product_units WHERE id=p_unit_id FOR UPDATE;
  IF NOT FOUND OR v_unit.status NOT IN ('available','laundry') THEN
    RAISE EXCEPTION 'Exemplar indisponível para iniciar manutenção'
      USING ERRCODE='22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.rental_items WHERE unit_id=p_unit_id AND status='picked_up'
  ) THEN
    RAISE EXCEPTION 'Não é possível iniciar manutenção de um traje ainda retirado'
      USING ERRCODE='22023';
  END IF;

  SELECT * INTO v_old_task FROM public.product_care_tasks
     WHERE unit_id=p_unit_id AND status='open' FOR UPDATE;
  IF FOUND THEN
    IF v_old_task.kind<>'laundry' OR v_unit.status<>'laundry' THEN
      RAISE EXCEPTION 'Já existe atendimento em andamento para este exemplar'
        USING ERRCODE='22023';
    END IF;
    UPDATE public.product_care_tasks
      SET status='superseded',closed_at=now(),closed_by=v_actor,
          closing_notes='Encaminhado da lavanderia para manutenção; lavagem não foi declarada concluída.'
      WHERE id=v_old_task.id;
  END IF;

  INSERT INTO public.product_care_tasks
    (unit_id,kind,reason,operation_id,opened_by)
    VALUES (p_unit_id,'maintenance',btrim(p_reason),p_operation_id,v_actor)
    RETURNING id INTO v_task_id;
  UPDATE public.product_units SET status='maintenance' WHERE id=p_unit_id;
  RETURN jsonb_build_object('id',v_task_id,'status','open');
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.closet_care_start_maintenance(uuid,text,uuid)
  FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.closet_care_start_maintenance(uuid,text,uuid)
  TO authenticated;

-- Release only after physical inspection, regardless of which workflow created the task.
CREATE OR REPLACE FUNCTION public.closet_care_complete(
  p_task_id uuid, p_notes text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_unit_id uuid;
  v_unit public.product_units%ROWTYPE;
  v_task public.product_care_tasks%ROWTYPE;
BEGIN
  IF v_actor IS NULL OR NOT (
    public.has_role(v_actor,'admin'::public.app_role) OR
    public.has_role(v_actor,'manager'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Somente a gerência pode liberar trajes'
      USING ERRCODE='42501';
  END IF;
  IF p_task_id IS NULL OR char_length(coalesce(p_notes,'')) > 1000 THEN
    RAISE EXCEPTION 'Identificador/observações inválidos' USING ERRCODE='22023';
  END IF;

  SELECT unit_id INTO v_unit_id FROM public.product_care_tasks WHERE id=p_task_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Atendimento não encontrado' USING ERRCODE='P0002'; END IF;
  -- Always lock unit first: same ordering as pickup and maintenance.
  SELECT * INTO v_unit FROM public.product_units WHERE id=v_unit_id FOR UPDATE;
  SELECT * INTO v_task FROM public.product_care_tasks WHERE id=p_task_id FOR UPDATE;
  IF NOT FOUND OR v_task.status<>'open' OR v_task.unit_id<>v_unit_id THEN
    RAISE EXCEPTION 'Atendimento não está em aberto' USING ERRCODE='22023';
  END IF;
  IF v_unit.status<>v_task.kind THEN
    RAISE EXCEPTION 'O estado do exemplar não corresponde ao atendimento'
      USING ERRCODE='22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.rental_items
    WHERE unit_id=v_unit_id AND status='picked_up'
  ) THEN
    RAISE EXCEPTION 'Exemplar ainda retirado: bloqueada a liberação'
      USING ERRCODE='22023';
  END IF;

  UPDATE public.product_care_tasks
     SET status='completed',closed_at=now(),closed_by=v_actor,
         closing_notes=NULLIF(btrim(p_notes),'')
   WHERE id=p_task_id;
  UPDATE public.product_units SET status='available' WHERE id=v_unit_id;
  IF v_task.kind='laundry' AND v_task.source_item_id IS NOT NULL THEN
    INSERT INTO public.rental_item_events(item_id,actor_id,event_type,notes)
      VALUES (v_task.source_item_id,v_actor,'laundry_release',
        coalesce(NULLIF(btrim(p_notes),''),'Traje conferido e liberado pela gerência'));
  END IF;
  RETURN jsonb_build_object('id',p_task_id,'status','completed','unit_id',v_unit_id);
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.closet_care_complete(uuid,text)
  FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.closet_care_complete(uuid,text)
  TO authenticated;

-- Adopt any previously pending laundry/maintenance garments without changing their status.
INSERT INTO public.product_care_tasks(unit_id,kind,reason)
SELECT u.id,u.status,
  CASE WHEN u.status='laundry' THEN 'Lavanderia em andamento (registro anterior)'
       ELSE 'Manutenção em andamento (registro anterior)' END
  FROM public.product_units u
 WHERE u.status IN ('laundry','maintenance')
   AND NOT EXISTS (
     SELECT 1 FROM public.product_care_tasks t WHERE t.unit_id=u.id AND t.status='open'
   );
