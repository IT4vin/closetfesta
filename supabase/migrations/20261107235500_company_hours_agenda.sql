-- Reutiliza a trigger instalada e aplica horários cadastrados da loja.\nCREATE OR REPLACE FUNCTION public.closet_validate_appointment_settings()
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
  shop jsonb := '{}'::jsonb;
  local_start timestamp;
  local_end timestamp;
  start_limit text;
  end_limit text;
  shop_open text;
  shop_close text;
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
  -- Horários personalizados só se aplicam quando cadastrados.
  SELECT value INTO shop FROM public.settings
    WHERE key='closet_festa.config.v1.company';
  shop := COALESCE(shop,'{}'::jsonb);
  local_start := NEW.start_at AT TIME ZONE 'America/Sao_Paulo';
  local_end := NEW.end_at AT TIME ZONE 'America/Sao_Paulo';
  shop_open := shop->>'store_open';
  shop_close := shop->>'store_close';
  IF shop_open ~ '^([01][0-9]|2[0-3]):[0-5][0-9]
$$;
 AND local_start::time < shop_open::time THEN
    RAISE EXCEPTION 'Início anterior à abertura da loja' USING ERRCODE='22023';
  END IF;
  IF shop_close ~ '^([01][0-9]|2[0-3]):[0-5][0-9]
$$;
 AND local_end::time > shop_close::time THEN
    RAISE EXCEPTION 'Término posterior ao fechamento da loja' USING ERRCODE='22023';
  END IF;
  IF NEW.title='Prova' THEN
    start_limit:=shop->>'fitting_open';
    end_limit:=shop->>'fitting_close';
  ELSIF NEW.title='Retirada' THEN
    start_limit:=shop->>'sewing_open';
    end_limit:=shop->>'pickup_close';
    IF end_limit IS NULL OR end_limit='' THEN end_limit:=shop->>'sewing_close'; END IF;
  ELSIF NEW.title='Devolução' THEN
    end_limit:=shop->>'return_close';
  END IF;
  IF start_limit ~ '^([01][0-9]|2[0-3]):[0-5][0-9]
$$;
 AND local_start::time < start_limit::time THEN
    RAISE EXCEPTION 'Horário inicial não permitido para este atendimento' USING ERRCODE='22023';
  END IF;
  IF end_limit ~ '^([01][0-9]|2[0-3]):[0-5][0-9]
$$;
 AND local_end::time > end_limit::time THEN
    RAISE EXCEPTION 'Horário de término não permitido para este atendimento' USING ERRCODE='22023';
  END IF;
  RETURN NEW;
END;
$$;
