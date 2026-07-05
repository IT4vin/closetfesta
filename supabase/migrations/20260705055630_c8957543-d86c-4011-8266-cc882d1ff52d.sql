
-- RLS no bucket product-images (privado)
CREATE POLICY "Auth users read product images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Auth users upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Auth users update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Auth users delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images');

-- Seed inicial de categorias
INSERT INTO public.product_categories (name, description)
SELECT name, description FROM (VALUES
  ('Vestidos', 'Vestidos de festa, casamento e eventos'),
  ('Ternos', 'Ternos e blazers masculinos'),
  ('Acessórios', 'Gravatas, cintos, bolsas e outros acessórios'),
  ('Calçados', 'Sapatos sociais e de festa'),
  ('Trajes Infantis', 'Roupas de festa para crianças')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM public.product_categories WHERE product_categories.name = v.name);
