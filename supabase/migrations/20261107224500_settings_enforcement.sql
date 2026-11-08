-- Closet Festa: aplicar regras cadastradas nas operações do banco.
-- Sem alterar nenhum contrato, recebimento ou agendamento antigo.
SET lock_timeout = '5s';
SET statement_timeout = '30s';

CREATE OR REPLACE FUNCTION public.closet_validate_appointment_settings()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
  cfg jsonb := '{}'::jsonb;
  max_in_slot integer := 0;
  min_notice integer := 0;
  wait_minutes integer := 0;
  occupied_count integer := 0;
  local_date text;
  value_txt text;
BEGIN
  IF NEW.status = 'cancelled' THEN RETURN NEW; END IF;
  SELECT s.value INTO cfg FROM public.settings s
   WHERE s.key='closet_festa.config.v1.operations';
  cfg := COALESCE(cfg,'{}'::jsonb);
  local_date := to_char(NEW.start_at AT TIME ZONE 'America/Sao_Paulo','YYYY-MM-DD');

  IF EXISTS(
    SELECT 1 FROM unnest(string_to_array(COALESCE(cfg->>'blocked_dates',''), ',')) day_value
      WHERE btrim(day_value)=local_date
  ) THEN
    RAISE EXCEPTION 'Data bloqueada nas configurações de agendamento' USING ERRCODE='22023';
  END IF;

  value_txt := cfg->>'min_notice_hours';
  IF value_txt ~ '^[0-9]+$' THEN min_notice := LEAST(8760, value_txt::integer); END IF;
  IF min_notice>0 AND (TG_OP='INSERT' OR (TG_OP='UPDATE' AND NEW.start_at IS DISTINCT FROM OLD.start_at))
    AND NEW.start_at < now() + min_notice * interval '1 hour'
  THEN
    RAISE EXCEPTION 'Antecedência mínima de agendamento não respeitada' USING ERRCODE='22023';
  END IF;

  value_txt := cfg->>'max_per_slot';
  IF value_txt ~ '^[0-9]+$' THEN max_in_slot := LEAST(100, value_txt::integer); END IF;
  value_txt := cfg->>'interval_minutes';
  IF value_txt ~ '^[0-9]+$' THEN wait_minutes := LEAST(240, value_txt::integer); END IF;
  IF max_in_slot>0 THEN
    -- Lock transacional impede ultrapassar capacidade em gravações simultâneas.
    PERFORM pg_advisory_xact_lock(72771505);
    SELECT count(*) INTO occupied_count FROM public.appointments existing
    WHERE existing.id IS DISTINCT FROM NEW.id
      AND existing.status <> 'cancelled'
      AND existing.start_at < NEW.end_at + wait_minutes * interval '1 minute'
      AND existing.end_at + wait_minutes * interval '1 minute' > NEW.start_at;
    IF occupied_count >= max_in_slot THEN
      RAISE EXCEPTION 'Limite configurado de atendimentos simultâneos atingido' USING ERRCODE='22023';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.closet_validate_appointment_settings() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_closet_appointment_settings ON public.appointments;
CREATE TRIGGER trg_closet_appointment_settings
 BEFORE INSERT OR UPDATE OF start_at,end_at,status ON public.appointments
 FOR EACH ROW EXECUTE FUNCTION public.closet_validate_appointment_settings();

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

 IF NEW.method NOT IN ('pix','cash','credit','debit') THEN
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
REVOKE ALL ON FUNCTION public.closet_validate_payment_settings() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_closet_payment_settings ON public.rental_payments;
CREATE TRIGGER trg_closet_payment_settings
 BEFORE INSERT OR UPDATE OF method,amount,installments ON public.rental_payments
 FOR EACH ROW EXECUTE FUNCTION public.closet_validate_payment_settings();
