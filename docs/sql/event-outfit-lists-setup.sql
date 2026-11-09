-- Closet Festa: listagens de trajes por evento
-- Aplicado no projeto roqcwdlsuawrdbmnwbvv em 2026-11-08.
-- Execute somente após instalar as tabelas de clientes, produtos e contratos de aluguel.
-- Reexecução idempotente para as tabelas, funções, índices, RLS e gatilhos.

CREATE TABLE IF NOT EXISTS public."event_outfit_lists" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "organizer_name" text NOT NULL,
  "partner_name" text,
  "event_kind" text DEFAULT 'casamento'::text NOT NULL,
  "event_date" date NOT NULL,
  "venue" text,
  "phone" text,
  "notes" text,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "event_outfit_lists_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT "event_outfit_lists_event_kind_check" CHECK ((event_kind = ANY (ARRAY['casamento'::text, 'debutante'::text, 'formatura'::text, 'outro'::text]))),
  CONSTRAINT "event_outfit_lists_organizer_name_check" CHECK (((length(btrim(organizer_name)) >= 2) AND (length(btrim(organizer_name)) <= 160))),
  CONSTRAINT "event_outfit_lists_pkey" PRIMARY KEY (id),
  CONSTRAINT "event_outfit_lists_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'completed'::text, 'cancelled'::text]))),
  CONSTRAINT "event_outfit_lists_title_check" CHECK (((length(btrim(title)) >= 2) AND (length(btrim(title)) <= 180)))
);
CREATE INDEX IF NOT EXISTS idx_event_outfit_lists_date ON public.event_outfit_lists USING btree (event_date, status);

CREATE TABLE IF NOT EXISTS public."event_outfit_groups" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "list_id" uuid NOT NULL,
  "role" text NOT NULL,
  "target_count" integer DEFAULT 0 NOT NULL,
  "garment_color" text,
  "accessory_color" text,
  "garment_notes" text,
  "accessory_notes" text,
  "position" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "event_outfit_groups_list_id_fkey" FOREIGN KEY (list_id) REFERENCES event_outfit_lists(id) ON DELETE RESTRICT,
  CONSTRAINT "event_outfit_groups_list_id_id_key" UNIQUE (list_id, id),
  CONSTRAINT "event_outfit_groups_pkey" PRIMARY KEY (id),
  CONSTRAINT "event_outfit_groups_role_check" CHECK (((length(btrim(role)) >= 2) AND (length(btrim(role)) <= 120))),
  CONSTRAINT "event_outfit_groups_target_count_check" CHECK (((target_count >= 0) AND (target_count <= 500)))
);
CREATE INDEX IF NOT EXISTS idx_event_outfit_groups_list ON public.event_outfit_groups USING btree (list_id, "position");

CREATE TABLE IF NOT EXISTS public."event_outfit_group_products" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "group_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "item_kind" text DEFAULT 'traje'::text NOT NULL,
  "required" boolean DEFAULT false NOT NULL,
  "notes" text,
  "position" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "event_outfit_group_products_group_id_fkey" FOREIGN KEY (group_id) REFERENCES event_outfit_groups(id) ON DELETE CASCADE,
  CONSTRAINT "event_outfit_group_products_group_id_product_id_key" UNIQUE (group_id, product_id),
  CONSTRAINT "event_outfit_group_products_item_kind_check" CHECK ((item_kind = ANY (ARRAY['traje'::text, 'acessorio'::text]))),
  CONSTRAINT "event_outfit_group_products_pkey" PRIMARY KEY (id),
  CONSTRAINT "event_outfit_group_products_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_event_outfit_group_products_group ON public.event_outfit_group_products USING btree (group_id, "position");

CREATE TABLE IF NOT EXISTS public."event_outfit_participants" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "list_id" uuid NOT NULL,
  "group_id" uuid NOT NULL,
  "client_id" uuid NOT NULL,
  "contract_id" uuid,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "notes" text,
  "spec_snapshot" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "event_outfit_participants_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
  CONSTRAINT "event_outfit_participants_contract_id_fkey" FOREIGN KEY (contract_id) REFERENCES rental_contracts(id) ON DELETE SET NULL,
  CONSTRAINT "event_outfit_participants_contract_id_key" UNIQUE (contract_id),
  CONSTRAINT "event_outfit_participants_group_list_fk" FOREIGN KEY (list_id, group_id) REFERENCES event_outfit_groups(list_id, id) ON DELETE RESTRICT,
  CONSTRAINT "event_outfit_participants_one_client_per_list" UNIQUE (list_id, client_id),
  CONSTRAINT "event_outfit_participants_pkey" PRIMARY KEY (id),
  CONSTRAINT "event_outfit_participants_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'contacted'::text, 'fitting'::text, 'contracted'::text, 'completed'::text, 'cancelled'::text])))
);
CREATE INDEX IF NOT EXISTS idx_event_outfit_participants_client ON public.event_outfit_participants USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_event_outfit_participants_group ON public.event_outfit_participants USING btree (group_id, status);

CREATE OR REPLACE FUNCTION public.event_outfit_authorized()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$ SELECT auth.uid() IS NOT NULL AND (
  public.has_role(auth.uid(),'admin'::public.app_role)
  OR public.has_role(auth.uid(),'manager'::public.app_role)
  OR public.has_role(auth.uid(),'staff'::public.app_role)
  OR public.has_role(auth.uid(),'cashier'::public.app_role)) $function$
REVOKE ALL ON FUNCTION public.event_outfit_authorized() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.event_outfit_authorized() TO authenticated;

CREATE OR REPLACE FUNCTION public.event_outfit_create_list(p_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_list uuid;
  v_group jsonb;
  v_role text;
  v_count int;
BEGIN
  IF NOT public.event_outfit_authorized() THEN RAISE EXCEPTION 'Sem permissão para criar listagens' USING ERRCODE='42501'; END IF;
  IF jsonb_typeof(p_data) <> 'object' OR jsonb_typeof(p_data->'groups') <> 'array'
     OR jsonb_array_length(p_data->'groups') NOT BETWEEN 1 AND 30 THEN
    RAISE EXCEPTION 'Informe o evento e ao menos um grupo' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.event_outfit_lists
    (title,organizer_name,partner_name,event_kind,event_date,venue,phone,notes,created_by)
  VALUES (
    btrim(p_data->>'title'), btrim(p_data->>'organizer_name'),
    NULLIF(btrim(p_data->>'partner_name'),''),
    COALESCE(NULLIF(p_data->>'event_kind',''),'casamento'),
    (p_data->>'event_date')::date,
    NULLIF(btrim(p_data->>'venue'),''),
    NULLIF(btrim(p_data->>'phone'),''),
    NULLIF(btrim(p_data->>'notes'),''),
    auth.uid())
  RETURNING id INTO v_list;
  FOR v_group IN SELECT value FROM jsonb_array_elements(p_data->'groups') LOOP
    v_role:=btrim(v_group->>'role');
    v_count:=COALESCE((v_group->>'target_count')::integer,0);
    IF v_count NOT BETWEEN 0 AND 500 THEN RAISE EXCEPTION 'Quantidade fora do intervalo permitido' USING ERRCODE='22023'; END IF;
    INSERT INTO public.event_outfit_groups(list_id,role,target_count,garment_color,accessory_color,garment_notes,accessory_notes,position)
    VALUES (v_list,v_role,v_count,NULLIF(btrim(v_group->>'garment_color'),''),
      NULLIF(btrim(v_group->>'accessory_color'),''),
      NULLIF(btrim(v_group->>'garment_notes'),''),
      NULLIF(btrim(v_group->>'accessory_notes'),''),
      COALESCE((v_group->>'position')::integer,0));
  END LOOP;
  RETURN v_list;
END $function$
REVOKE ALL ON FUNCTION public.event_outfit_create_list(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.event_outfit_create_list(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.event_outfit_add_participant(p_group_id uuid, p_client jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
 v_g public.event_outfit_groups%ROWTYPE;
 v_l public.event_outfit_lists%ROWTYPE;
 v_client_id uuid;
 v_name text;
 v_document text;
 v_phone text;
 v_existing boolean:=false;
 v_participant uuid;
BEGIN
 IF NOT public.event_outfit_authorized() THEN RAISE EXCEPTION 'Sem permissão para cadastrar participantes' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_g FROM public.event_outfit_groups WHERE id=p_group_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Grupo não encontrado' USING ERRCODE='22023'; END IF;
 SELECT * INTO v_l FROM public.event_outfit_lists WHERE id=v_g.list_id;
 IF v_l.status IN ('completed','cancelled') THEN RAISE EXCEPTION 'Listagem encerrada' USING ERRCODE='22023'; END IF;
 v_client_id:=NULLIF(p_client->>'client_id','')::uuid;
 v_name:=NULLIF(btrim(p_client->>'full_name'),'');
 v_document:=NULLIF(regexp_replace(COALESCE(p_client->>'document',''), '[^0-9]', '', 'g'),'');
 v_phone:=NULLIF(btrim(p_client->>'phone'),'');
 IF v_client_id IS NULL THEN
   IF v_name IS NULL OR length(v_name)<2 THEN RAISE EXCEPTION 'Informe o nome do participante' USING ERRCODE='22023'; END IF;
   IF v_document IS NOT NULL AND length(v_document) NOT IN (11,14) THEN RAISE EXCEPTION 'CPF ou CNPJ inválido' USING ERRCODE='22023'; END IF;
   IF v_document IS NOT NULL THEN
     SELECT id INTO v_client_id FROM public.clients
     WHERE regexp_replace(COALESCE(document,''), '[^0-9]', '', 'g')=v_document
     ORDER BY created_at LIMIT 1;
     v_existing:=v_client_id IS NOT NULL;
   END IF;
   IF v_client_id IS NULL THEN
     INSERT INTO public.clients(full_name,document,phone,email,address,created_by)
     VALUES (v_name,v_document,v_phone,NULLIF(btrim(p_client->>'email'),''),
       CASE WHEN jsonb_typeof(p_client->'address')='object' THEN p_client->'address' ELSE NULL END,
       auth.uid()) RETURNING id INTO v_client_id;
   END IF;
 ELSE
   IF NOT EXISTS(SELECT 1 FROM public.clients WHERE id=v_client_id) THEN
     RAISE EXCEPTION 'Cliente não encontrado' USING ERRCODE='22023';
   END IF;
   v_existing:=true;
 END IF;
 IF EXISTS(SELECT 1 FROM public.event_outfit_participants WHERE list_id=v_g.list_id AND client_id=v_client_id) THEN
   RAISE EXCEPTION 'Este cliente já participa da listagem' USING ERRCODE='23505';
 END IF;
 INSERT INTO public.event_outfit_participants(list_id,group_id,client_id,notes)
 VALUES(v_g.list_id,v_g.id,v_client_id,NULLIF(btrim(p_client->>'notes'),''))
 RETURNING id INTO v_participant;
 RETURN jsonb_build_object('id',v_participant,'client_id',v_client_id,'existing_client',v_existing);
END $function$
REVOKE ALL ON FUNCTION public.event_outfit_add_participant(uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.event_outfit_add_participant(uuid,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.event_outfit_validate_contract(p_participant_id uuid, p_contract_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_p public.event_outfit_participants%ROWTYPE;
  v_l public.event_outfit_lists%ROWTYPE;
  v_c public.rental_contracts%ROWTYPE;
  v_wrong int;
  v_spec jsonb;
BEGIN
 IF NOT public.event_outfit_authorized() THEN RAISE EXCEPTION 'Sem permissão de acesso à listagem' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_p FROM public.event_outfit_participants WHERE id=p_participant_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Participante não encontrado' USING ERRCODE='22023'; END IF;
 SELECT * INTO v_l FROM public.event_outfit_lists WHERE id=v_p.list_id;
 IF v_l.status IN ('completed','cancelled') THEN RAISE EXCEPTION 'Listagem encerrada' USING ERRCODE='22023'; END IF;
 SELECT * INTO v_c FROM public.rental_contracts WHERE id=p_contract_id;
 IF NOT FOUND OR v_c.client_id<>v_p.client_id OR v_c.status='cancelled' THEN
  RAISE EXCEPTION 'Contrato inexistente, cancelado ou de outro cliente' USING ERRCODE='22023';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.event_outfit_group_products WHERE group_id=v_p.group_id AND item_kind='traje') THEN
   RAISE EXCEPTION 'Defina pelo menos um traje aprovado no grupo antes de contratar' USING ERRCODE='22023';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.rental_items ri WHERE ri.contract_id=p_contract_id AND ri.status<>'cancelled') THEN
   RAISE EXCEPTION 'O contrato não possui itens de aluguel ativos' USING ERRCODE='22023';
 END IF;
 SELECT count(*) INTO v_wrong FROM public.rental_items ri
 LEFT JOIN public.event_outfit_group_products gp ON gp.group_id=v_p.group_id AND gp.product_id=ri.product_id
 WHERE ri.contract_id=p_contract_id AND ri.status<>'cancelled'
   AND (gp.id IS NULL OR ri.event_date<>v_l.event_date);
 IF v_wrong>0 THEN RAISE EXCEPTION 'Contrato contém produto não aprovado ou data divergente do casamento' USING ERRCODE='22023'; END IF;
 IF NOT EXISTS(
   SELECT 1 FROM public.rental_items ri JOIN public.event_outfit_group_products gp
     ON gp.group_id=v_p.group_id AND gp.product_id=ri.product_id AND gp.item_kind='traje'
   WHERE ri.contract_id=p_contract_id AND ri.status<>'cancelled'
 ) THEN RAISE EXCEPTION 'Contrato precisa incluir um traje aprovado' USING ERRCODE='22023'; END IF;
 IF EXISTS (
   SELECT 1 FROM public.event_outfit_group_products gp
   WHERE gp.group_id=v_p.group_id AND gp.required
   AND NOT EXISTS (SELECT 1 FROM public.rental_items ri
     WHERE ri.contract_id=p_contract_id AND ri.product_id=gp.product_id AND ri.status<>'cancelled')
 ) THEN RAISE EXCEPTION 'Falta um acessório ou traje obrigatório dos noivos' USING ERRCODE='22023'; END IF;
 SELECT jsonb_build_object('list_id',v_l.id,'list_title',v_l.title,'event_date',v_l.event_date,
   'group_id',g.id,'role',g.role,'garment_color',g.garment_color,
   'accessory_color',g.accessory_color,'garment_notes',g.garment_notes,'accessory_notes',g.accessory_notes,
   'products',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',gp.product_id,'kind',gp.item_kind,'required',gp.required,'notes',gp.notes))
    FROM public.event_outfit_group_products gp WHERE gp.group_id=g.id),'[]'::jsonb))
 INTO v_spec FROM public.event_outfit_groups g WHERE g.id=v_p.group_id;
 RETURN v_spec;
END $function$
REVOKE ALL ON FUNCTION public.event_outfit_validate_contract(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.event_outfit_validate_contract(uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.event_outfit_link_contract(p_participant_id uuid, p_contract_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_p public.event_outfit_participants%ROWTYPE; v_spec jsonb;
BEGIN
 IF NOT public.event_outfit_authorized() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_p FROM public.event_outfit_participants WHERE id=p_participant_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Participante não encontrado' USING ERRCODE='22023'; END IF;
 IF v_p.contract_id IS NOT NULL AND v_p.contract_id<>p_contract_id THEN
   RAISE EXCEPTION 'Participante já possui outro contrato; verifique o cadastro' USING ERRCODE='23505';
 END IF;
 IF EXISTS(SELECT 1 FROM public.event_outfit_participants WHERE contract_id=p_contract_id AND id<>p_participant_id) THEN
   RAISE EXCEPTION 'Contrato já vinculado a outro participante' USING ERRCODE='23505';
 END IF;
 v_spec:=public.event_outfit_validate_contract(p_participant_id,p_contract_id);
 UPDATE public.event_outfit_participants
 SET contract_id=p_contract_id,status='contracted',spec_snapshot=v_spec
 WHERE id=p_participant_id;
 RETURN jsonb_build_object('participant_id',p_participant_id,'contract_id',p_contract_id,'linked',true);
END $function$
REVOKE ALL ON FUNCTION public.event_outfit_link_contract(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.event_outfit_link_contract(uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.event_outfit_create_contract(p_participant_id uuid, p_request jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_p public.event_outfit_participants%ROWTYPE;
  v_client public.clients%ROWTYPE;
  v_list public.event_outfit_lists%ROWTYPE;
  v_item jsonb;
  v_product uuid;
  v_response jsonb;
  v_contract_id uuid;
  v_note text;
BEGIN
 IF NOT public.event_outfit_authorized() THEN RAISE EXCEPTION 'Sem permissão para contratar' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_p FROM public.event_outfit_participants WHERE id=p_participant_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Participante não encontrado' USING ERRCODE='22023'; END IF;
 IF v_p.contract_id IS NOT NULL THEN
   RAISE EXCEPTION 'Participante já possui contrato na listagem' USING ERRCODE='23505';
 END IF;
 SELECT * INTO v_client FROM public.clients WHERE id=v_p.client_id;
 SELECT * INTO v_list FROM public.event_outfit_lists WHERE id=v_p.list_id;
 IF v_list.status IN ('completed','cancelled') THEN RAISE EXCEPTION 'Listagem encerrada' USING ERRCODE='22023'; END IF;
 IF jsonb_typeof(p_request) <> 'object' OR jsonb_typeof(p_request->'items')<>'array'
   OR jsonb_array_length(p_request->'items')<1 THEN
   RAISE EXCEPTION 'Selecione os trajes e acessórios' USING ERRCODE='22023';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.event_outfit_group_products WHERE group_id=v_p.group_id AND item_kind='traje') THEN
   RAISE EXCEPTION 'Os noivos precisam escolher pelo menos um traje para esse grupo' USING ERRCODE='22023';
 END IF;
 FOR v_item IN SELECT value FROM jsonb_array_elements(p_request->'items') LOOP
   IF COALESCE(v_item->>'item_type','') <> 'rental'
     OR COALESCE(v_item->>'event_date','') <> v_list.event_date::text THEN
     RAISE EXCEPTION 'Somente aluguéis na data da listagem são permitidos' USING ERRCODE='22023';
   END IF;
   v_product:=NULLIF(v_item->>'product_id','')::uuid;
   IF NOT EXISTS(SELECT 1 FROM public.event_outfit_group_products WHERE group_id=v_p.group_id AND product_id=v_product) THEN
     RAISE EXCEPTION 'Produto não aprovado para esse grupo pelos noivos' USING ERRCODE='22023';
   END IF;
 END LOOP;
 IF NOT EXISTS(
   SELECT 1 FROM jsonb_array_elements(p_request->'items') i
   JOIN public.event_outfit_group_products gp ON gp.product_id=(i->>'product_id')::uuid
   WHERE gp.group_id=v_p.group_id AND gp.item_kind='traje'
 ) THEN RAISE EXCEPTION 'Escolha um traje aprovado para o participante' USING ERRCODE='22023'; END IF;
 IF EXISTS(
  SELECT 1 FROM public.event_outfit_group_products gp
  WHERE gp.group_id=v_p.group_id AND gp.required
    AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_request->'items') i WHERE (i->>'product_id')::uuid=gp.product_id)
 ) THEN RAISE EXCEPTION 'Inclua todos os acessórios e trajes obrigatórios' USING ERRCODE='22023'; END IF;
 v_note:=concat_ws(' | ',NULLIF(btrim(p_request->>'observations'),''),
   'Listagem: '||v_list.title,'Participante: '||v_client.full_name);
 v_response:=public.create_rental_contract(
   (p_request - 'client_id' - 'customer_name' - 'customer_document' - 'customer_phone' - 'observations')
   || jsonb_build_object('client_id',v_client.id,'customer_name',v_client.full_name,
     'customer_document',v_client.document,'customer_phone',v_client.phone,
     'observations',v_note)
 );
 v_contract_id:=(v_response->>'id')::uuid;
 PERFORM public.event_outfit_link_contract(p_participant_id,v_contract_id);
 RETURN v_response || jsonb_build_object('participant_id',p_participant_id,'list_id',v_list.id);
END $function$
REVOKE ALL ON FUNCTION public.event_outfit_create_contract(uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.event_outfit_create_contract(uuid,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.event_outfit_guard_participant_contract()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF TG_OP='INSERT' THEN
    IF NEW.contract_id IS NOT NULL THEN
      RAISE EXCEPTION 'Vincule contratos após cadastrar o participante' USING ERRCODE='22023';
    END IF;
    IF NEW.status IN ('contracted','completed') THEN
      RAISE EXCEPTION 'Não é possível marcar contratado sem contrato' USING ERRCODE='22023';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.contract_id IS NOT NULL THEN
    IF NEW.list_id IS DISTINCT FROM OLD.list_id
       OR NEW.group_id IS DISTINCT FROM OLD.group_id
       OR NEW.client_id IS DISTINCT FROM OLD.client_id THEN
      RAISE EXCEPTION 'Grupo e cliente não podem ser trocados após a contratação' USING ERRCODE='22023';
    END IF;
    IF NEW.contract_id IS NULL AND EXISTS(
      SELECT 1 FROM public.rental_contracts c
      WHERE c.id=OLD.contract_id AND c.status<>'cancelled'
    ) THEN
      RAISE EXCEPTION 'Não desvincule contrato ativo; utilize o processo de cancelamento' USING ERRCODE='22023';
    END IF;
  END IF;
  IF NEW.contract_id IS DISTINCT FROM OLD.contract_id AND NEW.contract_id IS NOT NULL THEN
    -- Não permite burlar as regras dos noivos por um UPDATE direto no Data API.
    NEW.spec_snapshot := public.event_outfit_validate_contract(NEW.id,NEW.contract_id);
    NEW.status := 'contracted';
  END IF;
  IF NEW.contract_id IS NULL AND NEW.status IN ('contracted','completed') THEN
    RAISE EXCEPTION 'Contrato individual obrigatório para este status' USING ERRCODE='22023';
  END IF;
  RETURN NEW;
END $function$
REVOKE ALL ON FUNCTION public.event_outfit_guard_participant_contract() FROM PUBLIC;

ALTER TABLE public."event_outfit_lists" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff manage event outfit list v1" ON public."event_outfit_lists";
CREATE POLICY "Staff manage event outfit list v1" ON public."event_outfit_lists" FOR ALL TO authenticated USING (public.event_outfit_authorized()) WITH CHECK (public.event_outfit_authorized());
GRANT SELECT, INSERT, UPDATE, DELETE ON public."event_outfit_lists" TO authenticated;
REVOKE ALL ON public."event_outfit_lists" FROM anon;
DROP TRIGGER IF EXISTS trg_event_outfit_updated_at ON public."event_outfit_lists";
CREATE TRIGGER trg_event_outfit_updated_at BEFORE UPDATE ON event_outfit_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public."event_outfit_groups" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff manage event outfit list v1" ON public."event_outfit_groups";
CREATE POLICY "Staff manage event outfit list v1" ON public."event_outfit_groups" FOR ALL TO authenticated USING (public.event_outfit_authorized()) WITH CHECK (public.event_outfit_authorized());
GRANT SELECT, INSERT, UPDATE, DELETE ON public."event_outfit_groups" TO authenticated;
REVOKE ALL ON public."event_outfit_groups" FROM anon;
DROP TRIGGER IF EXISTS trg_event_outfit_updated_at ON public."event_outfit_groups";
CREATE TRIGGER trg_event_outfit_updated_at BEFORE UPDATE ON event_outfit_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public."event_outfit_group_products" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff manage event outfit list v1" ON public."event_outfit_group_products";
CREATE POLICY "Staff manage event outfit list v1" ON public."event_outfit_group_products" FOR ALL TO authenticated USING (public.event_outfit_authorized()) WITH CHECK (public.event_outfit_authorized());
GRANT SELECT, INSERT, UPDATE, DELETE ON public."event_outfit_group_products" TO authenticated;
REVOKE ALL ON public."event_outfit_group_products" FROM anon;

ALTER TABLE public."event_outfit_participants" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff manage event outfit list v1" ON public."event_outfit_participants";
CREATE POLICY "Staff manage event outfit list v1" ON public."event_outfit_participants" FOR ALL TO authenticated USING (public.event_outfit_authorized()) WITH CHECK (public.event_outfit_authorized());
GRANT SELECT, INSERT, UPDATE, DELETE ON public."event_outfit_participants" TO authenticated;
REVOKE ALL ON public."event_outfit_participants" FROM anon;
DROP TRIGGER IF EXISTS trg_event_outfit_guard_contract ON public."event_outfit_participants";
CREATE TRIGGER trg_event_outfit_guard_contract BEFORE INSERT OR UPDATE ON event_outfit_participants FOR EACH ROW EXECUTE FUNCTION event_outfit_guard_participant_contract();
DROP TRIGGER IF EXISTS trg_event_outfit_updated_at ON public."event_outfit_participants";
CREATE TRIGGER trg_event_outfit_updated_at BEFORE UPDATE ON event_outfit_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

