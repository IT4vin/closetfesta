# Primeiro deploy na conta da Closet Festa

- Projeto Supabase criado em `sa-east-1`: `roqcwdlsuawrdbmnwbvv` (novo, sem dados antigos).
- Todas as 9 migrations do aplicativo aplicadas no projeto novo.
- Migration adicional de hardening: Storage `product-images` privado, RLS e funções privilegiadas sem execução por `anon`.
- Criar primeiro administrador usando o e-mail `contato@closetfesta.com.br`. O papel é criado somente após confirmação do e-mail no Supabase Auth, se ainda não existir administrador.
- Não há senha padrão. O proprietário escolhe senha de pelo menos 12 caracteres.
- Variáveis do deploy estático: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. **Nunca publicar `service_role`.**
- Atualizar Supabase Authentication → URL Configuration com o domínio efetivo do Render, incluindo URL de redirecionamento, antes do cadastro do administrador.
- Após o primeiro cadastro e confirmação, testar login, RLS, cadastro de produto com imagem, cliente, locação, pagamento parcial e caixa, devolução e lavanderia, com perfis de funcionários.
- As migrações SQL existem no GitHub para auditoria. A URL do Render e o estado efetivo do deploy devem ser registrados depois que o serviço estiver criado.
- A versão não é considerada aprovada para uso financeiro sem ensaios reais e correção de problemas encontrados.

## Publicação Render
- Static Site: https://closet-festa-administrativo.onrender.com
- Painel: https://dashboard.render.com/static/srv-dbn39degekts738pk4mg
- Commit inicial Render: cb0e260b96a68e18a867c2a45db10e0ca04e1e74
- Deploy inicial: dep-dbn39degekts738pk6v0 (live)
- O serviço acompanha a branch de desenvolvimento e faz novos deploys quando ela recebe commits.
- Supabase Authentication → URL Configuration deve ter **Site URL** `https://closet-festa-administrativo.onrender.com` e Redirect URL `https://closet-festa-administrativo.onrender.com/**`. A alteração exige acesso ao Dashboard Supabase e ainda não foi confirmada.
- O formulário envia `emailRedirectTo` para o domínio carregado no navegador, mas a lista de redirecionamentos autorizados precisa ser configurada no Supabase.
- O Render Static Site criado via integração direta ainda requer verificação de fallback SPA (rewrite `/*` → `/index.html`) para rotas internas recarregadas diretamente; configurar em Render Dashboard → Redirects/Rewrites caso necessário.
- A primeira conta administrativa depende de confirmação no e-mail empresarial e criação automática de role; sem isso não há acesso ao painel.
- O estado live do Render confirma publicação de arquivos estáticos, NÃO comprova teste de criação de contrato, caixa ou login end-to-end.
