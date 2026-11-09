# Funcionários — Configurações do Closet Festa

## Arquitetura
- Login individual: Supabase Auth, mesma conta do PDV e do controle de ponto.
- Tabelas existentes reutilizadas: `auth.users`, `public.profiles`, `public.user_roles` e `public.closet_role_audit`.
- A área **Configurações → Funcionários** é exclusiva do administrador e utiliza o mesmo menu e a identidade marsala/off-white do sistema.
- Dados adicionais da equipe (`cargo`, `setor`, `data de admissão`) ficam em `closet_employee_details` com **user_id** como chave primária referenciando Auth; não existe cadastro duplicado de autenticação.
- O histórico de alterações cadastrais é registrado em `closet_employee_details_audit`; alterações de perfil já são auditadas por `closet_assign_user_role`.

## Como cadastrar
1. Entre com o administrador e abra **Configurações → Funcionários → Novo funcionário**.
2. Informe nome, e-mail individual e, se necessário, telefone, setor, cargo e data de admissão.
3. Escolha o perfil inicial: **Atendimento**, **Caixa** ou **Gerente**.
4. Clique em **Enviar convite**. O serviço `closet-invite-employee` valida o JWT e o papel admin antes de chamar `auth.admin.inviteUserByEmail` dentro do backend. O funcionário pode definir sua senha no primeiro acesso; após o convite, o administrador também pode definir ou redefinir a senha pelo novo fluxo administrativo protegido.
5. O colaborador abre o e-mail, acessa a página **/accept-invite** e define a própria senha. A página utiliza `supabase.auth.updateUser` na sessão autenticada do convite.
6. Acesso ao PDV, controle de ponto e demais módulos segue o perfil escolhido. A lista indica quando o e-mail ainda não foi confirmado.

**Configuração necessária do Supabase Auth:** autorize `https://closet-festa-administrativo.onrender.com/accept-invite` em Authentication → URL Configuration → Redirect URLs. Se não estiver na lista, o Supabase pode redirecionar ao Site URL em vez do formulário de ativação. Confirme também o envio de e-mail do projeto (SMTP, templates e limites de rate).

## Gerenciar um funcionário
- Pesquise pelo nome, e-mail, cargo ou setor e clique em **Gerenciar**.
- Edite os dados de contato e cargo; o salvamento é auditado.
- Escolha um dos perfis efetivos: **Administrador**, **Gerente**, **Atendimento**, **Caixa** ou **Sem acesso**.
- A matriz mostra quais permissões do sistema cada perfil realmente possui. Não disponibiliza permissões finas que ainda não existam na autorização do banco.
- Clique **Salvar permissões** para enviar a mudança por `closet_assign_user_role`; ela verifica `auth.uid()` e admin no banco, bloqueia auto-revogação e grava auditoria.
- Selecione **Sem acesso** para impedir novos acessos autorizados. O usuário Auth e seus históricos de pedidos/ponto continuam armazenados.
- Para mudança de e-mail, o titular usa o procedimento seguro de mudança/confirmacão em seu perfil existente.

## Administrador: definir ou alterar senha de login
- Em **Configurações → Funcionários**, escolha a conta e clique em **Senha** (na linha) ou **Gerenciar → Definir ou alterar senha**.
- Digite uma nova senha de 12 a 72 caracteres com letras e números, confirme e autorize a alteração.
- É possível definir a senha inicial de um funcionário convidado ou redefinir a senha de um colaborador ou administrador cadastrado. Nenhuma senha atual é recuperada ou mostrada.
- A atualização é feita **exclusivamente no servidor** pela Edge Function `closet-admin-set-employee-password`. O navegador envia a senha via HTTPS e a função exige JWT válido e papel `admin` conferido na tabela `user_roles` do banco.
- O backend usa o método oficial `auth.admin.updateUserById` do Supabase Auth. Não altera e-mail, confirmação de e-mail, cargo, permissões, perfil ou histórico de ponto.
- A tabela `closet_employee_password_audit` registra apenas o ID do administrador, ID da conta, horário e resultado; **nunca registra senhas, hashes ou tokens**. RLS limita consulta ao administrador e escrita ao serviço.
- Para contas ainda não confirmadas por e-mail, a nova senha **não substitui** a confirmação de e-mail exigida pelo Supabase Auth. Sessões já abertas podem continuar ativas até serem encerradas.
- **Implantação obrigatória:** publicar `supabase/functions/closet-admin-set-employee-password/index.ts` no projeto Supabase `roqcwdlsuawrdbmnwbvv`, com `verify_jwt=true`. A migração `20261109155500_admin_employee_password_audit.sql` já foi aplicada no banco.
- O frontend somente ficará operacional para essa ação **após a publicação da função**. O deploy do Render sozinho não disponibiliza a função do Supabase. Ao validar, testar apenas uma conta de teste controlada, nunca redefinir a senha de um usuário real sem autorização.

## Segurança
- A Edge Function exige sessão de usuário e papel `admin` consultado no banco; serviço de convite não é acessível por funcionário ou anônimo.
- `closet_employee_directory()` e `closet_employee_update()` revalidam o administrador no PostgreSQL, independentemente do frontend.
- Tabelas extras têm RLS habilitado; INSERT/UPDATE/DELETE diretos não são permitidos ao navegador.
- A conta desativada não recebe `user_roles`, portanto os fluxos que validam o papel no servidor negam acesso. Um navegador já aberto pode continuar mostrando menu em cache até renovar sessão; os endpoints autorizados revalidam a permissão.
- Convites são limitados à ação de um administrador, que deve conferir e-mail e cargo do destinatário. Não incluir chaves secretas no frontend.

## Testes e implantação
- Migração `20261108222000_employee_settings_management.sql` validada previamente dentro de `BEGIN/ROLLBACK`, incluindo edição auditada e bloqueio de acesso sem perfil.
- CI executa regressões de convites, validação, alteração/revogação de perfil e build do sistema completo.
- Edge Function implantada com `verify_jwt=true` e bibliotecas oficiais do Supabase.
- Não foram criados funcionários fictícios nem enviados e-mails de teste a contatos reais.
