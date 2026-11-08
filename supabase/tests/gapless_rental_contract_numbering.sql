-- Teste transacional e não destrutivo, para executar como proprietário do banco.
-- Usa um sub-bloco com rollback e nunca cria/edita contratos reais.
DO $test$
DECLARE
  v_before bigint;
  v_allocated bigint;
  v_after bigint;
BEGIN
  SELECT last_number INTO v_before
  FROM public.rental_contract_number_counter WHERE id=1 FOR UPDATE;
  IF v_before IS NULL THEN
    RAISE EXCEPTION 'Contador de contratos ausente';
  END IF;
  BEGIN
    UPDATE public.rental_contract_number_counter
       SET last_number=last_number+1, updated_at=now()
     WHERE id=1 RETURNING last_number INTO v_allocated;
    IF v_allocated<>v_before+1 THEN
      RAISE EXCEPTION 'Falha ao alocar o próximo número';
    END IF;
    -- Força falha posterior, reproduzindo rollback por conflito de datas/pagamento.
    RAISE EXCEPTION 'ROLLBACK_NUMBERING_TEST';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM<>'ROLLBACK_NUMBERING_TEST' THEN RAISE; END IF;
  END;
  SELECT last_number INTO v_after
  FROM public.rental_contract_number_counter WHERE id=1;
  IF v_after IS DISTINCT FROM v_before THEN
    RAISE EXCEPTION 'Falha: tentativa abortada consumiu número (% -> %)',v_before,v_after;
  END IF;
  RAISE NOTICE 'OK: rollback não consumiu número, contador permanece em %',v_after;
END;
$test$;

-- Verificações sem alteração de dados
SELECT c.last_number,
  (SELECT max(contract_number) FROM public.rental_contracts) AS max_contract_number,
  (SELECT count(*) FROM public.rental_contracts) AS contracts_saved,
  (SELECT is_identity FROM information_schema.columns
   WHERE table_schema='public' AND table_name='rental_contracts'
     AND column_name='contract_number') AS still_using_identity
FROM public.rental_contract_number_counter c WHERE c.id=1;
