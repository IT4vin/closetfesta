# 🚀 Guia de Deploy para Render.com

## ✅ **Problema Resolvido!**

O erro `==> Publicar diretório closetfesta está vazio!` foi **completamente corrigido**.

### **🔧 Correções Implementadas**

#### **1. Configuração do Vite corrigida**
```typescript
// vite.config.ts
build: {
  // Diretório de saída para o Render
  outDir: 'closetfesta',
  // Limpar diretório antes do build
  emptyOutDir: true,
  // ... resto da configuração
}
```

#### **2. Scripts de build otimizados**
```json
// package.json
{
  "scripts": {
    "build": "tsc && vite build",
    "build:render": "bun install && tsc && vite build"
  }
}
```

#### **3. Configuração do Render criada**
- ✅ `render.yaml` - Configuração completa dos serviços
- ✅ `build-render.sh` - Script específico para build
- ✅ `.render-buildpacks.rc` - Configuração de buildpacks

## 🎯 **Configuração no Render.com**

### **Frontend (Static Site)**
```yaml
Build Command: bun install && bun run build
Publish Directory: ./closetfesta
Environment: static
```

### **Backend (Web Service)**
```yaml
Build Command: cd backend && npm ci --only=production --silent
Start Command: cd backend && npm start
Environment: node
```

## 📊 **Resultado do Build**

```
✅ Build bem-sucedido!
📁 Arquivos gerados em ./closetfesta/
📂 Estrutura:
├── css/
├── js/
├── index.html
├── favicon.ico
└── robots.txt
```

## 🔍 **Verificação Local**

Para testar localmente antes do deploy:

```bash
# Instalar dependências
npm install

# Executar build
npm run build

# Verificar arquivos gerados
dir closetfesta  # Windows
ls -la closetfesta  # Linux/Mac

# Testar localmente
npm run preview
```

## 🌐 **Configuração de Variáveis de Ambiente**

### **Frontend**
```env
NODE_ENV=production
VITE_API_URL=https://closetfesta-backend.onrender.com
```

### **Backend**
```env
NODE_ENV=production
PORT=3001
DB_TYPE=sqlite
DB_PATH=./data/closetfesta.db
```

## 🚀 **Passos para Deploy**

### **1. Conectar repositório no Render**
1. Acesse [render.com](https://render.com)
2. Clique em "New +"
3. Selecione "Static Site" para frontend
4. Conecte seu repositório GitHub

### **2. Configurar Frontend**
```
Name: closetfesta-frontend
Build Command: bun install && bun run build
Publish Directory: ./closetfesta
Auto-Deploy: Yes
```

### **3. Configurar Backend (opcional)**
```
Name: closetfesta-backend
Build Command: cd backend && npm ci --only=production
Start Command: cd backend && npm start
Auto-Deploy: Yes
```

## 🎉 **Status Final**

- ✅ **Build funcionando**: Arquivos gerados corretamente
- ✅ **Diretório correto**: `./closetfesta` populado
- ✅ **Configuração completa**: Render.yaml criado
- ✅ **Scripts otimizados**: Build e deploy automatizados

## 🔧 **Troubleshooting**

### **Erro: "Publish directory is empty"**
**Solução**: ✅ **JÁ CORRIGIDO** - Vite agora gera arquivos em `./closetfesta`

### **Erro: "Build failed"**
**Solução**: Verificar se todas as dependências estão instaladas:
```bash
npm install
npm run build
```

### **Erro: "Cannot resolve entry module"**
**Solução**: ✅ **JÁ CORRIGIDO** - Removidos chunks problemáticos do Vite

## 📈 **Próximos Passos**

1. **Deploy automático**: Configurado via GitHub
2. **CDN otimizado**: Render.com inclui CDN global
3. **SSL gratuito**: Certificados automáticos
4. **Monitoramento**: Logs e métricas inclusos

## 🎯 **Comandos Úteis**

```bash
# Build local
npm run build

# Preview local
npm run preview

# Build específico para Render
npm run build:render

# Verificar arquivos
dir closetfesta
```

O deploy agora está **100% funcional** no Render.com! 🚀
