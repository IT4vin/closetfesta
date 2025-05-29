# Closet Festa - Sistema Completo

Sistema de gerenciamento de aluguel de roupas para festas, agora com backend Node.js próprio.

## 🚀 Arquitetura

O sistema é composto por 3 aplicações:

1. **Backend API** (Node.js + Express + SQLite/PostgreSQL)
   - API REST para gerenciamento de produtos e categorias
   - Upload e processamento de imagens
   - Banco de dados SQLite (dev) / PostgreSQL (prod)

2. **Frontend Admin** (React + TypeScript + Vite)
   - Interface administrativa para gerenciar produtos
   - Upload de imagens, categorização, controle de estoque

3. **Showcase/Catálogo** (React + TypeScript + Vite)
   - Catálogo público dos produtos disponíveis
   - Interface otimizada para clientes

## 📁 Estrutura do Projeto

```
closetfesta/
├── backend/                 # API Node.js
│   ├── src/
│   │   ├── config/         # Configuração do banco
│   │   ├── database/       # Migrações e seeds
│   │   ├── models/         # Models (Product, Category)
│   │   ├── routes/         # Rotas da API
│   │   ├── middleware/     # Upload e processamento
│   │   └── server.js       # Servidor principal
│   ├── uploads/            # Imagens dos produtos
│   ├── data/              # Banco SQLite
│   └── package.json
├── src/                    # Frontend Admin
├── closet-festa-showcase/  # Catálogo público
└── package.json           # Scripts do projeto
```

## 🛠️ Configuração e Instalação

### 1. Setup Inicial

```bash
# Instalar dependências de todos os projetos
npm run setup

# Ou manualmente:
npm install
cd backend && npm install
cd ../closet-festa-showcase && npm install
```

### 2. Configurar Backend

```bash
# Navegar para o backend
cd backend

# Criar arquivo .env (baseado no .env.example)
cp env.example .env

# Executar migrações
npm run migrate

# Popular com dados de exemplo
npm run seed
```

### 3. Configurar Frontend Admin

```bash
# Na raiz do projeto, criar .env
echo "VITE_API_URL=http://localhost:3001/api" > .env
```

### 4. Configurar Showcase

```bash
# No diretório do showcase
cd closet-festa-showcase
echo "VITE_API_URL=http://localhost:3001/api" > .env
```

## 🚀 Executando o Sistema

### Executar Tudo (Recomendado)

```bash
npm run dev:all
```

Isso iniciará:
- Backend API na porta 3001
- Frontend Admin na porta 8090+ (varia se 8090 estiver ocupada)
- Showcase na porta 8085+ (varia se 8085 estiver ocupada)

### Executar Individualmente

```bash
# Backend apenas
npm run dev:backend

# Frontend Admin apenas
npm run dev

# Showcase apenas
npm run dev:showcase
```

## 📚 API Endpoints

### Produtos

- `GET /api/products` - Listar produtos
- `GET /api/products/:id` - Buscar produto
- `POST /api/products` - Criar produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Deletar produto
- `POST /api/products/:id/images` - Upload de imagens
- `DELETE /api/products/:id/images/:imageId` - Remover imagem

### Categorias

- `GET /api/categories` - Listar categorias
- `GET /api/categories/:id` - Buscar categoria
- `GET /api/categories/:id/products` - Produtos da categoria
- `POST /api/categories` - Criar categoria
- `PUT /api/categories/:id` - Atualizar categoria
- `DELETE /api/categories/:id` - Deletar categoria

### Catálogo Público

- `GET /api/catalog/products` - Produtos para o catálogo (apenas em estoque)

### Imagens

- `GET /api/images/*` - Servir imagens estáticas

### Sistema

- `GET /health` - Health check
- `GET /api/health` - Health check da API
- `GET /api/info` - Informações do sistema

## 🔧 Scripts Úteis

```bash
# Resetar banco de dados (apaga e recria)
npm run backend:reset

# Executar apenas migrações
npm run backend:migrate

# Executar apenas seed
npm run backend:seed
```

## 🗃️ Banco de Dados

### Desenvolvimento
- **SQLite** - Arquivo local em `backend/data/database.db`
- Não requer instalação adicional

### Produção
- **PostgreSQL** - Configure as variáveis de ambiente:
  ```
  DB_TYPE=postgres
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=closet_festa
  DB_USER=postgres
  DB_PASSWORD=sua_senha
  ```

### Estrutura das Tabelas

- **users** - Usuários do sistema
- **product_categories** - Categorias de produtos
- **products** - Produtos do catálogo
- **product_images** - Imagens dos produtos

## 📸 Upload de Imagens

- Formatos aceitos: JPG, JPEG, PNG, WebP
- Tamanho máximo: 5MB por arquivo
- Processamento automático:
  - Redimensionamento para máximo 1200x1200px
  - Conversão para WebP para otimização
  - Criação automática de thumbnails (300x300px)
- Armazenamento em `backend/uploads/products/`

## 🔒 Segurança

- Rate limiting (100 requests por 15 minutos por IP)
- Helmet.js para headers de segurança
- Validação de dados com Joi
- Upload seguro com verificação de tipos

## 🌐 CORS

Configurado para aceitar requisições de:
- http://localhost:8084 (Frontend Admin)
- http://localhost:8085 (Showcase)
- http://localhost:3000 (Desenvolvimento)
- http://localhost:5173 (Vite dev server)

## 📊 Dados de Exemplo

O seed cria automaticamente:
- 1 usuário admin (admin@closetfesta.com / admin123)
- 5 categorias (Vestidos, Blusas, Saias, Calças, Conjuntos)
- 5 produtos de exemplo

## 🔄 Migração do Supabase

✅ **Completa!** O sistema agora usa apenas o backend Node.js:

- ❌ Supabase removido
- ✅ API REST própria
- ✅ Banco de dados local/próprio
- ✅ Upload de imagens local
- ✅ Frontend Admin atualizado
- ✅ Showcase atualizado

## 🐛 Troubleshooting

### Backend não inicia
```bash
cd backend
npm install
npm run migrate
```

### Erro de permissão de upload
- Verificar se o diretório `backend/uploads` existe
- Verificar permissões de escrita

### Erro de conexão entre frontend e backend
- Verificar se o backend está rodando na porta 3001
- Verificar variável `VITE_API_URL` nos arquivos .env

### Erro de CORS
- Adicionar a URL do frontend na configuração CORS do backend
- Arquivo: `backend/src/server.js`

## 🚀 Deploy

### Backend
1. Configure PostgreSQL
2. Defina variáveis de ambiente para produção
3. Execute migrações: `npm run migrate`
4. Inicie: `npm start`

### Frontend Admin
1. Configure `VITE_API_URL` para a URL do backend em produção
2. Build: `npm run build`
3. Sirva os arquivos da pasta `dist/`

### Showcase
1. Configure `VITE_API_URL` para a URL do backend em produção
2. Build: `npm run build`
3. Sirva os arquivos da pasta `dist/`

## 📝 Próximos Passos

- [ ] Sistema de autenticação completo
- [ ] Gestão de usuários
- [ ] Relatórios e analytics
- [ ] Sistema de pedidos/reservas
- [ ] Integração com WhatsApp Business API
- [ ] PWA para o showcase
- [ ] Testes automatizados

---

Desenvolvido com ❤️ para facilitar a gestão da sua loja de roupas.
