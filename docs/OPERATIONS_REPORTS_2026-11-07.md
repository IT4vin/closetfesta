# Painel e Relatórios Operacionais — Closet Festa
Implantação em 07/11/2026. O sistema publica a branch `work/production-readiness-phase1-20261106` no Render.

## Referência funcional
Capturas fornecidas pelo solicitante: cards Em atraso/Hoje/Próximos 10 dias
(Provas, Retiradas, Devoluções); Resultados do dia/semana/mês; Contas a pagar/receber;
Agenda do dia; e oito relatórios (Separação, Pedidos, Indisponibilidade,
Rotatividade, Créditos, Consignados, Comissões e Análise de clientes).

## Origem de cada número
- Provas: agendamentos com título de prova e datas de prova dos itens de locação; deduplicados por cliente, tipo, dia quando fontes coincidem.
- Retiradas: agendamentos e itens reservados ainda não retirados.
- Devoluções: agendamentos e itens confirmados/retirados ainda não devolvidos.
- Em atraso: antes do dia local; Hoje: dia atual; Próximos 10 dias: amanhã a mais 10 dias. Todos os períodos operacionais usam America/Sao_Paulo.
- Total de pedidos (R$): soma de valores de contratos não cancelados criados no período.
- Total recebido: soma de pagamentos de aluguel registrados, não revertidos, pela data de pagamento. NÃO representa extrato bancário conciliado.
- Número de pedidos: contagem de contratos não cancelados criados no período.
- Semana: segunda a hoje; mês: primeiro dia a hoje.
- A pagar: somatório de lançamentos manuais de despesa não marcados pagos.
- A receber: saldo positivo de cada contrato não cancelado menos pagamentos registrados + lançamentos manuais de receita pendentes. IMPORTANTE: lançamentos manuais devem ser usados somente quando NÃO representam um saldo já calculado no contrato, para evitar duplicidade de recebíveis.
- Agenda do dia: agendamentos salvos no Supabase e prazos derivados dos itens dos contratos.
- Separação: agenda e datas dos trajes, filtro até 60 dias.
- Indisponibilidade: por dia e exemplar físico, considerando status e reservas; é estimativa consultiva, não substitui a confirmação atômica do contrato.
- Rotatividade: contagem de itens contratados pelo dia do evento; valor do item é contratado, não receita recebida.
- Análise de clientes: origens informadas no cadastro, valor e número de contratos; registros históricos sem origem ficam como Não informado.

## Módulos transacionais complementares
- Créditos: tabela `client_credit_entries`, saldo por SUM(delta). Ajustes e transferências somente admin/manager via funções `credit_adjust` e `credit_transfer` com bloqueios de linha de cliente. Sem saldo negativo, com justificativa e operation_id. NÃO é pagamento do PDV automaticamente.
- Consignação: tabela `product_consignments`; funções `consignment_register` e `consignment_return`. Um exemplar consignado passa a status `consigned` em `product_units` e não está disponível na seleção do contrato. Não confundir com itens reservados pelos contratos.
- Comissões: tabela `sales_commissions`; `commission_register` exige gerente, vendedor autorizado, contrato não cancelado e percentual informado; montante calculado pelo PostgreSQL. `commission_mark_paid` registra confirmação manual, não transfere dinheiro. Não há percentual automático presumido nem comissão criada automaticamente para cada pedido.
- Permissões: admins e gerentes administram créditos, consignação e comissão; comissão individual pode ser lida pelo próprio vendedor; atendentes podem criar agendamentos; caixa pode ler agenda, mas não gravar.
- RLS habilitada nas novas tabelas; execução anônima das seis funções novas revogada; todas verificam `auth.uid()` e papel no banco. Avisos do Supabase Security Advisor sobre SECURITY DEFINER ainda exigem revisão final em auditoria de segurança.

## Verificações realizadas
1. Migração `closet_festa_reports_credit_consignment_commission_20261107` aplicada no Supabase `roqcwdlsuawrdbmnwbvv`.
2. Teste com BEGIN/ROLLBACK: ajuste de crédito, transferência, recusa por saldo insuficiente, criação/baixa de comissão e consignação/retorno de unidade física. Nenhum teste persistiu.
3. Vitest: funções de período, contagens sem duplicar, exclusão de cancelados e separação financeiro contratual versus pagamento.
4. CI Frontend Readiness: build de produção e testes.
5. Render: deploy automático da branch conforme GitHub, verificar status final do commit mais recente antes de afirmar live.
6. Contagem de preservação: cliente, contrato, produto e pagamento Pix previamente existentes permaneceram no banco.

## Pendências de homologação
- Testar ações com sessão real de cada papel (admin, manager, staff, cashier) e verificar UX em celular.
- Conciliação automática do dinheiro do caixa, extrato Pix/cartão e estornos.
- Aplicação automática de créditos no pagamento do PDV, se o negócio exigir esse fluxo.
- Rateio e regras padronizadas de comissão, se a operação desejar cálculo automático.
- Notificações externas de prova/retirada/devolução e importação de histórico legado.
- Reconciliar eventuais recebíveis manuais que referenciem os mesmos contratos.
- Auditorias RLS e melhorias de performance com volume de dados alto. O hook atual pagina até 20 mil registros e gera erro explícito acima do limite, não inventando total.
