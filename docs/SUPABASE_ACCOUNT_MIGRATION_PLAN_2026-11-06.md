# Migração do Supabase para a organização da Closet Festa

**Status: PREPARADA, NÃO EXECUTADA.** Nenhum dado ou usuário foi copiado e nenhuma variável do aplicativo publicado foi alterada.

## Identificação das contas e projetos (verificado em 06/11/2026)

- **Origem configurada no repositório**: `zwmmkpqmftrxozumooni`, indicada em `supabase/config.toml` e `.env`.
- A conta conectada ao Supabase NÃO tem permissão para ler o projeto de origem. A organização atual lista zero projetos.
- **Organização de destino**: `agfpuwcgrpsinmcwpsla` (contato@closetfesta.com.br's Org, plano Free).
- Preço de criação de um projeto consultado via Supabase: **US$ 0/mês no momento da consulta**. A tentativa de criação retornou exigência de confirmação explícita de custo. Não houve confirmação nem criação de projeto.
- A configuração de produção do provedor de hospedagem ainda não foi verificada. O banco de origem deve ser identificado pelas variáveis de ambiente **efetivamente publicadas** e por acesso autenticado.

## Impedimentos à migração de dados

1. Falta acesso administrativo ao Supabase de origem `zwmmkpqmftrxozumooni` ou exportação completa, verificável e atualizada.
2. É necessário confirmar expressamente a criação do projeto de destino no plano Free, que foi cotado em US$ 0/mês.
3. Sem acesso de origem, não é possível preservar comprovadamente clientes, usuários do Auth, perfis, imagens, contratos, recebimentos, estoque ou histórico financeiro.
4. Não apontar o frontend para um banco novo vazio. Não criar usuários substitutos com IDs diferentes sem mapear referências. Não substituir bancos inativos por semelhança de nomes.
5. As migrations atuais no PR #1 não substituem a exportação dos dados legados nem a configuração gerenciada de Authentication e Storage.

## Inventário obrigatório na origem (somente leitura)

- Confirmar organização, project ref, URL efetiva de produção, versão PostgreSQL e extensões.
- Identificar migrations já aplicadas, schemas `public`, funções, triggers, views, constraints, RLS e permissões de execução.
- Registrar contagem por tabela e últimas datas de alteração (sem expor dados pessoais).
- Levantar usuários do Supabase Auth, identidades, métodos de login e possíveis integrações OAuth; planejar preservação dos identificadores e sessões.
- Inventariar todos os buckets, caminhos e tamanho dos arquivos (principalmente `product-images`), inclusive políticas de acesso e estratégias de URLs assinadas.
- Levantar Edge Functions, secrets, cron, webhooks, URLs de redirecionamento, SMTP e outras integrações.
- Registrar fluxos com escritas simultâneas para definir janela de congelamento ou replicação de mudanças.

## Implementação segura

1. **Backups**: obter exportação consistente da origem com ferramentas oficiais Supabase/PostgreSQL; armazenar criptografada e testar restauração em ambiente separado. Se a origem for um banco gerenciado por serviço terceirizado, usar a exportação oficialmente suportada. NÃO armazenar backups com dados de clientes no GitHub.
2. **Destino**: criar projeto na organização autorizada, obter project ref, URL e publishable key. Guardar secrets somente no gerenciador do ambiente, nunca no Git.
3. **Schema**: comparar estrutura e histórico da origem com migrations versionadas do repositório. Aplicar somente migrations compatíveis em homologação; não executar cegamente todas, nem sobrescrever Auth/Storage gerenciados.
4. **Dados**: importar em ordem de dependências, preservando chaves e integridade. Tratar separadamente dados de Auth e metadados de Storage, de acordo com a documentação de migração oficial. Não copiar arquivos de Storage apenas copiando linhas de `storage.objects`; cada objeto real deve existir.
5. **Imagens**: transferir arquivos com acesso autorizado, conferir contagem, tamanho e integridade por objeto; recriar URLs de entrega para o novo domínio. URLs assinadas do projeto antigo deixam de funcionar no novo projeto.
6. **Segurança**: revisar RLS, grants, funções `SECURITY DEFINER`, bucket policies e papéis reais. Aplicar testes negativos com usuário não autorizado.
7. **Ensaios**: testar login de administradores, clientes, produtos, uploads, criação de contrato, pagamento parcial, caixa, retirada e devolução com múltiplos operadores e concorrência.
8. **Conciliação**: comparar origem e destino por tabela, usuário, imagem, contagem, totais de contratos e saldos financeiros. Investigar discrepâncias antes da troca.
9. **Corte**: preparar período controlado de congelamento ou replicação final, fazer cópia incremental, testar e atualizar `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` **somente no ambiente de homologação**. Depois de aceito, planejar publicação controlada em produção com rollback.
10. **Pós-corte**: validar logs, autenticação, gravações, histórico e métricas; manter origem e backups preservados até encerrar a janela de recuperação.

## Gates de implantação

- [ ] Conta autorizada consegue ler o projeto de origem correto.
- [ ] Confirmação do custo de criação do projeto de destino.
- [ ] Projeto de destino criado, acessível e com recursos suficientes para dados e arquivos.
- [ ] Backup completo obtido e restauração testada.
- [ ] Auth e Storage migrados e reconciliados.
- [ ] Schema e dados importados com IDs preservados.
- [ ] RLS e testes de autorização aprovados.
- [ ] Dados financeiros e contratos conciliados.
- [ ] Testes de disponibilidade e concorrência aprovados.
- [ ] Deploy de homologação apontado para destino e aprovado.
- [ ] Janela, responsável e procedimento de rollback documentados.
- [ ] Autorização de corte em produção.

## Observações do repositório

A branch `work/production-readiness-phase1-20261106` contém migrations planejadas para locações, caixa, pagamentos e lavanderia, mas não validadas em um Supabase real. Os arquivos foram commitados no PR #1. Não fazer merge/atualizar `supabase/config.toml` para uma referência nova até confirmar a origem, os dados e a estratégia de corte.

**Não é correto afirmar que a migração foi concluída quando apenas migrations e código foram criados.**
