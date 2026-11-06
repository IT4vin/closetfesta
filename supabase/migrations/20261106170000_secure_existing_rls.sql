-- Etapa de preparação: restringir RLS. Revisar em homologação antes de aplicar.
-- Necessário: migrations originais, usuários e papéis configurados.
-- Este SQL não foi executado em um banco remoto durante a preparação.

-- Produtos: somente responsáveis de gestão podem alterar o catálogo.
DROP POLICY IF EXISTS "Auth insert products" ON public.products;
DROP POLICY IF EXISTS "Auth update products" ON public.products;
CREATE POLICY "Managers insert products v2" ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers update products v2" ON public.products FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Imagens: o upload é limitado aos perfis com permissão de manutenção de produtos.
DROP POLICY IF EXISTS "Auth write images" ON public.product_images;
CREATE POLICY "Managers write product images v2" ON public.product_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
DROP POLICY IF EXISTS "Auth users upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Auth users update product images" ON storage.objects;
DROP POLICY IF EXISTS "Auth users delete product images" ON storage.objects;
CREATE POLICY "Managers upload product images v2" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')));
CREATE POLICY "Managers update product images v2" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')))
  WITH CHECK (bucket_id = 'product-images' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')));
CREATE POLICY "Managers remove product images v2" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')));

-- Agenda: atendentes podem marcar provas e retiradas, mas caixa só consulta.
DROP POLICY IF EXISTS "Auth write appointments" ON public.appointments;
CREATE POLICY "Staff write appointments v2" ON public.appointments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'staff'));

-- Caixa: caixas são operados somente por responsáveis autorizados.
DROP POLICY IF EXISTS "Auth write cash" ON public.cash_registers;
DROP POLICY IF EXISTS "Auth write movements" ON public.cash_movements;
CREATE POLICY "Cashier insert cash registers v2" ON public.cash_registers FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'cashier')) AND opened_by = auth.uid());
CREATE POLICY "Cashier update cash registers v2" ON public.cash_registers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'cashier'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'cashier'));
CREATE POLICY "Cashier insert movements v2" ON public.cash_movements FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'cashier')) AND created_by = auth.uid());

-- Registros históricos não são apagados nem alterados diretamente no cliente.
DROP POLICY IF EXISTS "Auth write sales" ON public.sales;
DROP POLICY IF EXISTS "Auth write sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Auth write payments" ON public.sale_payments;
DROP POLICY IF EXISTS "Auth write inventory" ON public.inventory_movements;
DROP POLICY IF EXISTS "Auth write finance" ON public.financial_transactions;

CREATE POLICY "Cashier insert sales v2" ON public.sales FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'cashier'));
CREATE POLICY "Managers update sales v2" ON public.sales FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Cashier insert sale items v2" ON public.sale_items FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'cashier'));
CREATE POLICY "Cashier insert payments v2" ON public.sale_payments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'cashier'));
CREATE POLICY "Managers record inventory v2" ON public.inventory_movements FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Cashier insert financial transactions v2" ON public.financial_transactions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'cashier'));
CREATE POLICY "Managers update financial transactions v2" ON public.financial_transactions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
