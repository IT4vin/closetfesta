-- Impede que a inserção direta de appointments por um operador se faça passar
-- por um compromisso confirmado de contrato. A alteração deve passar pela
-- função de agendamento que valida cliente, contrato, data e capacidade.
ALTER TABLE public.appointments
 ADD CONSTRAINT closet_manual_visits_unlinked
 CHECK (
  (source='manual' AND contract_id IS NULL) OR
  (source='contract' AND contract_id IS NOT NULL AND title IN ('Prova','Retirada'))
 );

CREATE OR REPLACE FUNCTION public.closet_guard_linked_appointment_write()
RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $function$
BEGIN
 IF (
   NEW.source='contract' OR
   (TG_OP='UPDATE' AND OLD.source='contract')
 ) AND current_user<>'postgres' THEN
   RAISE EXCEPTION 'Agendamentos vinculados a contratos só podem ser alterados pelo fluxo seguro da agenda'
    USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.closet_guard_linked_appointment_write()
 FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS trg_guard_linked_appointments ON public.appointments;
CREATE TRIGGER trg_guard_linked_appointments
 BEFORE INSERT OR UPDATE OF source,contract_id,start_at,end_at,status,client_id,title
 ON public.appointments
 FOR EACH ROW EXECUTE FUNCTION public.closet_guard_linked_appointment_write();
