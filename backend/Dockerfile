# ===============================
# MULTI-STAGE DOCKERFILE
# ===============================

# Stage 1: Dependencies
FROM node:18-alpine AS dependencies
LABEL stage=dependencies

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-client \
    && rm -rf /var/cache/apk/*

# Copiar arquivos de configuração
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Build
FROM node:18-alpine AS build
LABEL stage=build

WORKDIR /app

# Copiar dependências do stage anterior
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Remover arquivos desnecessários
RUN find . -name "*.test.js" -delete && \
    find . -name "*.spec.js" -delete && \
    find . -name "__tests__" -type d -exec rm -rf {} + && \
    rm -rf tests/ coverage/ .git/ .github/

# Stage 3: Production
FROM node:18-alpine AS production
LABEL maintainer="ClosetFesta Team"
LABEL version="1.0.0"
LABEL description="Backend API para ClosetFesta - Sistema de Gerenciamento de Loja"

# Instalar dependências do sistema para produção
RUN apk add --no-cache \
    postgresql-client \
    curl \
    && rm -rf /var/cache/apk/*

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# Copiar aplicação do stage de build
COPY --from=build --chown=nextjs:nodejs /app ./

# Configurar diretórios e permissões
RUN mkdir -p logs uploads data && \
    chown -R nextjs:nodejs /app

# Trocar para usuário não-root
USER nextjs

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Comando de inicialização
CMD ["npm", "start"] 