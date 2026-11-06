# Saneamento de dados e integridade referencial — Closet Festa

Última revisão: 06/11/2026.

## Diagnóstico comprovado

Consultas SELECT no projeto `roqcwdlsuawrdbmnwbvv`: um produto, um cliente, um contrato e um pagamento real; zero agendamentos e caixas. Todas as verificações de vínculos órfãos, duplicidade e saldo consultadas retornaram zero. O contrato 1 continha valor de R$ 254,91 e um recebimento registrado de R$ 254,91 (Pix, ainda não conciliado externamente).

O problema de dados fantasmas foi reproduzido no código: widgets da página inicial, relatório do PDV e agendamentos eram de demonstração, alimentados por constantes, Math.random() ou localStorage. As rotas ativas foram convertidas para consultas reais do Supabase.

## Segurança das alterações

- Nenhum DELETE nem limpeza irreversível de dados de negócio.
- Agendamentos novos exigem cliente existente, datas válidas e sem sobreposição para o mesmo cliente.
- Produto excluído logicamente recebe também `active=false`, preservando o histórico do catálogo.
- Caixa e movimentos financeiros preservados com FK RESTRICT; movimentação financeira tem tipos/sinais validados.
- Recebimentos em **dinheiro** passam a inserir `rental_cash_receipt` na movimentação de um caixa aberto do mesmo operador, na mesma transação. Sem caixa aberto, o pagamento em dinheiro falha de forma explícita e integralmente reversível. Pix e cartões não entram no saldo físico.
- O trigger não cria lançamentos retroativos nem altera o registro Pix existente.
- **Ainda não há rotina auditada de estorno financeiro do caixa.** Um pagamento em dinheiro marcado como revertido exigirá lançamento compensatório por processo aprovado. Não atualizar `rental_payments.status` manualmente.
- Totais de contratos, pagamentos registrados, contas pendentes e saldo físico devem ser mostrados como medidas distintas.
- Relatórios usam datas de pagamento e contrato separadamente. Números exibidos não equivalem à conciliação bancária.

## Verificações antes de liberar operação plena

1. Confirmar deploy Render e teste de login em navegador.
2. Exercitar agendamento real (criar, visualizar, cancelar) com cliente já cadastrado.
3. Testar produto arquivado desaparecendo do catálogo de vendas, mantendo histórico.
4. Abrir caixa e registrar locação em dinheiro em ambiente de homologação, confirmar movimento vinculado ao pagamento, depois fechar caixa.
5. Testar tentativa de registrar dinheiro sem caixa aberto e verificar ausência de gravação parcial.
6. Implementar estorno auditado, integração de comprovantes e conciliação com adquirência/banco.
7. Testar relatórios por perfil (admin, gerente, caixa, atendimento), incluindo negativas de RLS.
8. Acompanhar periodicamente `supabase/audit/ghost_data_checks.sql`.
