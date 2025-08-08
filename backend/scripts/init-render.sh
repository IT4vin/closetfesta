#!/bin/bash

# ===============================
# SCRIPT DE INICIALIZAÇÃO PARA RENDER
# ===============================

set -e

echo "🚀 Inicializando backend no Render..."

# Verificar variáveis de ambiente críticas
echo "🔍 Verificando variáveis de ambiente..."
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DB_TYPE: $DB_TYPE"
echo "DB_PATH: $DB_PATH"

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p data logs uploads temp
mkdir -p uploads/products uploads/products/thumbnails

# Verificar se o banco existe
if [ ! -f "$DB_PATH" ]; then
    echo "📊 Banco de dados não encontrado, criando..."
    
    # Executar migrações
    echo "🔄 Executando migrações..."
    npm run migrate
    
    # Executar seed
    echo "🌱 Executando seed..."
    npm run seed
else
    echo "📊 Banco de dados encontrado, verificando integridade..."
    
    # Apenas executar migrações (caso haja novas)
    npm run migrate
fi

# Verificar se há categorias no banco
echo "🔍 Verificando categorias no banco..."
if command -v sqlite3 &> /dev/null; then
    CATEGORY_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM product_categories WHERE deleted_at IS NULL;" 2>/dev/null || echo "0")
    echo "📁 Categorias encontradas: $CATEGORY_COUNT"
    
    if [ "$CATEGORY_COUNT" -eq "0" ]; then
        echo "⚠️ Nenhuma categoria encontrada, executando seed..."
        npm run seed
    fi
else
    echo "⚠️ sqlite3 não disponível, pulando verificação de categorias"
fi

# Verificar permissões
echo "🔒 Verificando permissões..."
ls -la data/ logs/ uploads/ || true

echo "✅ Inicialização concluída!"
echo "🎯 Iniciando servidor..."

# Iniciar servidor
exec npm start
