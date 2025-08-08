# 🔧 Configuração do GitHub para CI/CD

## 📋 Pré-requisitos

Este documento explica como configurar as permissões necessárias para que o pipeline CI/CD funcione corretamente.

## 🔐 Configuração de Permissões

### 1. Permissões do GitHub Container Registry (GHCR)

Para resolver o erro `denied: installation not allowed to Create organization package`, siga estes passos:

#### Opção A: Configuração no Repositório
1. Vá para **Settings** do repositório
2. Navegue para **Actions** → **General**
3. Em **Workflow permissions**, selecione:
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**

#### Opção B: Configuração da Organização
1. Vá para **Organization Settings**
2. Navegue para **Packages**
3. Configure:
   - ✅ **Package creation**: Allow members to publish packages
   - ✅ **Package visibility**: Allow private packages

#### Opção C: Configuração Manual no GHCR
1. Acesse [GitHub Container Registry](https://github.com/features/packages)
2. Crie o package manualmente primeiro
3. Configure as permissões de acesso

### 2. Secrets Necessários

Configure os seguintes secrets no repositório (**Settings** → **Secrets and variables** → **Actions**):

#### Obrigatórios:
- `GITHUB_TOKEN` - ✅ Já configurado automaticamente pelo GitHub

#### Opcionais (para fallback):
- `DOCKERHUB_USERNAME` - Seu username do Docker Hub
- `DOCKERHUB_TOKEN` - Token de acesso do Docker Hub

### 3. Configuração do Docker Hub (Alternativa)

Se o GHCR não funcionar, você pode usar o Docker Hub:

1. Crie uma conta no [Docker Hub](https://hub.docker.com)
2. Gere um Access Token:
   - Profile → Account Settings → Security → New Access Token
3. Adicione os secrets no GitHub:
   - `DOCKERHUB_USERNAME`: seu username
   - `DOCKERHUB_TOKEN`: o token gerado

## 🐳 Comandos para Testar Localmente

```bash
# Build da imagem
docker build -t closetfesta-backend ./backend

# Executar localmente
docker run -p 3001:3001 closetfesta-backend

# Testar health check
curl http://localhost:3001/health
```

## 🔍 Troubleshooting

### Erro: "denied: installation not allowed to Create organization package"
**Solução**: Configure as permissões conforme descrito acima.

### Erro: "authentication required"
**Solução**: Verifique se o `GITHUB_TOKEN` tem as permissões corretas.

### Erro: "package already exists"
**Solução**: O package já existe. Configure as permissões de escrita.

### Build muito lento
**Solução**: O cache está funcionando. Builds subsequentes serão mais rápidos.

## 📊 Status do Pipeline

Após a configuração, você deve ver:
- ✅ Testes executando
- ✅ Build Docker funcionando
- ✅ Cache sendo utilizado
- ✅ Push para registry (GHCR ou Docker Hub)
- ✅ Scan de segurança

## 🔄 Próximos Passos

1. Configure deploy automático para staging/produção
2. Adicione notificações (Slack/Teams)
3. Configure rollback automático
4. Adicione métricas de performance

## 📞 Suporte

Se você ainda tiver problemas:
1. Verifique os logs do GitHub Actions
2. Confirme as permissões do repositório
3. Teste o build localmente primeiro
4. Verifique se todos os secrets estão configurados
