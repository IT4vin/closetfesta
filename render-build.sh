#!/bin/bash

# ===============================
# BUILD SCRIPT PARA RENDER.COM
# ===============================

set -e

echo "🚀 Iniciando build para Render..."

# Verificar Node.js
echo "📋 Versão do Node.js:"
node --version

# Verificar Bun
echo "📋 Versão do Bun:"
bun --version

# Instalar dependências
echo "📦 Instalando dependências..."
bun install

# Verificar se TypeScript está disponível
echo "🔧 Compilando TypeScript..."
if command -v tsc &> /dev/null; then
    tsc
else
    echo "⚠️ TypeScript não encontrado, usando npx..."
    npx tsc
fi

# Build com Vite
echo "🏗️ Executando build do Vite..."
if command -v vite &> /dev/null; then
    vite build
else
    echo "⚠️ Vite não encontrado, usando npx..."
    npx vite build
fi

# Verificar se o build foi criado
if [ ! -d "dist" ]; then
    echo "❌ Erro: Diretório dist não foi criado!"
    echo "📁 Listando arquivos no diretório atual:"
    ls -la
    exit 1
fi

# Verificar conteúdo do diretório
echo "📁 Conteúdo do diretório dist:"
ls -la dist/

echo "✅ Build concluído com sucesso!"
