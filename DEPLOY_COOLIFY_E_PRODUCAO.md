# Guia completo: análise do sistema e deploy em produção (Coolify ou outro host)

Este documento descreve o sistema Closet Festa, o que já está pronto, o que falta e o passo a passo para colocar em produção (Coolify ou alternativa).

---

## 1. Visão geral do sistema

O **Closet Festa** é um sistema de gerenciamento de aluguel de roupas para festas com três partes:

| Parte | Stack | Função |
|-------|--------|--------|
| **Backend API** | Node.js 18, Express, SQLite ou PostgreSQL, Redis (opcional) | API REST, auth JWT, upload de imagens, migrações |
| **Frontend Admin** | React, TypeScript, Vite | Painel administrativo (produtos, pedidos, calendário, PDV, financeiro) |
| **Showcase / Catálogo** | React, TypeScript, Vite | Site público do catálogo para clientes |

- **Banco**: desenvolvimento com SQLite; produção pode ser SQLite (arquivo em volume) ou PostgreSQL.
- **Cache**: Redis opcional; o backend funciona sem Redis (apenas sem cache).
- **Uploads**: armazenados em `backend/uploads` (em produção deve ser volume persistente).

---

## 2. O que já existe no repositório

- **Backend**
  - `backend/Dockerfile` (multi-stage, Node 18 Alpine).
  - `backend/env.example` com variáveis de ambiente.
  - Suporte a SQLite e PostgreSQL em `backend/src/config/database.js`.
  - Migrações em `backend/src/migrations/` (executadas na subida do servidor).
  - Health check em `/health` e `/api/health`.
- **Deploy**
  - `docker-compose.production.yml` com: API, PostgreSQL, Redis, Nginx, Prometheus/Grafana (perfil opcional).
- **Frontends**
  - Usam `VITE_API_URL` em build; sem Dockerfile no repositório.

---

## 3. O que falta para produção “funcionando perfeitamente”

### 3.1 Correções no `docker-compose` e env

- **Variável de senha do banco**: o compose usava `DB_PASS`; foi corrigido para `DB_PASSWORD`.
- **Variável de usuário e tipo**: o compose foi ajustado com `DB_USER`, `DB_TYPE=postgres` para o serviço da API.
- **Nginx**: o compose monta `./nginx/nginx.conf` e `./nginx/conf.d` e `./backend/src/database/init.sql`; esses arquivos/pastas **não existem** no repositório. Para subir sem erro:
  - **Opção 1 (recomendada para Coolify)**: Comentar ou remover o serviço `nginx` do compose e a linha que monta `init.sql` no serviço `postgres` (as migrações do backend já criam as tabelas). No Coolify, use o proxy reverso e SSL do próprio painel para a API.
  - **Opção 2**: Criar a pasta `nginx/` com configuração e um arquivo `backend/src/database/init.sql` vazio (ou com SQL opcional).

### 3.2 Frontends (Admin e Showcase) em produção

- Não há Dockerfile para os dois frontends.
- Em produção é preciso:
  - Build com `VITE_API_URL` apontando para a URL pública da API (ex.: `https://api.seudominio.com` ou `https://seudominio.com/api`).
  - Servir os arquivos estáticos (pasta `dist/`) com um servidor web (Nginx, Caddy, ou serviço estático do Coolify).

Opções:

- **A) Coolify**: criar um “Static Site” ou “Dockerfile” por frontend (Dockerfile que faz `npm run build` e serve `dist/` com nginx), ou usar build no Coolify e servir a pasta de build.
- **B) Incluir no mesmo projeto**: adicionar Dockerfiles para Admin e Showcase e um `docker-compose` que suba API + Postgres (e Redis se quiser) + os dois frontends, com um Nginx na frente (ou o proxy do Coolify).

### 3.3 Compatibilidade do banco com PostgreSQL

- Todo o código usa placeholders **`?`** (estilo SQLite). O driver **pg** espera **`$1, $2, ...`**.
- **Correção aplicada**: em `backend/src/config/database.js` foi adicionada a conversão `?` → `$1`, `$2`, … no método `queryPostgreSQL`, para que as mesmas queries funcionem com PostgreSQL em produção.

### 3.4 CORS

- O backend lê `CORS_ORIGINS` (lista separada por vírgula) e já tem exemplos para Render.
- Em produção é obrigatório definir `CORS_ORIGINS` com as URLs exatas dos frontends (ex.: `https://admin.seudominio.com,https://catálogo.seudominio.com`). Sem isso, o navegador bloqueia as requisições.

### 3.5 Arquivo `.env` de produção

- Não existe `.env.example` na raiz para o **docker-compose** (só no backend).
- Falta um modelo (ex.: `.env.production.example`) com todas as variáveis que o `docker-compose.production.yml` usa, para você preencher e não subir com valores padrão fracos (JWT, senhas do Postgres/Redis, etc.).

---

## 4. Caminho recomendado: Coolify

Coolify funciona muito bem com Docker (compose ou Dockerfile) e lida com domínio, SSL e proxy. Abaixo o caminho para “funcionar perfeitamente”.

### 4.1 Opção A – Só backend no Coolify (frontends em outro lugar)

1. **Corrigir o `docker-compose`** (ou usar um compose só da API + Postgres + Redis):
   - Trocar `DB_PASS` por `DB_PASSWORD`.
   - Definir `DB_USER`, `DB_NAME`, `DB_TYPE=postgres` para o serviço da API.
   - Remover o serviço Nginx do compose (Coolify faz proxy) ou criar a pasta `nginx/` e o `init.sql` se quiser Nginx interno.
2. **Criar `.env.production.example`** (e seu `.env` real) com:
   - `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
   - `DB_TYPE=postgres`, `DB_HOST=postgres`, `DB_PORT=5432`, `DB_NAME=...`, `DB_USER=...`, `DB_PASSWORD=...`
   - `JWT_SECRET` (forte, ≥ 32 caracteres)
   - `REDIS_PASSWORD` e `CACHE_ENABLED=true`, `CACHE_HOST=redis`, `CACHE_PORT=6379`, `CACHE_PASSWORD=...`
   - `CORS_ORIGINS=https://admin.seudominio.com,https://catalogo.seudominio.com`
3. **PostgreSQL**: garantir que as migrações e queries funcionem com Postgres (conversão `?` → `$1,$2` no `database.js` ou uso só de SQLite em produção com volume).
4. No Coolify:
   - Novo projeto → Deploy por **Docker Compose** (ou por Dockerfile do backend).
   - Repositório = seu Git.
   - Arquivo = `docker-compose.production.yml` (ou o que você ajustar).
   - Variáveis de ambiente = as do `.env`.
   - Domínio para a API (ex.: `api.seudominio.com`).
5. **Frontends**: buildar localmente ou em CI com `VITE_API_URL=https://api.seudominio.com/api` e publicar como “Static Site” no Coolify ou em outro host (Vercel, Netlify, etc.), garantindo que `CORS_ORIGINS` inclua a origem deles.

### 4.2 Opção B – Tudo no Coolify (API + Admin + Showcase)

1. **Backend**: como na opção A (compose ou Dockerfile, Postgres, Redis, env corrigido).
2. **Frontends**: adicionar ao repositório:
   - `Dockerfile` para o Admin (multi-stage: build Vite + servir com nginx).
   - `Dockerfile` para o Showcase (idem).
   - Ou um único `docker-compose.full.yml` com serviços: `api`, `postgres`, `redis`, `admin`, `showcase`, e opcionalmente um `nginx` que roteie por path ou subdomínio.
3. No Coolify:
   - Um projeto com o compose que inclui API + frontends, **ou**
   - Três aplicações (API, Admin, Showcase) no mesmo servidor, cada uma com seu domínio/subdomínio e variáveis (Admin e Showcase com `VITE_API_URL` no build).
4. **CORS**: `CORS_ORIGINS` com as URLs reais do Admin e do Showcase.

---

## 5. Alternativa ao Coolify

- **Railway / Render / Fly.io**: deploy do backend por Dockerfile ou “Node” (apontando para `backend/`); adicionar Postgres e Redis como add-ons; frontends como “Static Site” ou em outro serviço, com `VITE_API_URL` e CORS corretos.
- **VPS (DigitalOcean, Hetzner, etc.)**: usar o mesmo `docker-compose` (corrigido) + Nginx/Caddy na frente com SSL (ex.: Let’s Encrypt). Coolify é basicamente um painel para fazer isso em cima de um servidor.

O “caminho” técnico é o mesmo: env certo, DB (SQLite ou Postgres com placeholders corrigidos), CORS, e frontends buildados com a URL da API.

---

## 6. Checklist antes de considerar “funcionando perfeitamente”

- [x] **docker-compose**: `DB_PASSWORD`, `DB_USER`, `DB_TYPE=postgres` e `UPLOAD_DIR` no serviço da API (já corrigido).
- [ ] **Nginx**: ou criar `nginx/` + `init.sql` ou remover Nginx do compose e usar só o proxy do Coolify.
- [x] **PostgreSQL**: conversão `?` → `$1,$2` implementada em `database.js` para o driver pg.
- [ ] **Arquivo .env de produção**: `.env.production.example` e variáveis preenchidas (JWT, DB, Redis, CORS).
- [ ] **CORS**: `CORS_ORIGINS` com as URLs reais dos frontends.
- [ ] **Frontends**: build com `VITE_API_URL` correto e hospedagem dos `dist/` (Coolify Static Site ou Dockerfile com nginx).
- [ ] **Uploads e dados**: volumes persistentes para `uploads`, `data` (se SQLite) e para o Postgres.
- [ ] **Health check**: Coolify pode usar `GET /health` da API para checagem de vida.

---

## 7. Resumo em uma frase

**O que falta para o sistema “funcionar perfeitamente” na Coolify (ou em outro host):** corrigir variáveis de ambiente no `docker-compose` (DB_PASSWORD, DB_USER, DB_TYPE), criar ou remover Nginx/init do Postgres, garantir compatibilidade das queries com PostgreSQL (placeholders `?` → `$1,$2`) ou usar SQLite em produção, configurar CORS e um `.env` de produção, e colocar os dois frontends em produção (build com `VITE_API_URL` e servir os arquivos estáticos). Com isso, o caminho para deploy na Coolify (ou alternativa) fica completo e reproduzível.

---

*Documento gerado a partir da análise do repositório Closet Festa. Ajuste domínios e senhas conforme seu ambiente.*
