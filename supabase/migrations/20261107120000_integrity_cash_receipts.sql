-- Guardas de integridade — Closet Festa (sem exclusões).
-- Não modificar dados históricos; endurecer apenas novas escritas.
-- Revisado para o projeto Supabase roqcwdlsuawrdbmnwbvv.
SET lock_timeout = '3s';
SET statement_timeout = '25s';

ALTER TABLE public.products
  ADD CONSTRAINT products_stock_nonnegative CHECK (stock_quantity >= 0) NOT VALID;
ALTER TABLE public.products VALIDATE CONSTRAINT products_stock_nonnegative;
ALTER TABLE public.products
  ADD CONSTRAINT products_price_nonnegative CHECK (price >= 0 AND (cost IS NULL OR cost >= 0)) NOT VALID;
ALTER TABLE public.products VALIDATE CONSTRAINT products_price_nonnegative;
ALTER TABLE public.products
  ADD CONSTRAINT products_deleted_must_be_inactive CHECK (deleted_at IS NULL OR active = false) NOT VALID;
ALTER TABLE public.products VALIDATE CONSTRAINT products_deleted_must_be_inactive;

-- Somente um retrato principal por traje.
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_one_primary
ON public.product_images(product_id)
WHERE is_primary = true;

-- Agendamento sempre pertence a cliente real; impedir exclusão de cliente
-- com agendamentos existentes. Registros históricos permanecem intactos.
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_valid_dates CHECK (end_at > start_at) NOT VALID;
ALTER TABLE public.appointments VALIDATE CONSTRAINT appointments_valid_dates;
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_client_required CHECK (client_id IS NOT NULL) NOT VALID;
ALTER TABLE public.appointments VALIDATE CONSTRAINT appointments_client_required;
ALTER TABLE public.appointments DROP CONSTRAINT appointments_client_id_fkey;
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_client_id_fkey
  FOREIGN KEY(client_id) REFERENCES public.clients(id) ON DELETE RESTRICT NOT VALID;
ALTER TABLE public.appointments VALIDATE CONSTRAINT appointments_client_id_fkey;

-- Proteção contra corridas de dois atendentes criando eventos para
-- o mesmo cliente na mesma janela (intervalos adjacentes são válidos).
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_no_overlapping_client
  EXCLUDE USING gist (
    client_id WITH =,
    tstzrange(start_at,end_at,'[)') WITH &&
  ) WHERE (status <> 'cancelled');

-- Preservar histórico de caixa quando um registro principal for alterado.
ALTER TABLE public.cash_movements DROP CONSTRAINT cash_movements_cash_register_id_fkey;
ALTER TABLE public.cash_movements
  ADD CONSTRAINT cash_movements_cash_register_id_fkey
  FOREIGN KEY(cash_register_id) REFERENCES public.cash_registers(id)
  ON DELETE RESTRICT NOT VALID;
ALTER TABLE public.cash_movements VALIDATE CONSTRAINT cash_movements_cash_register_id_fkey;

ALTER TABLE public.cash_registers
  ADD CONSTRAINT cash_registers_positive_values
  CHECK (
    opening_amount >= 0 AND
    (closing_amount IS NULL OR closing_amount >= 0) AND
    (expected_amount IS NULL OR expected_amount >= 0)
  ) NOT VALID;
ALTER TABLE public.cash_registers VALIDATE CONSTRAINT cash_registers_positive_values;
ALTER TABLE public.cash_registers
  ADD CONSTRAINT cash_registers_consistent_closed
  CHECK (
    status IN ('open','closed') AND
    (status='open' OR (
      closed_at IS NOT NULL AND closing_amount IS NOT NULL AND
      expected_amount IS NOT NULL AND difference IS NOT NULL AND
      difference=closing_amount-expected_amount
    ))
  ) NOT VALID;
ALTER TABLE public.cash_registers VALIDATE CONSTRAINT cash_registers_consistent_closed;

-- Ao registrar dinheiro recebido por contrato, deve existir um caixa
-- aberto para o operador. Pix/cartão NUNCA entra no saldo físico.
-- A trigger opera na mesma transação da inserção do pagamento.
CREATE OR REPLACE FUNCTION public.closet_register_cash_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
  v_cash_id uuid;
BEGIN
  IF NEW.method <> 'cash' OR NEW.status = 'reversed' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL OR auth.uid() <> NEW.recorded_by THEN
    RAISE EXCEPTION 'Operador não autenticado para recebimento em dinheiro'
      USING ERRCODE='42501';
  END IF;
  SELECT id INTO v_cash_id
  FROM public.cash_registers
  WHERE opened_by=NEW.recorded_by AND status='open'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Abra o caixa do operador antes de registrar recebimento em dinheiro'
      USING ERRCODE='22023';
  END IF;
  INSERT INTO public.cash_movements(
    cash_register_id,type,amount,description,reference_id,created_by
  ) VALUES (
    v_cash_id,'rental_cash_receipt',NEW.amount,
    'Recebimento de aluguel em dinheiro',NEW.id,NEW.recorded_by
  );
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.closet_register_cash_payment() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS trg_cash_rental_payment ON public.rental_payments;
CREATE TRIGGER trg_cash_rental_payment
AFTER INSERT ON public.rental_payments
FOR EACH ROW EXECUTE FUNCTION public.closet_register_cash_payment();

CREATE UNIQUE INDEX IF NOT EXISTS idx_cash_receipt_unique_payment
ON public.cash_movements(reference_id)
WHERE type='rental_cash_receipt';

ALTER TABLE public.cash_movements
  ADD CONSTRAINT cash_movements_valid_signed_amount
  CHECK (
    (type IN ('opening','closing') AND amount=0)
    OR (type='withdrawal' AND amount<0)
    OR (type IN ('reinforcement','rental_cash_receipt') AND amount>0)
  ) NOT VALID;
ALTER TABLE public.cash_movements VALIDATE CONSTRAINT cash_movements_valid_signed_amount;

ALTER TABLE public.financial_transactions
  ADD CONSTRAINT financial_transactions_amount_positive CHECK(amount>0) NOT VALID;
ALTER TABLE public.financial_transactions VALIDATE CONSTRAINT financial_transactions_amount_positive;

-- FKs já existentes em locações e pagamentos permanecem preservadas.
-- Evitar DELETE de lançamentos financeiros: registrar ajuste/estorno auditado.
