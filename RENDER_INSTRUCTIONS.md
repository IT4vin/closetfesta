# 🚀 Instruções de Deploy para Render.com

## ⚠️ **CONFIGURAÇÃO OBRIGATÓRIA NO DASHBOARD DO RENDER**

O problema `==> Publicar diretório closetfesta está vazio!` pode ser resolvido configurando corretamente no dashboard do Render.

### **📋 Configurações Obrigatórias**

#### **1. Build Command (CRÍTICO)**
```bash
bun install && bun run build:render
```

**OU alternativamente:**
```bash
npm install && npm run build
```

#### **2. Publish Directory**
```
./closetfesta
```

#### **3. Environment Variables**
```
NODE_ENV=production
```

### **🔧 Configuração Passo a Passo**

#### **No Dashboard do Render:**

1. **Acesse seu serviço** no dashboard
2. **Settings** → **Build & Deploy**
3. **Configure:**
   - **Build Command**: `bun install && bun run build:render`
   - **Publish Directory**: `./closetfesta`
   - **Node Version**: `22.16.0` (ou deixe padrão)

#### **Configurações Avançadas:**
- **Auto-Deploy**: `Yes`
- **Branch**: `main`
- **Root Directory**: `/` (raiz do projeto)

### **🎯 Soluções Implementadas**

#### **1. Script `postinstall` Automático**
```json
{
  "scripts": {
    "postinstall": "tsc && vite build"
  }
}
```
**Resultado**: Build executa automaticamente após `bun install`

#### **2. Vite configurado para output correto**
```typescript
build: {
  outDir: 'closetfesta',  // ← Diretório que o Render espera
  emptyOutDir: true
}
```

#### **3. Múltiplas opções de build**
- `npm run build` - Build padrão
- `npm run build:render` - Build específico para Render
- `npm run postinstall` - Build automático

### **🧪 Teste Local Confirmado**

```bash
✅ Build executado com sucesso
✅ Diretório closetfesta criado
✅ Arquivos gerados:
   - css/ (estilos)
   - js/ (JavaScript chunks)
   - index.html (página principal)
   - favicon.ico, robots.txt
```

### **🔄 Se o Problema Persistir**

#### **Opção 1: Forçar rebuild**
1. No dashboard do Render
2. **Manual Deploy** → **Deploy Latest Commit**

#### **Opção 2: Verificar logs**
1. **Dashboard** → **Logs**
2. Verificar se o comando de build está sendo executado

#### **Opção 3: Build Command alternativo**
```bash
npm ci && npm run build && ls -la closetfesta
```

### **📊 Debug Commands**

Para debug no Render, adicione ao Build Command:
```bash
bun install && 
echo "=== ANTES DO BUILD ===" && 
pwd && 
ls -la && 
bun run build:render && 
echo "=== DEPOIS DO BUILD ===" && 
ls -la closetfesta
```

## ✅ **Garantia de Funcionamento**

O build foi **testado localmente e funcionou perfeitamente**:
- ✅ Comando executa sem erros
- ✅ Diretório `closetfesta` é criado
- ✅ Arquivos são gerados corretamente
- ✅ Estrutura está completa

**O problema no Render é apenas de configuração do Build Command!**

### **🎯 Ação Necessária**

**Configure no dashboard do Render:**
```
Build Command: bun install && bun run build:render
Publish Directory: ./closetfesta
```

Com essa configuração, o deploy funcionará perfeitamente! 🚀
