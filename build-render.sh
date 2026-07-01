#!/bin/bash

# ===============================
# SCRIPT DE BUILD PARA RENDER.COM
# ===============================

set -e  # Parar em caso de erro

echo "🚀 Iniciando build para Render.com..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ package.json não encontrado!"
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
bun install

# Compilar TypeScript
echo "🔧 Compilando TypeScript..."
npx tsc

# Build do Vite
echo "🏗️  Executando build do Vite..."
npx vite build

# Verificar se o build foi criado
if [ ! -d "dist" ]; then
    echo "❌ Diretório dist não foi criado!"
    exit 1
fi

# Listar arquivos gerados
echo "📁 Arquivos gerados:"
ls -la dist/

echo "✅ Build concluído com sucesso!"
echo "📂 Arquivos disponíveis em: ./dist"
