-- Compatibilidade com recebimentos via transferência, existente no financeiro.
CREATE OR REPLACE FUNCTION public.closet_validate_payment_settings()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
 cfg jsonb := '{}'::jsonb;
 max_global integer := 12;
 max_allowed integer := 12;
 min_installment numeric := 0;
 value_txt text;
 limit_txt text;
 installments_txt text;
 tier integer;
 matched_tier boolean := false;
BEGIN
 SELECT s.value INTO cfg FROM public.settings s
 WHERE s.key='closet_festa.config.v1.payments';
 cfg := COALESCE(cfg,'{}'::jsonb);

 IF NEW.method NOT IN ('pix','cash','credit','debit','transfer') THEN
   RAISE EXCEPTION 'Forma de pagamento não habilitada para locações' USING ERRCODE='22023';
 END IF;
 IF cfg->>(NEW.method || '_enabled')='false' THEN
   RAISE EXCEPTION 'Forma de pagamento desativada nas configurações da loja' USING ERRCODE='22023';
 END IF;

 IF NEW.method<>'credit' AND NEW.installments IS DISTINCT FROM 1 THEN
   RAISE EXCEPTION 'Parcelamento permitido apenas para cartão de crédito' USING ERRCODE='22023';
 END IF;
 IF NEW.method='credit' THEN
   value_txt := cfg->>'max_installments';
   IF value_txt ~ '^[0-9]+$' THEN max_global := GREATEST(1,LEAST(24,value_txt::integer)); END IF;
   max_allowed := max_global;
   FOR tier IN 1..4 LOOP
     limit_txt := cfg->>('tier_'||tier||'_max');
     installments_txt := cfg->>('tier_'||tier||'_installments');
     IF limit_txt ~ '^[0-9]+([.][0-9]+)?$'
       AND installments_txt ~ '^[0-9]+$' AND NEW.amount <= limit_txt::numeric THEN
       max_allowed := LEAST(max_global,GREATEST(1,installments_txt::integer));
       matched_tier := true;
       EXIT;
     END IF;
   END LOOP;
   IF NOT matched_tier THEN
     installments_txt := cfg->>'tier_5_installments';
     IF installments_txt ~ '^[0-9]+$' THEN
       max_allowed := LEAST(max_global,GREATEST(1,installments_txt::integer));
     END IF;
   END IF;
   IF NEW.installments IS NULL OR NEW.installments<1 OR NEW.installments>max_allowed THEN
     RAISE EXCEPTION 'Número de parcelas excede as configurações da loja' USING ERRCODE='22023';
   END IF;
   value_txt := cfg->>'minimum_installment';
   IF value_txt ~ '^[0-9]+([.][0-9]+)?$' THEN min_installment := value_txt::numeric; END IF;
   IF NEW.amount/NEW.installments < min_installment - 0.005 THEN
     RAISE EXCEPTION 'Parcela menor que o valor mínimo configurado' USING ERRCODE='22023';
   END IF;
 END IF;
 RETURN NEW;
END;
$$;
