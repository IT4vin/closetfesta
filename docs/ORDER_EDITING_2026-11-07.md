# PDV — Edição de pedidos e contrato imprimível
Data: 07/11/2026
Branch de implantação: `work/production-readiness-phase1-20261106`.
Projeto Supabase: `roqcwdlsuawrdbmnwbvv`.

## Funcionalidade e navegação
- `/pdv?tab=pedidos`: clicar no número do pedido, nome da cliente ou botão Detalhes.
- `/pdv/pedidos/:id`: página de detalhes com identidade visual marsala e controles junto de cliente, itens, observações e financeiro.
- Cliente: nome, telefone, e-mail, CPF/CNPJ, endereço e notas. A edição atualiza o cadastro compartilhado por outros pedidos do mesmo cliente. Reatribuição a outro cliente é exclusivamente gerencial.
- Trajes: selecionar outros produtos ativos com fotos, acrescentar item, trocar item, retirar item (cancelamento lógico), editar preço, conceder desconto por item, editar prova/retirada/evento/devolução. Estoque e conflito de datas verificados dentro do banco.
- Contrato: editar observações, conceder desconto adicional sobre o total, cancelar quando não houver traje já retirado nem pagamento ativo.
- Pagamentos: registrar via RPC `rental_record_payment`; estornar via RPC `rental_order_edit`, preservando o pagamento com status reversed. Estornos de Pix/cartão **não executam transferência bancária**; o operador confirma o estorno externo já concluído. Dinheiro exige caixa original ainda aberto, com saída compensatória `rental_cash_refund`; caixa fechado exige conferência financeira supervisionada.
- Contrato imprimível: `src/lib/rentalContractPrint.ts`, gera **minuta para conferência e assinatura** com ID real do pedido, cliente, trajes, datas e valores. Evita CNPJ e multa inventados. Os campos fiscais da locadora e condições especiais precisam ser revisados antes da assinatura. Não substitui contrato previamente assinado nem emite nota fiscal.
- Dados cancelados ficam no histórico, mas não contam como itens ou datas ativas.

## Proteções e regras
- Todas as edições estruturais usam uma **única função PostgreSQL transacional**: `rental_order_edit(p_contract_id,p_action,p_data,p_reason,p_request_id)`.
- Autorização: admins e managers para trocas, descontos, precificação, inclusão/remoção, reversões, troca de cliente e cancelamento; staff para editar contato, observações e datas de traje ainda não retirado. Cashier registra pagamento em RPC separada, não altera produtos ou descontos.
- Motivo obrigatório de 3 a 500 caracteres, idempotência por UUID `request_id`, auditoria em `rental_order_audit` (operador, motivo, estado prévio e resultado). Dados anteriores do cliente são copiados ao histórico quando ele é alterado.
- A edição de datas exige prova anterior à retirada e evento entre retirada e devolução, preservando constraint `no_double_booking_per_unit` para impedir duas reservas da mesma unidade.
- Produto substituído usa preço de aluguel cadastrado e desconto individual zerado; desconto geral já concedido é preservado.
- A soma financeira é sempre recalculada pelo banco: subtotal dos itens não cancelados, descontos individuais + desconto geral; um total editado **não pode ser menor** que pagamentos registrados.
- Pedido concluído não aceita mutações financeiras ou de trajes; alterações de cliente e observações permanecem disponíveis, se autorizado. Pedido cancelado não é editável.
- Cancelamento de contrato com recebimentos só após regularização de pagamentos. Com traje retirado/devolvido, exige procedimento especial fora da edição simples.
- Modificações nos prazos de locação **não alteram automaticamente agendamentos manuais** independentes em `appointments`, por não existir uma chave garantida entre todos eles. Se a loja tiver criado uma prova avulsa para o mesmo atendimento, essa agenda também deverá ser revisada.

## Implementação
- `supabase/migrations/20261107191500_order_editing_audit.sql` — tabela de auditoria, validação de reembolso em caixa e RPC.
- `supabase/migrations/20261107194500_order_edit_audit_client_snapshot.sql` — preserva cadastro anterior na auditoria.
- `src/lib/rentalOrderEditing.ts` — cliente de RPC, consulta de histórico.
- `src/components/pdv/OrderEditPanel.tsx` — editor por operação com campos validados e seleção visual de produtos.
- `src/pages/RentalOrderDetail.tsx` — layout marsala, botões e cronograma.
- `src/lib/rentalContractPrint.ts` — minuta A4, dados do banco e escaping de HTML.
- `src/__tests__/rentalOrderEditing.test.ts` e `src/__tests__/rentalContractPrint.test.ts` — regressões automatizadas adicionadas ao CI.

## Validações executadas
- Migrações executadas com sucesso no Supabase.
- Transação com `BEGIN ... ROLLBACK`: criação de clientes/produtos temporários; inclusão e troca de traje; datas, preço, desconto individual e geral; edição e troca de cadastro; notas; pagamento Pix e em espécie, reversão e contrapartida do caixa; recusa de desconto inválido; cancelamento; verificação de entradas de auditoria.
- Segunda transação com `ROLLBACK`: verificou preservação do nome antigo de cliente em `before_data` da auditoria.
- Depois da auditoria: 1 contrato, 1 cliente, 1 pagamento e 0 modificações simuladas persistidas.
- Testes de frontend incluem exigência de confirmação por RPC, idempotência e escaping seguro da impressão.
- Render publica commits automaticamente; confirmar o último status do CI e deploy separadamente.

## Limitações explícitas
- Não é integração bancária para executar reembolso no Pix ou cartão.
- Não é emissão de NFSe, boleto ou contrato eletrônico assinado.
- Não tem homologação visual end-to-end com todas as contas reais e todos os fluxos de pagamento.
- Não substitui conciliação financeira, revisão jurídica e backup validado.
