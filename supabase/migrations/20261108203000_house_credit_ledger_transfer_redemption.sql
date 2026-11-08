-- Livro de créditos já existe. Acrescentar vínculo ao contrato e tipos
-- de crédito gerado no cancelamento ou consumido em outra locação.
ALTER TABLE public.client_credit_entries
 ADD COLUMN source_contract_id uuid REFERENCES public.rental_contracts(id) ON DELETE RESTRICT;
ALTER TABLE public.client_credit_entries
 DROP CONSTRAINT IF EXISTS client_credit_entries_kind_check;
ALTER TABLE public.client_credit_entries
 ADD CONSTRAINT client_credit_entries_kind_check CHECK
  (kind IN ('adjustment','transfer_in','transfer_out','cancellation_credit','redemption'));
CREATE UNIQUE INDEX idx_single_credit_per_cancelled_contract
 ON public.client_credit_entries(source_contract_id) WHERE kind='cancellation_credit';
CREATE INDEX idx_credit_by_contract ON public.client_credit_entries(source_contract_id,kind);

-- Transferência exige autorização do titular comprovada e motivo.
-- A função antiga mantém uso interno, mas não pode mais ser invocada diretamente
-- via sessão de operador, que poderia omitir a autorização.
REVOKE EXECUTE ON FUNCTION public.credit_transfer(uuid,uuid,numeric,text,uuid)
 FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.credit_transfer_authorized(
 p_from uuid,p_to uuid,p_amount numeric,p_reason text,
 p_authorization_reference text,p_confirmed boolean,p_operation uuid
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE v_actor uuid:=auth.uid();v_result uuid;
BEGIN
 IF v_actor IS NULL OR NOT (
    public.has_role(v_actor,'admin'::public.app_role) OR
    public.has_role(v_actor,'manager'::public.app_role))
 THEN RAISE EXCEPTION 'Transferência de crédito exige gerente ou administrador'
  USING ERRCODE='42501'; END IF;
 IF p_confirmed IS DISTINCT FROM true
   OR length(btrim(coalesce(p_authorization_reference,''))) NOT BETWEEN 10 AND 180
   OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 3 AND 220
 THEN RAISE EXCEPTION 'Confirme autorização do titular e informe referência e motivo'
  USING ERRCODE='22023'; END IF;
 v_result:=public.credit_transfer(
   p_from,p_to,p_amount,
   'Autorização do titular: '||btrim(p_authorization_reference)||
   ' | Motivo: '||btrim(p_reason),p_operation
 );
 RETURN v_result;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.credit_transfer_authorized(uuid,uuid,numeric,text,text,boolean,uuid)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.credit_transfer_authorized(uuid,uuid,numeric,text,text,boolean,uuid)
 TO authenticated;

-- Saldo calculado das movimentações, nunca armazenado em cache mutável.
-- Equipe pode verificar saldo para atender cliente, mas transferir exige gerência.
CREATE OR REPLACE FUNCTION public.credit_client_statement(
 p_client uuid,p_limit integer DEFAULT 30,p_offset integer DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE v_actor uuid:=auth.uid(); v_balance numeric;v_count integer;
 v_client_name text; v_entries jsonb;
BEGIN
 IF v_actor IS NULL OR NOT (
   public.has_role(v_actor,'admin'::public.app_role) OR
   public.has_role(v_actor,'manager'::public.app_role) OR
   public.has_role(v_actor,'staff'::public.app_role) OR
   public.has_role(v_actor,'cashier'::public.app_role)
 ) THEN RAISE EXCEPTION 'Sem permissão para consultar créditos' USING ERRCODE='42501'; END IF;
 IF p_client IS NULL OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100
 OR p_offset IS NULL OR p_offset<0 OR p_offset>10000000
 THEN RAISE EXCEPTION 'Consulta de crédito inválida' USING ERRCODE='22023'; END IF;
 SELECT full_name INTO v_client_name FROM public.clients WHERE id=p_client;
 IF v_client_name IS NULL THEN RAISE EXCEPTION 'Cliente não encontrado' USING ERRCODE='P0002'; END IF;
 SELECT coalesce(sum(delta),0)::numeric,count(*)::integer
 INTO v_balance,v_count
 FROM public.client_credit_entries WHERE client_id=p_client;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'id',t.id,'delta',t.delta,'kind',t.kind,'related_client_id',t.related_client_id,
  'related_client_name',t.related_client_name,'source_contract_id',t.source_contract_id,
  'contract_number',t.contract_number,'note',t.note,'created_by',t.created_by,
  'created_at',t.created_at
 ) ORDER BY t.created_at DESC,t.id DESC),'[]'::jsonb) INTO v_entries
 FROM (
   SELECT e.*,cl.full_name AS related_client_name,c.contract_number
   FROM public.client_credit_entries e
   LEFT JOIN public.clients cl ON cl.id=e.related_client_id
   LEFT JOIN public.rental_contracts c ON c.id=e.source_contract_id
   WHERE e.client_id=p_client ORDER BY e.created_at DESC,e.id DESC
   LIMIT p_limit OFFSET p_offset
 ) t;
 RETURN jsonb_build_object('client_id',p_client,'client_name',v_client_name,
 'balance',v_balance,'total_entries',v_count,'entries',v_entries);
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.credit_client_statement(uuid,integer,integer)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.credit_client_statement(uuid,integer,integer)
 TO authenticated;

-- Resgate de crédito: abate o débito de um contrato sem fingir novo recebimento.
-- Mantém os pagamentos reais separados do consumo de crédito.
CREATE OR REPLACE FUNCTION public.credit_redeem_for_contract(
 p_contract uuid,p_amount numeric,p_reason text,p_operation uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE
 v_actor uuid:=auth.uid();
 v_client uuid;
 v_total numeric;
 v_status text;
 v_paid numeric;
 v_applied numeric;
 v_balance numeric;
 v_existing public.client_credit_entries%ROWTYPE;
 v_entry_id uuid;
BEGIN
 IF v_actor IS NULL OR NOT (
  public.has_role(v_actor,'admin'::public.app_role) OR
  public.has_role(v_actor,'manager'::public.app_role) OR
  public.has_role(v_actor,'staff'::public.app_role) OR
  public.has_role(v_actor,'cashier'::public.app_role)
 ) THEN RAISE EXCEPTION 'Sem permissão para aplicar créditos' USING ERRCODE='42501'; END IF;
 IF p_contract IS NULL OR p_operation IS NULL OR p_amount IS NULL OR
  p_amount<=0 OR p_amount<>round(p_amount,2)
  OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 3 AND 180
 THEN RAISE EXCEPTION 'Informe pedido, valor e justificativa' USING ERRCODE='22023'; END IF;

 -- Ordem de travas: contrato, depois cliente. Idêntica ao cancelamento.
 SELECT client_id,total,status INTO v_client,v_total,v_status
 FROM public.rental_contracts WHERE id=p_contract FOR UPDATE;
 IF v_client IS NULL OR v_status NOT IN ('confirmed','picked_up')
 THEN RAISE EXCEPTION 'Pedido não permite uso de crédito' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.clients WHERE id=v_client FOR UPDATE;

 SELECT * INTO v_existing FROM public.client_credit_entries
 WHERE operation_id=p_operation AND client_id=v_client;
 IF FOUND THEN
  IF v_existing.kind<>'redemption' OR v_existing.source_contract_id IS DISTINCT FROM p_contract
     OR v_existing.delta<>-p_amount THEN
    RAISE EXCEPTION 'Identificador de operação já usado em outra movimentação' USING ERRCODE='23505';
  END IF;
  RETURN jsonb_build_object('id',v_existing.id,'already_exists',true,'amount',p_amount);
 END IF;
 SELECT coalesce(sum(delta),0) INTO v_balance FROM public.client_credit_entries
 WHERE client_id=v_client;
 IF v_balance<p_amount THEN RAISE EXCEPTION 'Saldo insuficiente' USING ERRCODE='22023'; END IF;
 SELECT coalesce(sum(amount) FILTER(WHERE status<>'reversed'),0) INTO v_paid
 FROM public.rental_payments WHERE contract_id=p_contract;
 SELECT coalesce(-sum(delta),0) INTO v_applied FROM public.client_credit_entries
 WHERE source_contract_id=p_contract AND kind='redemption';
 IF v_paid+v_applied+p_amount>v_total THEN
  RAISE EXCEPTION 'Crédito excede o saldo a pagar deste contrato' USING ERRCODE='22023'; END IF;
 INSERT INTO public.client_credit_entries(
  client_id,delta,kind,source_contract_id,note,operation_id,created_by
 ) VALUES(v_client,-p_amount,'redemption',p_contract,btrim(p_reason),p_operation,v_actor)
 RETURNING id INTO v_entry_id;
 RETURN jsonb_build_object('id',v_entry_id,'amount',p_amount,'already_exists',false,
  'remaining',v_total-v_paid-v_applied-p_amount);
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.credit_redeem_for_contract(uuid,numeric,text,uuid)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.credit_redeem_for_contract(uuid,numeric,text,uuid)
 TO authenticated;
