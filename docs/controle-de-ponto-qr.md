# Controle de Ponto por QR Code — Closet Festa

## Arquitetura auditada
O aplicativo reutiliza React, TypeScript, Vite, shadcn/ui, Supabase Auth e os perfis existentes em public.profiles e public.user_roles (admin, manager, staff, cashier). Não cria cadastro paralelo de funcionários. Rotas, menus e permissões foram ampliados sem modificar as telas operacionais do PDV, contratos, produtos e pagamentos.

## Passo a passo
1. Cada funcionário precisa ter sua própria conta real do Supabase Auth e papel autorizado. No banco da loja, atualmente há somente a conta administrativa. Cadastros novos devem ser feitos no fluxo de Auth existente, não na tabela de clientes.
2. Em Controle de Ponto (/clock-admin), administradores e gerentes podem abrir QR Code da loja, imprimir e fixar o cartaz. O QR é único, secreto, armazenado no banco e não expira.
3. Na aba Banco de horas e relatórios, escolha cada funcionário e configure horário de início, horas esperadas por dia, dias da semana, tolerância e justificativa. Sem essa configuração não há apuração de extras, atrasos nem saldo.
4. O funcionário faz login, abre Bater Ponto (/clock), toca Registrar Ponto e aponta a câmera para o QR. A sequência é Entrada → Saída para almoço → Retorno do almoço → Saída final.
5. Meu Banco de Horas (/my-hours) mostra os registros individuais, totais de horas, períodos, correções e escala.
6. A administração filtra marcações por funcionário/datas, corrige horários mediante justificativa, adiciona marcação faltante com auditoria, exporta Excel e utiliza Imprimir/Salvar PDF no navegador.

## Modelo de dados e segurança
- time_clock_stores: uma loja, timezone America/Sao_Paulo e QR aleatório de 256 bits. A tabela não concede leitura direta do segredo. time_clock_admin_qr retorna o QR somente para gerência.
- time_clock_punches: ID Auth do empregado, ID da loja, data da jornada, tipo, horário registrado pelo servidor, horário efetivo, origem e localização opcional arredondada. UNIQUE por funcionário/jornada/tipo. Funcionário pode apenas consultar os próprios dados por RLS, não inserir/editar por SQL.
- time_clock_audit: histórico de correções e inclusões com responsável, horário anterior, novo horário e justificativa. O horário original recorded_at jamais é alterado.
- time_clock_schedules, time_clock_schedule_audit: jornada por empregado, configurada pela gerência, com histórico.
- RPCs time_clock_record, time_clock_state, time_clock_report, time_clock_admin_records, time_clock_admin_qr, time_clock_admin_adjust, time_clock_set_schedule, time_clock_audit_history validam identidade e papel no servidor. EXECUTE está revogado para anon.
- As marcações são serializadas com travamento transacional do perfil, conferência de QR, limite de quatro eventos por jornada e intervalo mínimo de um minuto.
- A câmera funciona via HTTPS; bibliotecas de leitura Nimiq e geração Project Nayuki são MIT e estão incorporadas localmente. Não há fotos/vídeos de funcionários gravados ou enviados.

## Cálculo e limitações
- Trabalhadas = entrada até almoço + retorno do almoço até saída final; no dia aberto, intervalo atual computado pelo horário do servidor e marcado como provisório.
- Extras = máximo de zero e trabalhadas menos carga esperada. Atrasos = minutos após início previsto, além da tolerância configurada.
- Saldo = trabalhadas menos carga esperada; só é calculado para jornadas com quatro marcações e escala configurada.
- Sem marcação não é sinônimo de falta; feriados/folgas/afastamentos não são descontados automaticamente.
- A escala atual é usada também nos relatórios anteriores. Uma folha definitiva com mudanças históricas de carga, férias e feriados requer regras e versões de jornada adicionais.
- Localização só é solicitada se o empregado autorizar e não é exigida para concluir marcação. O dado informado não é prova física verificável; o QR fixo pode ser copiado e usado por quem tiver credenciais válidas fora da loja.

## Conformidade legal
O presente módulo é um **controle interno gerencial**, NÃO um REP-P certificado. Não gera AFD/AEJ nem comprovantes de ponto com as assinaturas digitais qualificadas exigidas pela Portaria MTP 671/2021 e normas posteriores. O PDF da interface é um relatório não certificado. Antes de substituir um registrador legal obrigatório de ponto, obtenha análise trabalhista e técnica e implemente a conformidade aplicável.
Fonte: https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/fiscalizacao-do-trabalho/rep

## Verificação
GitHub Actions: testes de permissões, cliente RPC, geração local de QR e build, além de regressões do PDV. Supabase: migrations testadas com rollback, depois aplicadas com histórico; nenhuma marcação fictícia persistiu. RLS habilitado em todas as cinco tabelas.
