-- Somente leitura. Executar após confirmar o project_ref via API autorizada.
-- NÃO executa DDL, não consulta clientes, não altera dados.
-- Retorna a existência das estruturas esperadas, RLS e políticas por tabela.
WITH expected (table_name, phase) AS (
  VALUES
    ('products','base'),('product_images','base'),('product_categories','base'),
    ('clients','base'),('profiles','base'),('user_roles','base'),
    ('sales','base'),('sale_items','base'),('sale_payments','base'),
    ('cash_registers','base'),('cash_movements','base'),
    ('product_units','rental'),('rental_contracts','rental'),
    ('rental_items','rental'),('rental_payments','rental'),
    ('rental_item_events','lifecycle')
),
objects AS (
  SELECT e.table_name, e.phase, c.oid, c.relrowsecurity
  FROM expected e
  LEFT JOIN pg_catalog.pg_namespace n ON n.nspname = 'public'
  LEFT JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid
    AND c.relname = e.table_name AND c.relkind IN ('r','p')
)
SELECT table_name, phase,
  (oid IS NOT NULL) AS exists_in_public,
  coalesce(relrowsecurity,false) AS rls_enabled,
  (SELECT count(*) FROM pg_catalog.pg_policy WHERE polrelid = oid) AS rls_policy_count
FROM objects ORDER BY phase, table_name;

-- Funções que devem existir após a implantação das migrations propostas.
SELECT function_name,
  to_regprocedure(function_name) IS NOT NULL AS function_exists
FROM (VALUES
 ('public.has_role(uuid,public.app_role)'),
 ('public.create_rental_contract(jsonb)'),
 ('public.cashier_open(numeric)'),
 ('public.cashier_move(uuid,text,numeric,text)'),
 ('public.cashier_close(uuid,numeric,text)'),
 ('public.rental_confirm_pickup(uuid)'),
 ('public.rental_confirm_return(uuid,text)'),
 ('public.rental_record_payment(uuid,uuid,text,numeric,integer)'),
 ('public.rental_release_laundry(uuid)')
) AS f(function_name);

-- Metadados sobre funções privilegiadas acessíveis publicamente.
SELECT n.nspname AS schema_name, p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef AS security_definer,
  has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.prosecdef=true
ORDER BY p.proname;
