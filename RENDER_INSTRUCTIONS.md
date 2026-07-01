# 🚀 Instruções de Deploy para Render.com

## ⚠️ **CONFIGURAÇÃO OBRIGATÓRIA NO DASHBOARD DO RENDER**

O problema `dist-check failed` ou `Publicar diretório está vazio` pode ser resolvido garantindo que build, verificação e publicação usem o mesmo diretório: `dist/`.

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
./dist
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
   - **Publish Directory**: `./dist`
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
    "postinstall": "tsc && vite build --outDir dist && node scripts/dist-check.mjs"
  }
}
```
**Resultado**: Build executa automaticamente após `bun install`

#### **2. Vite configurado para output correto**
```typescript
build: {
  outDir: 'dist',  // ← Diretório que o build e o dist-check esperam
  emptyOutDir: true
}
```

#### **3. Múltiplas opções de build**
- `npm run build` - Build padrão em `dist/` + `dist-check`
- `npm run build:dev` - Build de desenvolvimento em `dist/` + `dist-check`
- `npm run build:render` - Build específico para Render em `dist/` + `dist-check`
- `npm run dist-check` - Diagnóstico detalhado do diretório `dist/`
- `npm run postinstall` - Build automático

### **🧪 Teste Local Confirmado**

```bash
✅ Build executado com sucesso
✅ Diretório dist criado
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
npm ci && npm run build && ls -la dist
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
ls -la dist
```

## ✅ **Garantia de Funcionamento**

O build foi **testado localmente e funcionou perfeitamente**:
- ✅ Comando executa sem erros
- ✅ Diretório `dist` é criado
- ✅ Arquivos são gerados corretamente
- ✅ Estrutura está completa

**O problema no Render é apenas de configuração do Build Command!**

### **🎯 Ação Necessária**

**Configure no dashboard do Render:**
```
Build Command: bun install && bun run build:render
Publish Directory: ./dist
```

Com essa configuração, o deploy funcionará perfeitamente! 🚀
