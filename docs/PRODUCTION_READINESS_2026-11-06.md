# Preparação para produção — diagnóstico inicial (06/11/2026)

## Status
**BLOQUEADO PARA PRODUÇÃO.** Este PR é apenas a primeira etapa. Não foi executada migração no Supabase, deploy nem reconciliação financeira.

## Verificação de origem
- Repositório analisado: `IT4vin/closetfesta`, base commit `ef389ee3e9735bbe8a5c61fa5f5c64678f8cfd3a`.
- O frontend principal utiliza `src/lib/api.ts` para acesso direto ao Supabase. O backend Express continua no repositório e o README descreve uma arquitetura diferente.
- A conexão Supabase da sessão de revisão não retornou projetos. Não houve leitura ou teste do banco real.
- Foi realizada análise estática do código; não há comprovação de testes ponta a ponta ou implantação.
- A pipeline de frontend identificou divergência do `package-lock.json` com `package.json` (ausência do pacote Supabase declarado). Temporariamente utiliza `npm install` apenas para diagnosticar build e testes; **não aprovar release até restaurar `npm ci` reprodutível**.

## Correções incluídas neste PR
1. Reconciliação dos nomes de papéis no frontend com as migrations: `admin`, `manager`, `staff`, `cashier`; contas sem papel reconhecido são recusadas.
2. Verificação de permissão por recurso e ação no frontend, sem acesso implícito para todos os autenticados.
3. Funções que simulavam sucesso de devolução, contrato/recibo, multa e reserva agora retornam erro explícito `501` em vez de confirmar uma operação que não aconteceu.
4. No build de produção, o fluxo legado de criação de contratos via `localStorage` é bloqueado, e a API recusa sincronizar aluguel como uma venda. **Isso é uma medida temporária de segurança, não a implementação do PDV de produção.**
5. Prevenção de novas inclusões acidentais de `.env` e bancos locais, com aviso sobre arquivos já rastreados.
6. Testes de matriz de acesso.

**Atenção:** essas verificações no frontend são apenas UX/defesa em profundidade. A segurança real depende de RLS e autorização no backend. O PR não está pronto para merge sem testar os papéis dos funcionários.

## Bloqueios críticos restantes
| Severidade | Fluxo | Evidência | Ação necessária |
| --- | --- | --- | --- |
| Crítica | Segurança do Supabase | Migrations permitem `INSERT/UPDATE/DELETE` amplos a `authenticated` em tabelas operacionais; funções de permissões eram permissivas | Auditar RLS real e criar migrations, testes de acesso negativo por papel e `GRANT/REVOKE` |
| Crítica | Credenciais no Git | `.env` e `backend/.env` rastreados em repo público; dados SQLite também versionados | Avaliar conteúdo e histórico, revogar/rotacionar segredos reais, remover do índice com backup e revisar histórico conforme política |
| Crítica | Contratos | `src/hooks/useOrders.ts` salva pedidos no `localStorage`; `src/lib/api.ts` escreve pedidos na tabela `sales` sem datas de aluguel | Criar tabelas transacionais de contratos, itens físicos, datas, histórico e pagamentos; migrar o hook |
| Crítica | Conflito de datas | `reservationsApi.checkAvailability` era simulado | Validar períodos e impedir dupla reserva no banco sob concorrência |
| Crítica | Caixa | `src/components/pdv/PDVCashier.tsx` usa somente estado de componente | Persistir abertura, movimentos e fechamento com auditoria e conciliação |
| Alta | Pagamento | `PDVPaymentModal.tsx` usa `setTimeout` e não valida transação com adquirente | Separar registro manual de confirmação de adquirente; pagar apenas quando autorizado/confirmado |
| Alta | Clientes | `src/pages/Clients.tsx` lista exemplos e o formulário não grava nessa tela | Integrar lista, gravação, duplicidades e histórico |
| Alta | Fotos de produtos | Formulário `ProductForm.tsx` usa URLs `blob:`; API oferece upload no Storage separadamente | Encadear cadastro + upload real e tratamento de falha |
| Alta | Controle de estoque | Não há modelo consolidado de exemplar físico, contratos e movimentações | Modelar exemplar, lavanderia, manutenção e disponibilidade |
| Alta | Documentos | Geração de PDF/recibo por API não foi implementada | Gerar documento real, versionável e auditável |
| Alta | Testes/CI | Há testes `.disabled` e etapas `continue-on-error: true` | Habilitar testes críticos e impedir merge com falha |

## Plano de execução posterior
1. **Ambiente**: conectar Supabase de homologação, inspecionar `pg_policies`, `information_schema` e dados não sensíveis; revisar credenciais e criar backup.
2. **Banco e RLS**: elaborar migrations versionadas com papéis, clientes, estoque, financeiro e restrições de acesso; testar cenários permitidos e negados; não aplicar sem autorização.
3. **Contratos**: implementar gravação transacional e idempotente, com datas por exemplar e bloqueio de sobreposição.
4. **Caixa e pagamentos**: conciliação e persistência reais; distinguir registro manual de confirmação eletrônica.
5. **Operação**: clientes, produtos/imagens, agenda, devoluções, lavanderia, multas, documentos e relatórios.
6. **Homologação**: testes concorrentes em vários operadores, falha de rede, restauração de backup e regressões.
7. **Produção**: somente com aceite operacional e plano de reversão.

## Critérios de liberação (não atendidos)
- 100% das operações críticas persistidas e reconciliadas no banco.
- Nenhuma confirmação fictícia, nenhuma disponibilidade sempre positiva.
- Restrições efetivas no banco contra acesso indevido, dupla reserva e pagamento duplicado.
- Caixa confiável, relatórios reconciliados, documentos reais.
- Testes unitários, integração, E2E e restauração de backup aprovados.
- Deploy em homologação validado antes de produção.

## Observações de compatibilidade
- A configuração de roles do banco usa `staff` e `cashier`. Verificar contas já existentes que dependiam do antigo `seller`, bem como telas de gestão de perfis ainda simuladas.
- O `.gitignore` protege apenas arquivos futuros não versionados; arquivos e segredos já publicados permanecem no histórico. A rotação de segredos verdadeiros é uma ação operacional indispensável.
- Não conectar o catálogo público `IT4vin/closetfesta-catalog` antes de estabilizar a origem dos dados e testar as regras de acesso.
