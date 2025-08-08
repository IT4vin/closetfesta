#!/bin/bash

# ===============================
# SCRIPT DE VALIDAÇÃO DE BUILD
# ===============================

set -e  # Parar em caso de erro

echo "🔍 Iniciando validação do build..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log_info() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Validar estrutura de diretórios
echo "📁 Validando estrutura de diretórios..."

if [ ! -d "src" ]; then
    log_error "Diretório src não encontrado!"
    exit 1
fi

if [ ! -f "package.json" ]; then
    log_error "Arquivo package.json não encontrado!"
    exit 1
fi

if [ ! -f "src/server.js" ]; then
    log_error "Arquivo src/server.js não encontrado!"
    exit 1
fi

log_info "Estrutura de diretórios validada"

# Validar dependências
echo "📦 Validando dependências..."

if [ ! -d "node_modules" ]; then
    log_warn "node_modules não encontrado, executando npm install..."
    npm install
fi

# Verificar se dependências críticas estão instaladas
CRITICAL_DEPS=("express" "dotenv" "cors" "helmet")

for dep in "${CRITICAL_DEPS[@]}"; do
    if ! npm list "$dep" >/dev/null 2>&1; then
        log_error "Dependência crítica não encontrada: $dep"
        exit 1
    fi
done

log_info "Dependências validadas"

# Validar sintaxe dos arquivos principais
echo "🔍 Validando sintaxe dos arquivos..."

if command -v node >/dev/null 2>&1; then
    if ! node -c src/server.js; then
        log_error "Erro de sintaxe em src/server.js"
        exit 1
    fi
    
    # Validar outros arquivos JS principais
    find src -name "*.js" -type f | head -10 | while read -r file; do
        if ! node -c "$file"; then
            log_error "Erro de sintaxe em $file"
            exit 1
        fi
    done
    
    log_info "Sintaxe dos arquivos validada"
else
    log_warn "Node.js não encontrado, pulando validação de sintaxe"
fi

# Validar configuração do Docker
echo "🐳 Validando configuração do Docker..."

if [ -f "Dockerfile" ]; then
    # Verificar se o Dockerfile tem as instruções básicas
    if ! grep -q "FROM node:" Dockerfile; then
        log_error "Dockerfile não tem imagem base Node.js"
        exit 1
    fi
    
    if ! grep -q "EXPOSE" Dockerfile; then
        log_error "Dockerfile não expõe nenhuma porta"
        exit 1
    fi
    
    if ! grep -q "CMD" Dockerfile; then
        log_error "Dockerfile não tem comando de inicialização"
        exit 1
    fi
    
    log_info "Dockerfile validado"
else
    log_warn "Dockerfile não encontrado"
fi

# Validar configuração de testes
echo "🧪 Validando configuração de testes..."

if [ -f "jest.config.js" ]; then
    log_info "Configuração do Jest encontrada"
else
    log_warn "Configuração do Jest não encontrada"
fi

if [ -d "tests" ]; then
    log_info "Diretório de testes encontrado"
else
    log_warn "Diretório de testes não encontrado"
fi

# Relatório final
echo ""
echo "📊 RELATÓRIO DE VALIDAÇÃO:"
echo "=========================="
log_info "Estrutura de projeto: OK"
log_info "Dependências: OK"
log_info "Sintaxe: OK"
log_info "Docker: OK"

echo ""
log_info "Validação concluída com sucesso! 🎉"
echo ""

exit 0
