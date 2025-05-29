# 🧪 Guia de Teste - Integração Completa

## ✅ Passos para Testar a Integração

### 1. **Iniciando os Sistemas**
```bash
npm run dev:both
```
- ✅ Sistema Principal: http://localhost:8084 (ou próxima porta disponível)
- ✅ Showcase: http://localhost:8085 (ou próxima porta disponível)

### 2. **Teste do Sistema Principal**

1. **Acesse**: http://localhost:8084
2. **Vá para**: Aba "Catálogo" 
3. **Verifique**: 
   - A página carrega sem erro 404
   - Badge mostra "Sistema Principal: localhost:8084"
   - Badge mostra "Showcase: Porta 8085 ou 8080"
   - Botão "Catálogo Público" está visível

### 3. **Criando Produtos de Teste (se necessário)**

Se não houver produtos, você pode criar alguns pelo sistema principal:

1. **Vá para**: Aba "Produtos" (se disponível)
2. **Ou use o console do navegador**:
   ```javascript
   // Abra o console (F12) na página do sistema principal
   // Cole este código para criar produtos de teste:
   
   async function criarProdutosTeste() {
     const { supabase } = await import('./src/integrations/supabase/client.js');
     
     // Criar categoria
     const { data: categoria } = await supabase
       .from('product_categories')
       .insert({ name: 'Roupas Femininas', description: 'Categoria teste' })
       .select()
       .single();
     
     // Criar produtos
     const produtos = [
       { name: 'Vestido Elegante', description: 'Lindo vestido para festas', price: 150, quantity: 5, category_id: categoria.id },
       { name: 'Blusa Casual', description: 'Blusa confortável para o dia a dia', price: 80, quantity: 10, category_id: categoria.id },
       { name: 'Saia Midi', description: 'Saia moderna e versátil', price: 120, quantity: 3, category_id: categoria.id }
     ];
     
     for (const produto of produtos) {
       await supabase.from('products').insert(produto);
     }
     
     console.log('✅ Produtos criados com sucesso!');
   }
   
   criarProdutosTeste();
   ```

### 4. **Teste do Botão "Catálogo Público"**

1. **No sistema principal**, clique no botão **"Catálogo Público"**
2. **O que deve acontecer**:
   - Uma nova aba abre automaticamente
   - URL deve ser algo como: http://localhost:8085
   - A página do showcase carrega

### 5. **🆕 Verificando o Showcase Completo**

Na página do showcase que abriu:

#### **Interface Principal:**
1. **Título**: "Closet Festa - Catálogo" deve aparecer
2. **Descrição**: Mensagem de boas-vindas sobre WhatsApp
3. **Filtro**: Dropdown de categorias deve estar disponível
4. **Produtos**: Os produtos criados devem aparecer em grid responsivo

#### **🖼️ Sistema de Imagens:**
1. **Placeholder**: "Imagem em breve" se não houver imagem
2. **Carousel**: Navegação com setas se houver múltiplas imagens
3. **Indicadores**: Pontos na parte inferior para navegar
4. **Contador**: "X imagens" aparece abaixo do produto

#### **💬 Funcionalidades de Contato:**
1. **Botão WhatsApp por produto**: "Falar no WhatsApp" em cada card
2. **Favoritos**: Ícone de coração no canto superior direito
3. **Seção de contato**: Footer com links para WhatsApp Geral e Instagram
4. **Horário de funcionamento**: Exibido na seção de contato

#### **📱 Funcionalidades PWA:**
1. **Instalação**: Navegador pode sugerir "Adicionar à tela inicial"
2. **Ícones**: Favicon e ícones de PWA carregados
3. **Service Worker**: Console mostra "SW registrado com sucesso"
4. **Meta tags**: Compartilhamento otimizado para redes sociais

### 6. **🧪 Testando Funcionalidades Específicas**

#### **WhatsApp:**
1. **Clique** em "Falar no WhatsApp" em qualquer produto
2. **Verifica**: Abre WhatsApp Web/App com mensagem pré-formatada
3. **Mensagem inclui**: Nome do produto, preço, categoria
4. **Teste** também o "WhatsApp Geral" no footer

#### **Favoritos:**
1. **Clique** no ícone de coração em produtos diferentes
2. **Verifica**: Coração fica vermelho quando favoritado
3. **Contador** no debug mostra número de favoritos

#### **Responsividade:**
1. **Redimensione** a janela do navegador
2. **Verifica**: Grid se adapta (1→2→3→4 colunas)
3. **Mobile**: Teste em dispositivos móveis ou dev tools

#### **PWA (Chrome/Edge):**
1. **Abra** o menu do navegador (⋮)
2. **Procure**: "Instalar Closet Festa" ou "Adicionar à tela inicial"
3. **Instale**: Deve funcionar como app nativo
4. **Offline**: Teste desconectando a internet (cache básico)

### 7. **🔍 Dados Esperados em Cada Produto**

Cada card de produto deve mostrar:
- ✅ **Imagem**: Carousel funcional ou placeholder
- ✅ **Nome**: Título do produto em destaque
- ✅ **Categoria**: Badge azul com nome da categoria
- ✅ **Descrição**: Texto limitado a 2 linhas
- ✅ **Preço**: Formatado como "R$ XX,XX"
- ✅ **Tamanhos**: Lista de tamanhos disponíveis
- ✅ **Contador**: Número de imagens (se houver)
- ✅ **Favorito**: Ícone de coração funcional
- ✅ **WhatsApp**: Botão verde para contato

### 8. **📊 Verificações de Console**

#### **Sistema Principal:**
- Abra F12 → Console
- Deve mostrar:
  ```
  Abrindo showcase em: http://localhost:8085
  ```

#### **Showcase:**
- Abra F12 → Console  
- Deve mostrar:
  ```
  Produtos encontrados: 3
  Categorias encontradas: 1
  Produtos carregados: 3
  Produtos filtrados: 3
  SW registrado com sucesso: [ServiceWorkerRegistration]
  ```

### 9. **🔧 Configuração Personalizada**

Para personalizar o showcase:

1. **Edite**: `closet-festa-showcase/src/config/store.ts`
2. **Atualize**:
   - `contacts.whatsapp`: Seu número real
   - `contacts.instagram`: Seu Instagram
   - `name`: Nome da sua loja
   - `businessHours`: Seus horários reais

### 10. **📱 Teste de Compartilhamento**

1. **Copie** a URL do showcase
2. **Cole** no WhatsApp, Facebook, ou Twitter
3. **Verifica**: Preview com título, descrição e imagem
4. **Meta tags** devem aparecer corretamente

## ❌ Possíveis Problemas e Soluções

### 1. **Imagens não carregam**
- **Problema**: Placeholder sempre aparece
- **Verificar**: Console para erros de CORS ou 404
- **Solução**: Verificar URLs das imagens no banco

### 2. **WhatsApp não abre**
- **Problema**: Botão não funciona
- **Verificar**: Console para erros JavaScript
- **Solução**: Verificar formato do número no config

### 3. **PWA não instala**
- **Problema**: Navegador não oferece instalação
- **Verificar**: manifest.json carregado, HTTPS em produção
- **Solução**: Testar em Chrome/Edge, verificar console

### 4. **Service Worker falha**
- **Problema**: Cache não funciona
- **Verificar**: Console para erros do SW
- **Solução**: Recarregar página, verificar sw.js

## 🎯 Resultado Esperado

✅ **Sistema Principal**: Carrega corretamente, botão funciona
✅ **Showcase**: Abre automaticamente, design responsivo
✅ **Integração**: Produtos aparecem com imagens
✅ **WhatsApp**: Contato funciona por produto e geral
✅ **PWA**: Instalável, funciona offline (básico)
✅ **SEO**: Meta tags otimizadas para compartilhamento
✅ **UX**: Interface moderna, navegação fluida

---

**🚀 Se tudo funcionou**: A integração completa está funcionando!
**❌ Se algo falhou**: Siga as soluções específicas acima ou verifique os logs do console. 