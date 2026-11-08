-- Arquivo jurídico gerado apenas dos dados oficiais do Supabase.
-- O navegador NÃO escolhe preço, cláusulas, dados pessoais nem pagamentos a arquivar.
-- Os snapshots anteriores são preservados (nenhuma reescrita retroativa).
CREATE OR REPLACE FUNCTION public.closet_make_canonical_contract_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_contract public.rental_contracts%ROWTYPE;
  v_client public.clients%ROWTYPE;
  v_expected_revision integer;
  v_number text;
  v_items jsonb;
  v_progress jsonb;
  v_company jsonb;
  v_documents jsonb;
BEGIN
  IF v_actor IS NULL OR NEW.issued_by IS DISTINCT FROM v_actor THEN
    RAISE EXCEPTION 'Somente o próprio usuário autenticado pode emitir uma versão'
      USING ERRCODE='42501';
  END IF;
  IF NEW.contract_id IS NULL THEN
    RAISE EXCEPTION 'Contrato obrigatório' USING ERRCODE='22023';
  END IF;
  -- Uma única versão por número, mesmo em cliques/solicitações concorrentes.
  PERFORM pg_advisory_xact_lock(24021108, hashtext(NEW.contract_id::text));
  SELECT COALESCE(MAX(revision),0)+1 INTO v_expected_revision
    FROM public.rental_document_snapshots
    WHERE contract_id=NEW.contract_id;
  IF NEW.revision<>v_expected_revision THEN
    RAISE EXCEPTION 'Versão fora de sequência; atualize e tente novamente'
      USING ERRCODE='22023';
  END IF;

  SELECT * INTO v_contract
    FROM public.rental_contracts
    WHERE id=NEW.contract_id
    FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato não encontrado' USING ERRCODE='P0002';
  END IF;
  SELECT * INTO v_client
    FROM public.clients
    WHERE id=v_contract.client_id
    FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cliente vinculado não encontrado' USING ERRCODE='P0002';
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id',i.id,'product_id',i.product_id,
      'product',jsonb_build_object('name',p.name,'sku',p.sku),
      'unit_price',i.unit_price,'discount',i.discount,
      'try_on_date',i.try_on_date,'pickup_date',i.pickup_date,
      'event_date',i.event_date,'return_date',i.return_date
    ) ORDER BY i.created_at,i.id), '[]'::jsonb)
  INTO v_items
  FROM public.rental_items i
  JOIN public.products p ON p.id=i.product_id
  WHERE i.contract_id=v_contract.id;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('id',i.id,'status',i.status)
    ORDER BY i.created_at,i.id), '[]'::jsonb)
  INTO v_progress
  FROM public.rental_items i
  WHERE i.contract_id=v_contract.id;

  SELECT COALESCE(value,'{}'::jsonb) INTO v_company
    FROM public.settings
    WHERE key='closet_festa.config.v1.company';
  SELECT COALESCE(value,'{}'::jsonb) INTO v_documents
    FROM public.settings
    WHERE key='closet_festa.config.v1.documents';

  v_number := v_contract.contract_number::text;
  IF length(v_number)<6 THEN v_number := lpad(v_number,6,'0'); END IF;

  -- Conjunto mínimo para imprimir a minuta: recibos, notas internas,
  -- perfil do funcionário e pagamentos não fazem parte do arquivo.
  NEW.payload := jsonb_build_object(
    'detail',jsonb_build_object(
      'order',jsonb_build_object(
        'id',v_contract.id,
        'order_number','ALU-'||v_number,
        'status',v_contract.status,
        'subtotal',v_contract.subtotal,
        'total_discount',v_contract.total_discount,
        'total',v_contract.total,
        'observations',v_contract.notes,
        'customer_id',v_contract.client_id,
        'items',v_items
      ),
      'customer',jsonb_build_object(
        'id',v_client.id,
        'full_name',v_client.full_name,
        'document',v_client.document,
        'phone',v_client.phone,
        'email',v_client.email,
        'address',v_client.address
      ),
      'itemProgress',v_progress,
      'payments',NULL,
      'images','[]'::jsonb
    ),
    'company',COALESCE(v_company,'{}'::jsonb),
    'documents',COALESCE(v_documents,'{}'::jsonb)
  );
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.closet_make_canonical_contract_snapshot()
  FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS trg_closet_canonical_contract_snapshot
  ON public.rental_document_snapshots;
CREATE TRIGGER trg_closet_canonical_contract_snapshot
BEFORE INSERT ON public.rental_document_snapshots
FOR EACH ROW EXECUTE FUNCTION public.closet_make_canonical_contract_snapshot();
