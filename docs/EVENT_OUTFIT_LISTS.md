# Listagens de trajes para casamento e outros eventos — Closet Festa

## Fluxo no PDV

1. Abra **PDV > Venda** e clique em **Criar listagem**, ao lado dos comandos do carrinho. Também é possível usar a aba **Listagens**.
2. Informe os nomes dos noivos ou responsáveis, o tipo de evento, a data, o local, o telefone e a quantidade prevista de cada grupo: padrinhos, madrinhas, pais, mães, pajens, daminhas, noivos e demais participantes.
3. Para cada grupo, defina **cores, observações de traje e acessórios**. Selecione no estoque os **modelos e acessórios permitidos** pelos noivos. Marque os acessórios ou peças indispensáveis como **obrigatórios**.
4. Clique em **Participante** e cadastre nome, CPF (se aplicável), telefone, e-mail, CEP, endereço e observações. O cadastro é gravado na tabela real de clientes. Se o CPF já existir, o cliente existente é reutilizado, sem sobrescrever seus dados.
5. Clique em **Fazer contrato** no participante: selecione apenas os produtos aprovados, informe prova, retirada, evento e devolução; registre opcionalmente um **pagamento realmente recebido**. O sistema chama a função oficial `create_rental_contract`, que numera contratos, reserva unidades e verifica conflitos de datas. O contrato fica associado à pessoa e à listagem.
6. Também é possível escolher **Vincular existente**, caso já haja um contrato na tabela `rental_contracts` para o mesmo cliente, data e peças aprovadas.
7. Use **Acompanhar** para registrar o progresso de atendimento, prova e observações individuais. O resumo mostra totais previstos, cadastrados e contratados.

## Dados gravados

- `event_outfit_lists`: evento, noivos/responsáveis, data, local, contato e status.
- `event_outfit_groups`: papel no evento, quantidade prevista, cor e especificações de traje/acessórios.
- `event_outfit_group_products`: peças aprovadas por grupo (traje ou acessório), inclusive as obrigatórias.
- `event_outfit_participants`: cliente real, papel, status e contrato individual, com cópia das especificações no ato da vinculação.

Os dados de clientes e contratos continuam nas tabelas existentes: `clients`, `rental_contracts`, `rental_items` e `rental_payments`. Não são criados contratos fictícios no armazenamento local.

## Validações e segurança

- RLS habilitado nas quatro tabelas; leitura e gravação destinadas apenas a usuários autenticados com papéis `admin`, `manager`, `staff` ou `cashier`.
- Funções do módulo são **SECURITY INVOKER**; a criação do contrato chama o procedimento oficial já existente, com suas próprias validações.
- Não é possível vincular um contrato de outro cliente, com data diferente do evento ou com peças não aprovadas; peças obrigatórias são verificadas no banco.
- Vínculos possuem unicidade de contrato e um participante não pode pertencer duas vezes à mesma listagem.
- O banco guarda a especificação escolhida pelos responsáveis em `spec_snapshot` após a vinculação.
- A criação de contrato e seu vínculo são uma só transação: em caso de erro, não fica contrato órfão da listagem.
- Produtos importados anteriormente receberam uma unidade física **provisória**. Antes de criar o contrato com esses itens, o atendente deve confirmar a existência do traje. Para reservas simultâneas do mesmo código, a loja deve conferir e ajustar o número real de unidades cadastradas.

## Instalação e testes

- Estrutura SQL implantada no projeto Supabase **Closet Festa Administrativo** (`roqcwdlsuawrdbmnwbvv`).
- Script reproduzível: `docs/sql/event-outfit-lists-setup.sql`.
- Componentes: `src/components/pdv/PDVEventOutfitLists.tsx`, `src/lib/eventOutfitLists.ts`, integração em `src/pages/PDV.tsx` e `src/components/pdv/PDVSale.tsx`.
- Foram executados testes de criação de listagem, participante e contrato real em transações SQL com `ROLLBACK`, sem registros de teste persistidos.
- Para mostrar a aba nova na aplicação publicada, o frontend atualizado deve estar implantado com as credenciais do Supabase correto.

**Observação:** a opção “Vincular existente” consulta os contratos reais de aluguel. Pedidos gravados apenas no armazenamento local do PDV antigo não são contratos de aluguel e não podem ser vinculados como se fossem um contrato numerado.
