# E-mail de confirmação do primeiro administrador — Closet Festa

## Diagnóstico (06/11/2026)

- Projeto: `roqcwdlsuawrdbmnwbvv`.
- Um usuário foi criado com o e-mail empresarial `contato@closetfesta.com.br`; ainda estava com `email_confirmed_at IS NULL` na consulta.
- Logs `auth_logs`: evento `mail.send` no cadastro e duas tentativas de login respondidas com **Email not confirmed**.
- O evento `mail.send` não garante entrega na caixa de entrada.
- Novo frontend mostra **Não recebi a confirmação**, **Reenviar e-mail de confirmação** e, caso seja enviado um código, confirmação via código de seis dígitos.
- O servidor SMTP padrão do Supabase só entrega mensagens para e-mails previamente autorizados pertencentes à equipe da organização e não deve ser usado em produção.

## Configurações necessárias no Supabase Dashboard

1. <https://supabase.com/dashboard/project/roqcwdlsuawrdbmnwbvv/auth/url-configuration>: definir **Site URL** `https://closet-festa-administrativo.onrender.com` e adicionar `https://closet-festa-administrativo.onrender.com/**` à lista de redirecionamentos.
2. <https://supabase.com/dashboard/project/roqcwdlsuawrdbmnwbvv/auth/smtp>: conectar um SMTP transacional confiável, validando domínio/remetente SPF, DKIM e DMARC. Exemplo: Resend, Amazon SES, Brevo, Postmark. **Nunca adicionar segredo de SMTP ao Git ou ao frontend Vite**.
3. <https://supabase.com/dashboard/project/roqcwdlsuawrdbmnwbvv/auth/templates>: conferir o template **Confirm sign up**. Para permitir o campo opcional de código, incluir `{{ .Token }}` no corpo do e-mail, além de manter o link `{{ .ConfirmationURL }}`.
4. Após configurar o e-mail, abrir o site e clicar em **Não recebi a confirmação** → **Reenviar e-mail de confirmação**. Confirmar via link ou via código do template, depois entrar com a senha cadastrada no primeiro acesso.
5. Conferir o cadastro administrativo com `select u.email_confirmed_at, r.role from auth.users u left join public.user_roles r on r.user_id=u.id where lower(u.email)='contato@closetfesta.com.br';` (consulta somente leitura no SQL Editor). O papel administrador só deve ser atribuído após a confirmação.
6. Fazer teste de envio/entrega e autenticação com uma conta autorizada; não desligar a confirmação de e-mail como solução improvisada.

Referência oficial: <https://supabase.com/docs/guides/auth/auth-smtp> e <https://supabase.com/docs/guides/auth/auth-email-templates>.
