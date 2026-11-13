-- Visibilidade do catálogo público: controlada pelo administrador, sem alterar estoque ou pedidos.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS show_in_catalog boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN public.products.show_in_catalog IS
  'Quando false, omite o produto da API de vitrine pública. Não altera estoque, pedidos ou disponibilidade interna.';
CREATE INDEX IF NOT EXISTS products_public_catalog_visible_idx
  ON public.products (created_at DESC, id)
  WHERE show_in_catalog = true AND active = true AND deleted_at IS NULL;
