# PDV profissional da Closet Festa — 07/11/2026

## Escopo e identidade visual preservada
O usuário solicitou reorganizar o PDV seguindo o exemplo de operação profissional, **sem alterar o menu e sem alterar as cores existentes do sistema**. Foram preservados:
- Menu lateral e arquitetura de navegação/abas do componente `src/pages/PDV.tsx`;
- Paleta institucional existente em `src/index.css` e `tailwind.config.ts` (fundo claro, cards e marsala);
- Rota `/pdv`, aba Pedidos, Caixa, Agenda, Dashboard, Relatórios e Sistema;
- RPC `create_rental_contract` com validação transacional de preço, estoque e disponibilidade.
Nenhum mockup escuro, menu alternativo, duplicação de pedido ou fluxo de venda de mercadorias foi criado.

## Arquitetura e layout
- `src/components/pdv/PDVSale.tsx`: estado e regra de negócio simplificados, mantendo `useProducts`, `useOrders` e os modais reais de cliente e pagamento.
- `src/components/pdv/PDVWorkspace.tsx`: layout de operação. Cabeçalho do PDV, busca por nome/SKU/GTIN, sugestão com foto, quantidade, filtro de categoria, caixa central com tabela, total, dados do cliente, atendente autenticado, datas e observações, atalhos e barra fixa de ações.
- `src/components/pdv/PDVProductGallery.tsx`: catálogo fotográfico existente reaproveitado em janela de busca avançada; não há segundo estoque.
- `src/lib/api.ts`: expõe barcode/GTIN real da tabela products ao tipo Product para pesquisa.
- `src/lib/pdvCalculations.ts`: cálculos puros de subtotal, desconto por item, desconto global, total e validação de quantidades. Valores recalculados antes do checkout.
- A quantidade tem limite de 20 por modelo no formulário, refletindo o limite da RPC existente. A reserva final usa unidades físicas reais na transação do banco.
- Descontos visíveis para gerente/administrador. A RPC continua conferindo a permissão financeira do usuário.

## Teclado
- Ctrl+B: busca avançada;
- F8: selecionar/cadastrar cliente;
- F10: salvar atendimento;
- Ctrl+Enter: continuar;
- Escape sem campo em edição ou modal aberto: pedir confirmação para limpar atendimento.
Atalhos são suspensos enquanto um modal está aberto, para evitar comandos em segundo plano.

## Rascunhos reais — não são reservas
- `supabase/migrations/20261107213000_pdv_drafts.sql` aplicada com sucesso.
- Nova tabela `pdv_drafts` com RLS individual por `owner_id=auth.uid()` e checagem de função do operador.
- `src/lib/pdvDrafts.ts`: salvar, restaurar e excluir via Supabase. Nunca mostrar salvamento se a gravação falhar.
- Salva referências de produtos (IDs, quantidade e desconto), cliente, datas e observações, não fotos/cadastros falsos nem pagamentos.
- Ao restaurar, busca produtos reais, atualiza preços, limita quantidades ao estoque cadastrado, retira modelos indisponíveis e consulta o cliente no banco. O saldo final e a disponibilidade por dia **são validados pelo RPC no checkout**.
- Rascunho não bloqueia nenhum exemplar. O checkout efetivado limpa o rascunho, mas falha na limpeza não desfaz pedido já confirmado.

## Pagamentos e sinal
- `src/components/pdv/PDVPaymentModal.tsx` conserva dinheiro, Pix, débito, crédito, parcelamento e pagamento misto; adiciona sinais de 50%, valor integral e valor customizado em um único meio.
- Um sinal confirmado gera contrato com saldo em aberto. A tela nunca confunde valor do contrato com valor pago.
- Recebimentos são **registros manuais** após operador confirmar no dinheiro/maquininha/extrato. Não faz cobranças ou estornos bancários.
- Recebimentos em espécie exigem caixa aberto pela própria pessoa responsável conforme trigger existente.

## Testes e proteção
- `src/__tests__/pdvCalculations.test.ts`: subtotal, descontos, limite e carrinho vazio;
- `src/__tests__/pdvDrafts.test.ts`: validação, persistência e falha em banco;
- `src/__tests__/pdvWorkspace.test.tsx`: renderização do PDV sem menu alternativo, busca por GTIN e atalhos.
- Teste SQL com BEGIN/ROLLBACK no Supabase: usuário autenticado administrador salva e consulta rascunho, sem persistir testes.
- O Render publica a branch `work/production-readiness-phase1-20261106` automaticamente; `main` permanece preservada.

## Pontos que exigem homologação presencial
- Conferir visualmente diferentes resoluções/teclados/leitor de códigos de barras e acessibilidade de operadores reais;
- Pagamentos reais e conciliação com Stone/Rede/banco externo;
- Agendamento de provas avulsas separadas do pedido e impressão de contrato;
- Fechamentos reais de caixa e saldo físico sob operação;
- Preços, termos de sinal/desistência e taxas de adquirência; estes continuam dependentes de confirmação gerencial;
- Testes end-to-end autenticados por papel. CI valida testes e build, mas não simula cobranças nem operação de balcão real.
