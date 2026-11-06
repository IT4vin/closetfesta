# Alinhamento de acesso Supabase — Closet Festa

**Data da verificação:** 06/11/2026

## Identificação verificada no repositório
- `IT4vin/closetfesta` branch `main`: `supabase/config.toml` possui `project_id = "zwmmkpqmftrxozumooni"`.
- O arquivo `.env` versionado define `VITE_SUPABASE_URL` apontando para esse mesmo project ref. **A URL do deploy pode ser diferente**: é necessário inspecionar variáveis Vercel/hosting.
- Conta Supabase conectada com rótulo **sistema closet festa** listou somente:
  - `ujiuxvuciccxwmjdvkoj` — Closet Maneger — INACTIVE
  - `urgposyuzwyncahuuukd` — LINK CATALOGO — INACTIVE
  - `hrlhmnrwpyhujyjizobe` — n8n — INACTIVE
- O project ref configurado no código NÃO consta entre os projetos listados. A consulta `get_project` desse ref retornou **permission denied**.
- O projeto inativo Closet Maneger não respondeu às chamadas de `list_tables` e `list_migrations`; portanto, não foi possível inspecionar seu schema.
- Nenhuma migration ou operação de escrita foi executada no banco nesta verificação.

## Bloqueio de implantação
**NÃO aplicar as migrations de locações/caixa em nenhum dos três projetos inativos por aproximação do nome.**
A origem real precisa ser confirmada por `project_ref` e permissões do usuário, não pela semelhança dos nomes.

1. Abrir o projeto configurado: https://supabase.com/dashboard/project/zwmmkpqmftrxozumooni
2. Se aparecer erro de acesso, selecionar a conta/organização que possui esse projeto.
3. Se o banco for gerenciado por uma plataforma externa (por exemplo, Lovable Cloud), verificar na plataforma qual é a organização que realmente administra o banco e quais permissões podem ser concedidas.
4. Conectar **essa organização/projeto** ao plugin Supabase, em modo autorizado.
5. Conferir também o valor de `VITE_SUPABASE_URL` na plataforma onde o sistema administrativo está publicado; não enviar a chave secreta.
6. Quando o projeto estiver acessível, listar tabelas, migrations, RLS, dados estruturais não sensíveis, logs e advisors antes de qualquer escrita.
7. Fazer backup restaurável e homologar as migrations em ambiente separado antes de executar em produção.

## Diagnósticos disponíveis
- `node scripts/check-supabase-target.mjs`: verifica consistência estática entre `supabase/config.toml` e `.env`, sem pedir, registrar ou mostrar chaves.
- `supabase/preflight/readiness.sql`: consultas somente leitura para verificar tabelas, RLS e funções. **Executar no banco somente após confirmar project_ref.**

Essas checagens **não** substituem a consulta autenticada ao projeto nem comprovam que o sistema publicado usa a referência apontada no repositório.

## Mudanças pendentes de validação real
As migrations `20261106170000`, `20261106190000`, `20261106210000`, `20261106220000`, `20261106230000` e `20261107001000` continuam somente no GitHub (PR #1). Elas precisam de revisão de compatibilidade e testes em homologação, com atenção especial a funções `SECURITY DEFINER`, política RLS, concorrência de dois operadores, pagamentos, saldos e fechamento de caixa.

A aplicação NÃO está liberada para produção.
