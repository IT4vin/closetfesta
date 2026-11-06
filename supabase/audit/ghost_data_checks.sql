-- Auditoria somente leitura. Executar periodicamente como administrador.
-- A presença de linhas é um alerta, NÃO autorização automática para exclusão.
SELECT 'produtos_excluidos_ativos' AS issue, id::text AS record_id
  FROM public.products WHERE deleted_at IS NOT NULL AND active
UNION ALL
SELECT 'imagem_sem_produto',i.id::text
  FROM public.product_images i LEFT JOIN public.products p ON p.id=i.product_id WHERE p.id IS NULL
UNION ALL
SELECT 'agendamento_sem_cliente',a.id::text
  FROM public.appointments a LEFT JOIN public.clients c ON c.id=a.client_id
  WHERE a.client_id IS NULL OR c.id IS NULL
UNION ALL
SELECT 'agendamento_tempo_invalido',id::text
  FROM public.appointments WHERE end_at<=start_at
UNION ALL
SELECT 'item_com_produto_inconsistente',ri.id::text
  FROM public.rental_items ri JOIN public.product_units u ON u.id=ri.unit_id
  WHERE ri.product_id<>u.product_id
UNION ALL
SELECT 'contrato_cliente_ausente',r.id::text
  FROM public.rental_contracts r LEFT JOIN public.clients c ON r.client_id=c.id WHERE c.id IS NULL
UNION ALL
SELECT 'pagamento_sem_contrato',p.id::text
  FROM public.rental_payments p LEFT JOIN public.rental_contracts c ON c.id=p.contract_id WHERE c.id IS NULL
UNION ALL
SELECT 'caixa_saldo_fechado_divergente',cr.id::text
  FROM public.cash_registers cr
  LEFT JOIN (
    SELECT cash_register_id, sum(amount) movements
    FROM public.cash_movements GROUP BY cash_register_id
  ) x ON cr.id=x.cash_register_id
  WHERE cr.status='closed'
    AND (
      cr.expected_amount IS DISTINCT FROM cr.opening_amount+coalesce(x.movements,0)
      OR cr.difference IS DISTINCT FROM cr.closing_amount-cr.expected_amount
    )
UNION ALL
SELECT 'recebimento_dinheiro_sem_movimento',p.id::text
  FROM public.rental_payments p LEFT JOIN public.cash_movements m
    ON m.reference_id=p.id AND m.type='rental_cash_receipt'
  WHERE p.method='cash' AND p.status<>'reversed' AND m.id IS NULL
ORDER BY issue,record_id;
