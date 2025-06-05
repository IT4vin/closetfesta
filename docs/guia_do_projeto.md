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
- **Autenticação**: Login seguro com JWT.
- **Showcase**: Catálogo público responsivo para clientes.

## Tecnologias Utilizadas
- **Frontend**: React, TypeScript, Vite
- **UI/UX**: shadcn-ui, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, SQLite
- **Autenticação**: JWT (JSON Web Tokens)
- **Gerenciamento de Estado**: React Context, React Query
- **Validação de Formulários**: React Hook Form, Zod
- **Gráficos**: Recharts
- **Banco de Dados**: SQLite (local)
- **Upload de Arquivos**: Multer + Sharp
- **Outros**: clsx, date-fns, xlsx (importação/exportação), embla-carousel, etc.

## Estrutura do Projeto
```
closetfesta/
├── backend/               # Backend Node.js
│   ├── src/
│   │   ├── routes/        # Rotas da API
│   │   ├── middleware/    # Middlewares (auth, cors, etc)
│   │   ├── database/      # SQLite e migrations
│   │   ├── services/      # Lógica de negócio
│   │   └── server.js      # Servidor principal
│   ├── uploads/           # Arquivos uploadados
│   ├── data/              # Banco SQLite
│   └── package.json       # Dependências do backend
├── src/                   # Frontend React
│   ├── components/        # Componentes reutilizáveis e de página
│   ├── contexts/          # Contextos globais (ex: Auth)
│   ├── hooks/             # Hooks customizados
│   ├── lib/               # Funções utilitárias e libs
│   ├── pages/             # Páginas principais do app
│   ├── services/          # Serviços de API
│   ├── utils/             # Utilitários gerais
│   └── main.tsx           # Entry point do React
├── closet-festa-showcase/ # Catálogo público
│   ├── src/
│   │   ├── integrations/api/ # Cliente HTTP para backend
│   │   ├── services/      # Serviços do showcase
│   │   └── components/    # Componentes do catálogo
│   └── package.json       # Dependências do showcase
├── public/                # Assets públicos
├── package.json           # Dependências principais
├── tailwind.config.ts     # Configuração do Tailwind
└── vite.config.ts         # Configuração do Vite
```

## Arquitetura Backend Node.js
- **Banco de Dados**: SQLite com tabelas: `users`, `products`, `categories`, `customers`, `orders`
- **API**: Endpoints RESTful para todas as operações
- **Autenticação**: JWT com middleware de verificação
- **Storage**: Upload local de imagens com Multer + Sharp
- **Configuração**: Variáveis de ambiente em arquivo `.env`

## Scripts Úteis
- `npm run dev` – Inicia o frontend
- `npm run dev:backend` – Inicia o backend
- `npm run dev:showcase` – Inicia o showcase
- `npm run dev:all` – Inicia tudo simultaneamente
- `npm run build` – Gera a build de produção
- `npm run backend:migrate` – Executa migrations do banco
- `npm run backend:seed` – Popula dados de teste

## Como Rodar Localmente
1. Instale as dependências principais:
   ```sh
   npm install
   ```
2. Instale dependências do backend e showcase:
   ```sh
   npm run setup
   ```
3. Configure o banco de dados:
   ```sh
   npm run backend:migrate
   npm run backend:seed
   ```
4. Inicie o sistema completo:
   ```sh
   npm run dev:all
   ```
5. Acesse:
   - **Sistema Principal**: [http://localhost:5173](http://localhost:5173)
   - **Backend API**: [http://localhost:3001](http://localhost:3001)
   - **Showcase**: [http://localhost:5174](http://localhost:5174)

## Endpoints da API
- `POST /api/auth/login` - Login de usuário
- `GET /api/auth/me` - Dados do usuário atual
- `GET /api/products` - Listar produtos
- `POST /api/products` - Criar produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Deletar produto
- `GET /api/categories` - Listar categorias
- `POST /api/upload` - Upload de arquivos

## Fluxo de Autenticação
- O login é feito via email e senha com JWT
- Token armazenado no localStorage
- Middleware verifica token em rotas protegidas
- Usuários padrão (após seed):
  - **Admin:** admin@closetfesta.com / admin123
  - **Usuário:** user@closetfesta.com / user123

## Showcase (Catálogo Público)
- Interface moderna e responsiva
- Conecta ao backend via cliente HTTP
- Funcionalidades de contato (WhatsApp, Instagram)
- PWA (Progressive Web App)
- SEO otimizado

## Observações para a Equipe
- **Ambientes**: O projeto está preparado para dev, test e prod
- **Independência**: Zero dependências de serviços terceirizados
- **Escalabilidade**: Backend preparado para horizontal scaling
- **Manutenibilidade**: Código modular e bem estruturado
- **Performance**: SQLite local para desenvolvimento, PostgreSQL recomendado para produção

## Migração do Supabase
✅ **CONCLUÍDA**: O sistema foi 100% migrado do Supabase para backend Node.js próprio:
- Backend independente com SQLite
- Autenticação JWT própria
- Upload de arquivos local
- APIs RESTful customizadas
- Zero dependências externas

---

Este documento reflete a arquitetura atual do sistema. Para dúvidas técnicas, consulte a documentação da API ou os arquivos README específicos. 