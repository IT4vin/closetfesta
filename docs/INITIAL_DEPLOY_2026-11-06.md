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
