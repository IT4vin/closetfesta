-- Campos adicionais compartilhados entre os cadastros Clientes e PDV.
-- Manter os dados antigos; nenhum preenchimento obrigatório retroativo.
ALTER TABLE public.clients
 ADD COLUMN IF NOT EXISTS secondary_phone text,
 ADD COLUMN IF NOT EXISTS measurements jsonb NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.clients.secondary_phone IS 'Telefone alternativo opcional do cliente';
COMMENT ON COLUMN public.clients.measurements IS 'Medidas opcionais em cm para provas de trajes';
