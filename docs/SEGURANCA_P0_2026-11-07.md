# Segurança P0 — Closet Festa (2026-11-07)

## Alterações executadas
- Remoção de `backend/.env` e `backend/data/*.db` da branch de produção por PR.
- Correção de `.gitignore` e verificação GitHub Actions de arquivos sensíveis versionados.
- Nenhum conteúdo confidencial desses arquivos foi copiado para este documento.

## Ações obrigatórias que ainda exigem o proprietário
1. **Considerar como potencialmente comprometidas** quaisquer chaves, senhas ou tokens que tenham estado em `backend/.env` em um repositório público. Rotacione os segredos verdadeiros de Supabase, bancos, serviços de e-mail, APIs e outros provedores, caso existam, e atualize os ambientes implantados. Não copie valores para issues/PRs.
2. Revisar o histórico Git, branches `main` e demais refs/tags, forks e caches; excluir rastreamento em uma branch **não remove o histórico**. Avaliar a necessidade de limpeza do histórico com ferramenta apropriada e plano de preservação; essa limpeza pode exigir re-clone de todos os colaboradores e não pode revogar segredos que já foram expostos.
3. Avaliar tornar o repositório privado até a verificação da exposição, sem considerar privacidade como substituta da rotação.
4. Habilitar a proteção contra senhas vazadas no painel de Auth do Supabase.
5. Revisar privilégios de funções `SECURITY DEFINER` individualmente antes de revogar EXECUTE; o sistema utiliza RPCs para locações, caixa e permissões.
6. Configurar backup automático do Supabase e **testar uma restauração em ambiente isolado**.
7. Revisar `main` (branch padrão) e centralizar a entrega na branch realmente implantada no Render.

## Verificações técnicas
- `node scripts/check-tracked-sensitive-files.mjs` rejeita arquivos de ambiente não-exemplo, SQLite e arquivos credenciais com nomes conhecidos, rastreados na branch.
- Não há garantia de que esse filtro detecte segredos embutidos no código; completar com secret scanning/Dependabot e revisão de credenciais.
- A implantação usa Vite estático e Supabase; bancos SQLite antigos não participam da produção do Render.
- Não foi executada exclusão de registros do Supabase.
