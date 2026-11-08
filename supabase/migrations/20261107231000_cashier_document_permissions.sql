-- Operadores do caixa também consultam pedidos e recebem pagamentos,
-- portanto podem emitir/reimprimir a minuta. Não há UPDATE nem DELETE.
CREATE POLICY "Cashiers read issued rental documents"
ON public.rental_document_snapshots FOR SELECT TO authenticated
USING (public.has_role((select auth.uid()),'cashier'::public.app_role));
CREATE POLICY "Cashiers issue rental documents"
ON public.rental_document_snapshots FOR INSERT TO authenticated
WITH CHECK (
 issued_by=(select auth.uid())
 AND public.has_role((select auth.uid()),'cashier'::public.app_role)
);