-- Criar crédito no próprio cancelamento, atomicamente com o status,
-- respeitando estornos anteriores e créditos já aplicados ao contrato.
-- Não altera contratos anteriores e não executa nenhuma restituição externa.
CREATE OR REPLACE FUNCTION public.rental_order_edit(p_contract_id uuid, p_action text, p_data jsonb, p_reason text, p_request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
 v_actor uuid := auth.uid();
 v_manager boolean;
 v_contract public.rental_contracts%ROWTYPE;
 v_item public.rental_items%ROWTYPE;
 v_pay public.rental_payments%ROWTYPE;
 v_product public.products%ROWTYPE;
 v_unit_id uuid;
 v_client_id uuid;
 v_client_before jsonb;
 v_item_id uuid;
 v_product_id uuid;
 v_paid numeric(12,2);
 v_before jsonb := '{}'::jsonb;
 v_after jsonb := '{}'::jsonb;
 v_global_discount numeric(12,2);
 v_subtotal numeric(12,2);
 v_item_discount numeric(12,2);
 v_new_order_discount numeric(12,2);
 v_total numeric(12,2);
 v_price numeric(12,2);
 v_value numeric(12,2);
 v_pickup date;
 v_event date;
 v_return date;
 v_tryon date;
 v_cash_id uuid;
 v_has_cash_move boolean;
 v_existing uuid;
BEGIN
 IF v_actor IS NULL OR NOT (
   public.has_role(v_actor,'admin') OR public.has_role(v_actor,'manager') OR
   public.has_role(v_actor,'staff')
 ) THEN
   RAISE EXCEPTION 'Sem permissão para editar pedidos' USING ERRCODE='42501';
 END IF;
 v_manager := public.has_role(v_actor,'admin') OR public.has_role(v_actor,'manager');
 IF p_contract_id IS NULL OR p_request_id IS NULL OR
    p_action NOT IN ('client','client_reassign','notes','item_dates','add_item','replace_item',
      'remove_item','item_discount','item_price','order_discount','reverse_payment','cancel_contract')
    OR p_data IS NULL OR jsonb_typeof(p_data)<>'object'
    OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 3 AND 500 THEN
   RAISE EXCEPTION 'Operação, dados ou justificativa inválidos' USING ERRCODE='22023';
 END IF;
 IF NOT v_manager AND p_action NOT IN ('client','notes','item_dates') THEN
   RAISE EXCEPTION 'Esta operação exige gerente ou administrador' USING ERRCODE='42501';
 END IF;

 -- Lock serializa alterações de valores, itens e pagamentos deste contrato.
 SELECT * INTO v_contract FROM public.rental_contracts WHERE id=p_contract_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Pedido não encontrado' USING ERRCODE='P0002'; END IF;
 SELECT id INTO v_existing FROM public.rental_order_audit WHERE request_id=p_request_id;
 IF FOUND THEN
   IF NOT EXISTS (SELECT 1 FROM public.rental_order_audit a WHERE a.id=v_existing
       AND a.contract_id=p_contract_id AND a.actor_id=v_actor AND a.action=p_action) THEN
     RAISE EXCEPTION 'Identificador de alteração já usado' USING ERRCODE='42501';
   END IF;
   RETURN jsonb_build_object('id',v_existing,'already_exists',true);
 END IF;
 IF v_contract.status='cancelled' THEN
   RAISE EXCEPTION 'Pedido cancelado não permite alterações' USING ERRCODE='22023';
 END IF;
 IF v_contract.status='completed' AND p_action NOT IN ('client','notes') THEN
   RAISE EXCEPTION 'Pedido concluído: alteração requer fluxo de retificação' USING ERRCODE='22023';
 END IF;

 v_before := jsonb_build_object('contract',to_jsonb(v_contract),'payload',p_data);
 SELECT coalesce(sum(amount) FILTER (WHERE status<>'reversed'),0)
   INTO v_paid FROM public.rental_payments WHERE contract_id=p_contract_id;
 -- Crédito já aplicado também constitui valor comprometido no contrato.
 -- Conta no controle de descontos e volta à carteira se o contrato for cancelado.
 SELECT v_paid+coalesce(-sum(delta),0) INTO v_paid
 FROM public.client_credit_entries
 WHERE source_contract_id=p_contract_id AND kind='redemption';
 SELECT coalesce(sum(discount),0) INTO v_item_discount
   FROM public.rental_items WHERE contract_id=p_contract_id AND status<>'cancelled';
 v_global_discount := greatest(0,v_contract.total_discount-v_item_discount);
 v_new_order_discount := v_global_discount;

 IF p_action='client' THEN
   v_client_id:=v_contract.client_id;
   SELECT to_jsonb(c) INTO v_client_before FROM public.clients c WHERE c.id=v_client_id FOR UPDATE;
   v_before:=v_before||jsonb_build_object('client',v_client_before);
   IF (p_data ? 'full_name') AND length(btrim(coalesce(p_data->>'full_name',''))) < 2 THEN
     RAISE EXCEPTION 'Nome completo obrigatório' USING ERRCODE='22023'; END IF;
   IF length(coalesce(p_data->>'full_name',''))>180 OR length(coalesce(p_data->>'phone',''))>40
      OR length(coalesce(p_data->>'email',''))>255 OR length(coalesce(p_data->>'document',''))>40
      OR length(coalesce(p_data->>'notes',''))>2000 THEN
     RAISE EXCEPTION 'Informação de cliente muito longa' USING ERRCODE='22023'; END IF;
   UPDATE public.clients SET
     full_name=CASE WHEN p_data ? 'full_name' THEN btrim(p_data->>'full_name') ELSE full_name END,
     phone=CASE WHEN p_data ? 'phone' THEN nullif(btrim(p_data->>'phone'),'') ELSE phone END,
     email=CASE WHEN p_data ? 'email' THEN nullif(btrim(p_data->>'email'),'') ELSE email END,
     document=CASE WHEN p_data ? 'document' THEN nullif(btrim(p_data->>'document'),'') ELSE document END,
     notes=CASE WHEN p_data ? 'notes' THEN nullif(btrim(p_data->>'notes'),'') ELSE notes END,
     address=CASE WHEN p_data ? 'address' THEN p_data->'address' ELSE address END,
     updated_at=now()
   WHERE id=v_client_id;
   v_after := jsonb_build_object('client_id',v_client_id,'fields_changed',p_data);

 ELSIF p_action='client_reassign' THEN
   IF EXISTS(
     SELECT 1 FROM public.client_credit_entries
     WHERE source_contract_id=p_contract_id AND kind='redemption'
   ) THEN
     RAISE EXCEPTION 'Contrato com crédito aplicado não pode trocar de titular; reverta o uso de crédito antes da troca'
       USING ERRCODE='22023';
   END IF;
   v_client_id:=nullif(p_data->>'client_id','')::uuid;
   IF v_client_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.clients WHERE id=v_client_id) THEN
     RAISE EXCEPTION 'Selecione um cliente cadastrado' USING ERRCODE='22023'; END IF;
   UPDATE public.rental_contracts SET client_id=v_client_id,updated_at=now() WHERE id=p_contract_id;
   v_after:=jsonb_build_object('old_client',v_contract.client_id,'new_client',v_client_id);

 ELSIF p_action='notes' THEN
   IF length(coalesce(p_data->>'notes',''))>3000 THEN
     RAISE EXCEPTION 'Limite de 3.000 caracteres nas observações' USING ERRCODE='22023'; END IF;
   UPDATE public.rental_contracts SET notes=nullif(btrim(p_data->>'notes'),''),updated_at=now()
   WHERE id=p_contract_id;
   v_after:=jsonb_build_object('notes',p_data->>'notes');

 ELSIF p_action IN ('item_dates','replace_item','remove_item','item_discount','item_price') THEN
   v_item_id:=nullif(p_data->>'item_id','')::uuid;
   SELECT * INTO v_item FROM public.rental_items
    WHERE id=v_item_id AND contract_id=p_contract_id FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Item não pertence ao pedido' USING ERRCODE='P0002'; END IF;
   IF v_item.status<>'confirmed' THEN
     RAISE EXCEPTION 'Somente traje ainda não retirado pode ser editado' USING ERRCODE='22023'; END IF;
   v_before:=v_before||jsonb_build_object('item',to_jsonb(v_item));

   IF p_action='item_dates' THEN
     v_tryon:=nullif(p_data->>'try_on_date','')::date;
     v_pickup:=nullif(p_data->>'pickup_date','')::date;
     v_event:=nullif(p_data->>'event_date','')::date;
     v_return:=nullif(p_data->>'return_date','')::date;
     IF v_pickup IS NULL OR v_event IS NULL OR v_return IS NULL OR
        v_pickup>v_event OR v_event>v_return OR
        (v_tryon IS NOT NULL AND v_tryon>=v_pickup) THEN
       RAISE EXCEPTION 'Datas inválidas: prova anterior à retirada, evento entre retirada e devolução'
         USING ERRCODE='22023'; END IF;
     -- A exclusion constraint no_double_booking_per_unit protege reservas concorrentes.
     UPDATE public.rental_items SET try_on_date=v_tryon,pickup_date=v_pickup,
       event_date=v_event,return_date=v_return WHERE id=v_item_id;
     v_after:=jsonb_build_object('item_id',v_item_id,'try_on_date',v_tryon,
       'pickup_date',v_pickup,'event_date',v_event,'return_date',v_return);

   ELSIF p_action='replace_item' THEN
     v_product_id:=nullif(p_data->>'product_id','')::uuid;
     SELECT * INTO v_product FROM public.products
       WHERE id=v_product_id AND active AND deleted_at IS NULL;
     IF NOT FOUND OR v_product_id=v_item.product_id THEN
       RAISE EXCEPTION 'Escolha outro traje ativo' USING ERRCODE='22023'; END IF;
     PERFORM pg_advisory_xact_lock(hashtextextended(v_product_id::text,0));
     SELECT u.id INTO v_unit_id FROM public.product_units u
       WHERE u.product_id=v_product_id AND u.status='available'
         AND NOT EXISTS(SELECT 1 FROM public.rental_items ri WHERE ri.unit_id=u.id
           AND ri.status IN ('confirmed','picked_up')
           AND daterange(ri.pickup_date,ri.return_date,'[]') &&
             daterange(v_item.pickup_date,v_item.return_date,'[]'))
       ORDER BY u.unit_number FOR UPDATE OF u LIMIT 1;
     IF v_unit_id IS NULL THEN RAISE EXCEPTION 'Novo traje indisponível para essas datas' USING ERRCODE='23P01'; END IF;
     v_price:=round(coalesce(nullif(v_product.metadata->>'rental_price','')::numeric,v_product.price),2);
     IF v_price<0 THEN RAISE EXCEPTION 'Preço de traje inválido'; END IF;
     UPDATE public.rental_items SET product_id=v_product_id,unit_id=v_unit_id,
       unit_price=v_price,discount=0 WHERE id=v_item_id;
     v_after:=jsonb_build_object('item_id',v_item_id,'product_id',v_product_id,'unit_id',v_unit_id,'price',v_price);

   ELSIF p_action='remove_item' THEN
     IF (SELECT count(*) FROM public.rental_items WHERE contract_id=p_contract_id
        AND status<>'cancelled')<=1 THEN
       RAISE EXCEPTION 'Pedido deve manter ao menos um traje; para cancelar use Cancelar pedido'
         USING ERRCODE='22023'; END IF;
     UPDATE public.rental_items SET status='cancelled' WHERE id=v_item_id;
     v_after:=jsonb_build_object('item_id',v_item_id,'status','cancelled');

   ELSIF p_action='item_discount' THEN
     v_value:=round(nullif(p_data->>'amount','')::numeric,2);
     IF v_value IS NULL OR v_value<0 OR v_value>v_item.unit_price THEN
       RAISE EXCEPTION 'Desconto não pode superar o valor do traje' USING ERRCODE='22023'; END IF;
     UPDATE public.rental_items SET discount=v_value WHERE id=v_item_id;
     v_after:=jsonb_build_object('item_id',v_item_id,'discount',v_value);

   ELSIF p_action='item_price' THEN
     v_value:=round(nullif(p_data->>'amount','')::numeric,2);
     IF v_value IS NULL OR v_value<0 OR v_value>1000000 OR v_item.discount>v_value THEN
       RAISE EXCEPTION 'Preço deve ser válido e maior ou igual ao desconto do item' USING ERRCODE='22023'; END IF;
     UPDATE public.rental_items SET unit_price=v_value WHERE id=v_item_id;
     v_after:=jsonb_build_object('item_id',v_item_id,'unit_price',v_value);
   END IF;

 ELSIF p_action='add_item' THEN
   v_product_id:=nullif(p_data->>'product_id','')::uuid;
   SELECT * INTO v_product FROM public.products
      WHERE id=v_product_id AND active AND deleted_at IS NULL;
   IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado ou inativo' USING ERRCODE='22023'; END IF;
   v_tryon:=nullif(p_data->>'try_on_date','')::date;
   v_pickup:=nullif(p_data->>'pickup_date','')::date;
   v_event:=nullif(p_data->>'event_date','')::date;
   v_return:=nullif(p_data->>'return_date','')::date;
   IF v_pickup IS NULL OR v_event IS NULL OR v_return IS NULL OR
      v_pickup>v_event OR v_event>v_return OR
      (v_tryon IS NOT NULL AND v_tryon>=v_pickup) THEN
     RAISE EXCEPTION 'Informe datas válidas para adicionar o traje' USING ERRCODE='22023'; END IF;
   PERFORM pg_advisory_xact_lock(hashtextextended(v_product_id::text,0));
   SELECT u.id INTO v_unit_id FROM public.product_units u
     WHERE u.product_id=v_product_id AND u.status='available'
       AND NOT EXISTS(SELECT 1 FROM public.rental_items ri WHERE ri.unit_id=u.id
         AND ri.status IN ('confirmed','picked_up')
         AND daterange(ri.pickup_date,ri.return_date,'[]') && daterange(v_pickup,v_return,'[]'))
     ORDER BY u.unit_number FOR UPDATE OF u LIMIT 1;
   IF v_unit_id IS NULL THEN RAISE EXCEPTION 'Traje sem exemplar livre nessas datas' USING ERRCODE='23P01'; END IF;
   v_price:=round(coalesce(nullif(v_product.metadata->>'rental_price','')::numeric,v_product.price),2);
   INSERT INTO public.rental_items(contract_id,product_id,unit_id,unit_price,discount,
     try_on_date,pickup_date,event_date,return_date)
   VALUES(p_contract_id,v_product_id,v_unit_id,v_price,0,v_tryon,v_pickup,v_event,v_return)
   RETURNING id INTO v_item_id;
   v_after:=jsonb_build_object('item_id',v_item_id,'product_id',v_product_id,'price',v_price);

 ELSIF p_action='order_discount' THEN
   v_new_order_discount:=round(nullif(p_data->>'amount','')::numeric,2);
   IF v_new_order_discount IS NULL OR v_new_order_discount<0 OR v_new_order_discount>1000000 THEN
     RAISE EXCEPTION 'Desconto geral inválido' USING ERRCODE='22023'; END IF;
   v_after:=jsonb_build_object('general_discount',v_new_order_discount);

 ELSIF p_action='reverse_payment' THEN
   v_item_id:=nullif(p_data->>'payment_id','')::uuid;
   SELECT * INTO v_pay FROM public.rental_payments
     WHERE id=v_item_id AND contract_id=p_contract_id FOR UPDATE;
   IF NOT FOUND OR v_pay.status='reversed' THEN
     RAISE EXCEPTION 'Pagamento inexistente ou já estornado' USING ERRCODE='22023'; END IF;
   IF v_pay.status='reconciled' THEN
     RAISE EXCEPTION 'Pagamento conciliado: utilize o procedimento formal de estorno bancário'
       USING ERRCODE='22023'; END IF;
   v_before:=v_before||jsonb_build_object('payment',to_jsonb(v_pay));
   IF v_pay.method='cash' THEN
     SELECT cash_register_id INTO v_cash_id FROM public.cash_movements
       WHERE type='rental_cash_receipt' AND reference_id=v_pay.id;
     IF v_cash_id IS NULL THEN RAISE EXCEPTION 'Recebimento em dinheiro sem movimento de caixa'; END IF;
     PERFORM 1 FROM public.cash_registers WHERE id=v_cash_id AND status='open' FOR UPDATE;
     IF NOT FOUND THEN
       RAISE EXCEPTION 'Caixa do recebimento já foi fechado; solicite estorno financeiro supervisionado'
         USING ERRCODE='22023'; END IF;
     INSERT INTO public.cash_movements(cash_register_id,type,amount,description,reference_id,created_by)
       VALUES(v_cash_id,'rental_cash_refund',-v_pay.amount,
         'Devolução em espécie (confirmada pelo operador): '||btrim(p_reason),v_pay.id,v_actor);
   END IF;
   UPDATE public.rental_payments SET status='reversed' WHERE id=v_pay.id;
   v_after:=jsonb_build_object('payment_id',v_pay.id,'status','reversed',
     'requires_external_refund',v_pay.method<>'cash');

 ELSIF p_action='cancel_contract' THEN
   IF EXISTS(SELECT 1 FROM public.rental_items WHERE contract_id=p_contract_id
       AND status IN ('picked_up','returned')) THEN
     RAISE EXCEPTION 'Contrato com traje entregue ou devolvido exige revisão gerencial fora deste fluxo'
       USING ERRCODE='22023'; END IF;
   -- A aceitação de crédito deve ser confirmada expressamente, não pode
   -- substituir restituição legalmente devida ou um estorno externo obrigatório.
   IF v_paid>0 AND (p_data->>'credit_authorized') IS DISTINCT FROM 'true' THEN
     RAISE EXCEPTION 'Confirme a destinação dos valores pagos para crédito na loja, conforme autorização do cliente'
       USING ERRCODE='22023';
   END IF;
   IF v_paid>0 THEN
     IF v_paid>v_contract.total THEN
       RAISE EXCEPTION 'Recebimento maior que o total: regularize a diferença antes de cancelar'
         USING ERRCODE='22023'; END IF;
     -- Serializa com transferências e resgates de créditos.
     PERFORM 1 FROM public.clients WHERE id=v_contract.client_id FOR UPDATE;
     IF EXISTS(SELECT 1 FROM public.client_credit_entries
       WHERE source_contract_id=p_contract_id AND kind='cancellation_credit') THEN
       RAISE EXCEPTION 'Este contrato já possui crédito de cancelamento; solicite revisão'
         USING ERRCODE='23505'; END IF;
     INSERT INTO public.client_credit_entries
       (client_id,delta,kind,source_contract_id,note,operation_id,created_by)
     VALUES(v_contract.client_id,v_paid,'cancellation_credit',p_contract_id,
       left('Crédito por cancelamento do pedido '||v_contract.contract_number::
         text||': '||btrim(p_reason),500),p_request_id,v_actor);
   END IF;
   UPDATE public.rental_items SET status='cancelled'
     WHERE contract_id=p_contract_id AND status='confirmed';
   UPDATE public.rental_contracts SET status='cancelled',updated_at=now() WHERE id=p_contract_id;
   v_after:=jsonb_build_object('status','cancelled',
     'credit_generated',v_paid,'credit_client_id',v_contract.client_id);
 END IF;

 IF p_action IN ('item_dates','add_item','replace_item','remove_item',
     'item_discount','item_price','order_discount') THEN
   SELECT coalesce(sum(unit_price),0),coalesce(sum(discount),0)
     INTO v_subtotal,v_item_discount FROM public.rental_items
     WHERE contract_id=p_contract_id AND status<>'cancelled';
   IF v_new_order_discount+v_item_discount>v_subtotal THEN
     RAISE EXCEPTION 'Descontos maiores que o valor dos trajes' USING ERRCODE='22023'; END IF;
   v_total:=v_subtotal-v_new_order_discount-v_item_discount;
   IF v_total<v_paid THEN
     RAISE EXCEPTION 'Total editado menor que o já recebido: regularize pagamentos antes de salvar'
       USING ERRCODE='22023'; END IF;
   UPDATE public.rental_contracts SET subtotal=v_subtotal,
     total_discount=v_item_discount+v_new_order_discount,total=v_total,updated_at=now()
     WHERE id=p_contract_id;
   v_after:=v_after||jsonb_build_object('subtotal',v_subtotal,
     'total_discount',v_item_discount+v_new_order_discount,'total',v_total);
 END IF;

 INSERT INTO public.rental_order_audit(request_id,contract_id,actor_id,action,reason,before_data,after_data)
 VALUES (p_request_id,p_contract_id,v_actor,p_action,btrim(p_reason),v_before,v_after)
 RETURNING id INTO v_existing;
 RETURN jsonb_build_object('id',v_existing,'already_exists',false,
    'action',p_action,'result',v_after);
END;
$function$;
