# Closet Manager – Guia do Projeto

## Visão Geral
O Closet Manager é um sistema web para gestão de lojas de aluguel e venda de produtos, com foco em moda (vestuário, acessórios, etc). Ele permite o controle de estoque, clientes, vendas, aluguéis, agenda, relatórios financeiros e operacionais, tudo em uma interface moderna e responsiva.

## Principais Funcionalidades
- **Dashboard**: Visão geral do negócio, agenda do dia, atividades recentes, produtos mais alugados e métricas financeiras.
- **Gestão de Produtos**: Cadastro, edição, exclusão, importação/exportação, categorização e upload de imagens de produtos.
- **Gestão de Clientes**: Cadastro, histórico de aluguéis, filtros, busca e visualização detalhada.
- **PDV (Ponto de Venda)**: Módulo para registrar vendas, controlar caixa e visualizar relatórios rápidos.
- **Relatórios**: Gráficos e exportação de dados sobre vendas, aluguéis, clientes, produtos e finanças.
- **Agenda**: Controle de agendamentos, devoluções e eventos futuros.
- **Configurações**: Personalização do sistema, perfil do usuário e preferências gerais.
- **Autenticação**: Login seguro com Supabase Auth.

## Tecnologias Utilizadas
- **Frontend**: React, TypeScript, Vite
- **UI/UX**: shadcn-ui, Tailwind CSS, Lucide Icons
- **Gerenciamento de Estado**: React Context, React Query
- **Validação de Formulários**: React Hook Form, Zod
- **Gráficos**: Recharts
- **Integração e Backend**: Supabase (Database, Auth, Storage, Edge Functions)
- **Outros**: clsx, date-fns, xlsx (importação/exportação), embla-carousel, etc.

## Estrutura do Projeto
```
closetfesta/
├── src/
│   ├── components/        # Componentes reutilizáveis e de página
│   ├── contexts/          # Contextos globais (ex: Auth)
│   ├── hooks/             # Hooks customizados
│   ├── integrations/      # Integrações externas (ex: Supabase)
│   ├── lib/               # Funções utilitárias e libs
│   ├── pages/             # Páginas principais do app (Dashboard, Produtos, Clientes, etc)
│   ├── services/          # Serviços de API e lógica de negócio
│   ├── utils/             # Utilitários gerais
│   └── main.tsx           # Entry point do React
├── public/                # Assets públicos
├── supabase/              # Configuração e funções do Supabase
├── package.json           # Dependências e scripts
├── tailwind.config.ts     # Configuração do Tailwind
├── vite.config.ts         # Configuração do Vite
└── ...
```

## Integração com Supabase
- **Banco de Dados**: Tabelas principais: `products`, `product_categories`, `product_images`, `clients`, `admin_users`.
- **Auth**: Gerenciamento de usuários e permissões via Supabase Auth.
- **Storage**: Upload e gerenciamento de imagens de produtos.
- **Edge Functions**: Funções serverless para lógica de negócio (ex: products-api).
- **Configuração**: As credenciais e URLs estão em `src/integrations/supabase/client.ts` e `supabase/config.toml`.

## Scripts Úteis
- `npm run dev` – Inicia o servidor de desenvolvimento
- `npm run build` – Gera a build de produção
- `npm run preview` – Visualiza a build localmente
- `npm run lint` – Executa o linter

## Como Rodar Localmente
1. Instale as dependências:
   ```sh
   npm install
   ```
2. Configure as variáveis de ambiente se necessário (consulte o Supabase).
3. Inicie o servidor de desenvolvimento:
   ```sh
   npm run dev
   ```
4. Acesse em [http://localhost:5173](http://localhost:5173) (ou porta configurada).

## Fluxo de Autenticação
- O login é feito via email e senha, utilizando Supabase Auth.
- Usuários de teste (padrão):
  - **Admin:** admin@closetmanager.com / admin123
  - **Usuário:** usuario@closetmanager.com / user123

## Observações para a Equipe
- **Ambientes**: O projeto está preparado para dev, test e prod. Ajuste as variáveis de ambiente conforme necessário.
- **Padrão de Código**: Siga o padrão de componentes reutilizáveis, hooks e serviços para facilitar manutenção e escalabilidade.
- **Extensibilidade**: Novas funcionalidades devem ser implementadas preferencialmente como novos hooks, serviços ou componentes, evitando duplicação de lógica.
- **Documentação**: Consulte este guia e o README.md para dúvidas rápidas. Para detalhes de negócio, consulte o PO/analista.

---

Este documento deve ser atualizado conforme o projeto evoluir. Dúvidas ou sugestões, registre issues no repositório. 