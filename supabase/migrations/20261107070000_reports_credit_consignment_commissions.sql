
-- Migração versionada: implantação já executada no Supabase em 07/11/2026.
-- Sem exclusão de dados anteriores.
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS acquisition_source text;
CREATE TABLE IF NOT EXISTS public.client_credit_entries(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
 delta numeric(12,2) NOT NULL CHECK(delta<>0),
 kind text NOT NULL CHECK(kind IN('adjustment','transfer_in','transfer_out')),
 related_client_id uuid REFERENCES public.clients(id) ON DELETE RESTRICT,
 note text NOT NULL CHECK(length(btrim(note)) BETWEEN 3 AND 500),
 operation_id uuid NOT NULL,
 created_by uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(operation_id,client_id)
);
CREATE INDEX IF NOT EXISTS client_credits_client_created ON public.client_credit_entries(client_id,created_at DESC);
ALTER TABLE public.client_credit_entries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.client_credit_entries FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.client_credit_entries TO authenticated;
DROP POLICY IF EXISTS "Managers read credit ledger" ON public.client_credit_entries;
CREATE POLICY "Managers read credit ledger" ON public.client_credit_entries FOR SELECT TO authenticated
 USING(public.has_role((select auth.uid()),'admin') OR public.has_role((select auth.uid()),'manager'));

DO $$
BEGIN
 IF EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.product_units'::regclass
   AND conname='product_units_status_check' AND pg_get_constraintdef(oid) NOT LIKE '%consigned%') THEN
   ALTER TABLE public.product_units DROP CONSTRAINT product_units_status_check;
   ALTER TABLE public.product_units ADD CONSTRAINT product_units_status_check
     CHECK(status IN('available','laundry','maintenance','inactive','consigned'));
 END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.product_consignments(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 unit_id uuid NOT NULL REFERENCES public.product_units(id) ON DELETE RESTRICT,
 product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
 partner_name text NOT NULL CHECK(length(btrim(partner_name)) BETWEEN 2 AND 180),
 status text NOT NULL DEFAULT 'active' CHECK(status IN('active','returned')),
 note text,operation_id uuid NOT NULL UNIQUE,
 created_by uuid NOT NULL REFERENCES auth.users(id),
 started_at timestamptz NOT NULL DEFAULT now(),
 returned_at timestamptz,returned_by uuid REFERENCES auth.users(id),
 CHECK((status='returned')=(returned_at IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_consignment_per_unit ON public.product_consignments(unit_id) WHERE status='active';
CREATE INDEX IF NOT EXISTS consignments_product ON public.product_consignments(product_id,started_at DESC);
ALTER TABLE public.product_consignments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.product_consignments FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.product_consignments TO authenticated;
DROP POLICY IF EXISTS "Staff read consignments" ON public.product_consignments;
CREATE POLICY "Staff read consignments" ON public.product_consignments FOR SELECT TO authenticated USING(
 public.has_role((select auth.uid()),'admin') OR public.has_role((select auth.uid()),'manager') OR
 public.has_role((select auth.uid()),'staff') OR public.has_role((select auth.uid()),'cashier'));

CREATE TABLE IF NOT EXISTS public.sales_commissions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 contract_id uuid NOT NULL REFERENCES public.rental_contracts(id) ON DELETE RESTRICT,
 seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 rate numeric(5,2) NOT NULL CHECK(rate>0 AND rate<=100),
 amount numeric(12,2) NOT NULL CHECK(amount>=0),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','paid')),
 operation_id uuid NOT NULL UNIQUE,
 created_by uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 paid_at timestamptz,paid_by uuid REFERENCES auth.users(id),
 UNIQUE(contract_id,seller_id),
 CHECK((status='paid')=(paid_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS sales_commissions_seller ON public.sales_commissions(seller_id,created_at DESC);
ALTER TABLE public.sales_commissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sales_commissions FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.sales_commissions TO authenticated;
DROP POLICY IF EXISTS "Managers and sellers read commissions" ON public.sales_commissions;
CREATE POLICY "Managers and sellers read commissions" ON public.sales_commissions FOR SELECT TO authenticated USING(
 seller_id=(select auth.uid()) OR public.has_role((select auth.uid()),'admin') OR public.has_role((select auth.uid()),'manager'));

CREATE OR REPLACE FUNCTION public.commission_mark_paid(p_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_actor uuid:=auth.uid();
BEGIN
  IF v_actor IS NULL OR NOT (public.has_role(v_actor,'admin') OR public.has_role(v_actor,'manager'))
    THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  UPDATE public.sales_commissions SET status='paid',paid_at=now(),paid_by=v_actor WHERE id=p_id AND status='pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Comissão inexistente ou já paga'; END IF;
  RETURN p_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.commission_mark_paid(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.commission_mark_paid(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.commission_register(p_contract uuid, p_seller uuid, p_rate numeric, p_operation uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_actor uuid:=auth.uid(); v_total numeric; v_current numeric; v_id uuid;
BEGIN
  IF v_actor IS NULL OR NOT (public.has_role(v_actor,'admin') OR public.has_role(v_actor,'manager'))
    THEN RAISE EXCEPTION 'Sem permissão para comissões' USING ERRCODE='42501'; END IF;
  IF p_operation IS NULL OR p_contract IS NULL OR p_seller IS NULL OR p_rate IS NULL OR
      p_rate<=0 OR p_rate>100 OR p_rate<>round(p_rate,2)
    THEN RAISE EXCEPTION 'Dados de comissão inválidos' USING ERRCODE='22023'; END IF;
  SELECT id INTO v_id FROM public.sales_commissions WHERE operation_id=p_operation;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  SELECT total INTO v_total FROM public.rental_contracts
    WHERE id=p_contract AND status<>'cancelled' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contrato não existe ou foi cancelado'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=p_seller AND role IN('staff','manager','admin','cashier'))
    THEN RAISE EXCEPTION 'Vendedor não cadastrado no sistema'; END IF;
  SELECT coalesce(sum(rate),0) INTO v_current FROM public.sales_commissions WHERE contract_id=p_contract;
  IF v_current+p_rate>100 THEN RAISE EXCEPTION 'Soma de comissões excede 100%%'; END IF;
  INSERT INTO public.sales_commissions(contract_id,seller_id,rate,amount,operation_id,created_by)
  VALUES(p_contract,p_seller,p_rate,round(v_total*p_rate/100,2),p_operation,v_actor)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.commission_register(uuid,uuid,numeric,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.commission_register(uuid,uuid,numeric,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.consignment_register(p_unit uuid, p_partner text, p_note text, p_operation uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_actor uuid:=auth.uid(); v_unit public.product_units%ROWTYPE; v_id uuid;
BEGIN
  IF v_actor IS NULL OR NOT (public.has_role(v_actor,'admin') OR public.has_role(v_actor,'manager'))
    THEN RAISE EXCEPTION 'Somente gerentes podem consignar trajes' USING ERRCODE='42501'; END IF;
  IF p_unit IS NULL OR p_operation IS NULL OR length(btrim(coalesce(p_partner,''))) NOT BETWEEN 2 AND 180
    THEN RAISE EXCEPTION 'Exemplar ou parceiro inválido'; END IF;
  SELECT id INTO v_id FROM public.product_consignments WHERE operation_id=p_operation;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  SELECT * INTO v_unit FROM public.product_units WHERE id=p_unit FOR UPDATE;
  IF NOT FOUND OR v_unit.status<>'available' THEN RAISE EXCEPTION 'Exemplar não está disponível'; END IF;
  IF EXISTS (SELECT 1 FROM public.rental_items ri WHERE ri.unit_id=p_unit AND ri.status IN('confirmed','picked_up'))
    THEN RAISE EXCEPTION 'Exemplar possui reserva ou locação ativa'; END IF;
  IF EXISTS (SELECT 1 FROM public.product_consignments c WHERE c.unit_id=p_unit AND c.status='active')
    THEN RAISE EXCEPTION 'Exemplar já consignado'; END IF;
  UPDATE public.product_units SET status='consigned' WHERE id=p_unit;
  INSERT INTO public.product_consignments(unit_id,product_id,partner_name,note,operation_id,created_by)
  VALUES(p_unit,v_unit.product_id,btrim(p_partner),nullif(btrim(p_note),''),p_operation,v_actor)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.consignment_register(uuid,text,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.consignment_register(uuid,text,text,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.consignment_return(p_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_actor uuid:=auth.uid(); v_unit uuid;
BEGIN
  IF v_actor IS NULL OR NOT (public.has_role(v_actor,'admin') OR public.has_role(v_actor,'manager'))
    THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  SELECT unit_id INTO v_unit FROM public.product_consignments WHERE id=p_id AND status='active' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Consignação não encontrada ou já encerrada'; END IF;
  PERFORM 1 FROM public.product_units WHERE id=v_unit FOR UPDATE;
  UPDATE public.product_consignments SET status='returned',returned_at=now(),returned_by=v_actor WHERE id=p_id;
  UPDATE public.product_units SET status='available' WHERE id=v_unit AND status='consigned';
  IF NOT FOUND THEN RAISE EXCEPTION 'Estado do exemplar inconsistente; alteração cancelada'; END IF;
  RETURN p_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.consignment_return(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.consignment_return(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.credit_adjust(p_client uuid, p_delta numeric, p_note text, p_operation uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_actor uuid := auth.uid(); v_balance numeric; v_id uuid;
BEGIN
  IF v_actor IS NULL OR NOT (public.has_role(v_actor,'admin') OR public.has_role(v_actor,'manager'))
    THEN RAISE EXCEPTION 'Sem permissão para ajuste de créditos' USING ERRCODE='42501'; END IF;
  IF p_operation IS NULL OR p_client IS NULL OR p_delta IS NULL OR p_delta=0 OR p_delta<>round(p_delta,2)
    OR length(btrim(coalesce(p_note,''))) NOT BETWEEN 3 AND 500
    THEN RAISE EXCEPTION 'Informe cliente, valor monetário e justificativa' USING ERRCODE='22023'; END IF;
  PERFORM 1 FROM public.clients WHERE id=p_client FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cliente não encontrado'; END IF;
  SELECT id INTO v_id FROM public.client_credit_entries WHERE operation_id=p_operation AND client_id=p_client;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  SELECT coalesce(sum(delta),0) INTO v_balance FROM public.client_credit_entries WHERE client_id=p_client;
  IF v_balance+p_delta<0 THEN RAISE EXCEPTION 'Saldo de crédito insuficiente' USING ERRCODE='22023'; END IF;
  INSERT INTO public.client_credit_entries(client_id,delta,kind,note,operation_id,created_by)
  VALUES(p_client,p_delta,'adjustment',btrim(p_note),p_operation,v_actor) RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.credit_adjust(uuid,numeric,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.credit_adjust(uuid,numeric,text,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.credit_transfer(p_from uuid, p_to uuid, p_amount numeric, p_note text, p_operation uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_actor uuid := auth.uid(); v_balance numeric; v_existing uuid;
BEGIN
  IF v_actor IS NULL OR NOT (public.has_role(v_actor,'admin') OR public.has_role(v_actor,'manager'))
    THEN RAISE EXCEPTION 'Sem permissão para transferir créditos' USING ERRCODE='42501'; END IF;
  IF p_operation IS NULL OR p_from IS NULL OR p_to IS NULL OR p_from=p_to OR
    p_amount IS NULL OR p_amount<=0 OR p_amount<>round(p_amount,2) OR
    length(btrim(coalesce(p_note,''))) NOT BETWEEN 3 AND 500
    THEN RAISE EXCEPTION 'Transferência inválida' USING ERRCODE='22023'; END IF;
  -- Lock ordenado dos dois clientes: serializa ajustes e transferências concorrentes.
  PERFORM 1 FROM public.clients WHERE id IN (p_from,p_to) ORDER BY id FOR UPDATE;
  IF (SELECT count(*) FROM public.clients WHERE id IN (p_from,p_to))<>2
    THEN RAISE EXCEPTION 'Cliente de origem ou destino inexistente'; END IF;
  SELECT id INTO v_existing FROM public.client_credit_entries WHERE operation_id=p_operation LIMIT 1;
  IF v_existing IS NOT NULL THEN RETURN p_operation; END IF;
  SELECT coalesce(sum(delta),0) INTO v_balance FROM public.client_credit_entries WHERE client_id=p_from;
  IF v_balance<p_amount THEN RAISE EXCEPTION 'Crédito insuficiente para transferência' USING ERRCODE='22023'; END IF;
  INSERT INTO public.client_credit_entries(client_id,delta,kind,related_client_id,note,operation_id,created_by)
  VALUES (p_from,-p_amount,'transfer_out',p_to,btrim(p_note),p_operation,v_actor),
         (p_to,p_amount,'transfer_in',p_from,btrim(p_note),p_operation,v_actor);
  RETURN p_operation;
END;
$function$;
REVOKE ALL ON FUNCTION public.credit_transfer(uuid,uuid,numeric,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.credit_transfer(uuid,uuid,numeric,text,uuid) TO authenticated;
