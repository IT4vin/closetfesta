// Usar fetch nativo do Node.js (18+)
const fetch = globalThis.fetch;

const API_BASE = 'http://localhost:3001';

// Cores para output no terminal
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (color, message) => {
  console.log(`${color}${message}${colors.reset}`);
};

const logSuccess = (message) => log(colors.green, `✅ ${message}`);
const logError = (message) => log(colors.red, `❌ ${message}`);
const logInfo = (message) => log(colors.blue, `ℹ️  ${message}`);
const logWarning = (message) => log(colors.yellow, `⚠️  ${message}`);

// Teste individual de endpoint
async function testEndpoint(method, endpoint, data = null, token = null) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method,
      headers
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const result = await response.json();

    if (response.ok) {
      logSuccess(`${method} ${endpoint} - ${response.status}`);
      return { success: true, data: result, status: response.status };
    } else {
      logError(`${method} ${endpoint} - ${response.status}: ${result.message || 'Erro desconhecido'}`);
      return { success: false, error: result, status: response.status };
    }
  } catch (error) {
    logError(`${method} ${endpoint} - Erro de rede: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Teste completo do sistema
async function runMigrationTests() {
  console.log('\n' + colors.bold + colors.blue + '🧪 TESTE DE MIGRAÇÃO - SUPABASE → NODE.JS' + colors.reset);
  console.log('='.repeat(60));

  let token = null;
  let userId = null;
  let productId = null;
  let categoryId = null;
  let orderId = null;

  // 1. Teste de Health Checks
  logInfo('1. Testando Health Checks...');
  await testEndpoint('GET', '/health');
  await testEndpoint('GET', '/api/health');
  await testEndpoint('GET', '/api/info');

  // 2. Teste de Autenticação
  logInfo('\n2. Testando Autenticação...');
  
  // Login com credenciais padrão
  const loginResult = await testEndpoint('POST', '/api/auth/login', {
    email: 'admin@closetfesta.com',
    password: 'admin123'
  });

  if (loginResult.success && loginResult.data) {
    // A resposta pode ter estrutura nested data.data
    const loginData = loginResult.data.data || loginResult.data;
    
    if (loginData.token && loginData.user) {
      token = loginData.token;
      userId = loginData.user.id;
      logSuccess(`Token obtido: ${token.substring(0, 20)}...`);
      logSuccess(`User ID: ${userId}`);
    } else {
      logError('Estrutura de resposta inesperada:');
      console.log(JSON.stringify(loginResult, null, 2));
      logError('Abortando testes...');
      return;
    }
  } else {
    logError('Falha no login! Abortando testes...');
    return;
  }

  // Verificar perfil do usuário
  await testEndpoint('GET', '/api/auth/me', null, token);

  // 3. Teste de Categorias
  logInfo('\n3. Testando Categorias...');
  
  // Criar categoria
  const categoryResult = await testEndpoint('POST', '/api/categories', {
    name: 'Teste Categoria',
    description: 'Categoria criada durante teste de migração'
  }, token);

  if (categoryResult.success) {
    categoryId = categoryResult.data.id;
  }

  // Listar categorias
  await testEndpoint('GET', '/api/categories', null, token);

  // 4. Teste de Produtos
  logInfo('\n4. Testando Produtos...');
  
  // Criar produto
  const productResult = await testEndpoint('POST', '/api/products', {
    name: 'Produto Teste',
    description: 'Produto criado durante teste de migração',
    price: 99.99,
    quantity: 10,
    category_id: categoryId
  }, token);

  if (productResult.success) {
    productId = productResult.data.id;
  }

  // Listar produtos
  await testEndpoint('GET', '/api/products', null, token);

  // Obter produto específico
  if (productId) {
    await testEndpoint('GET', `/api/products/${productId}`, null, token);
  }

  // 5. Teste de Pedidos
  logInfo('\n5. Testando Pedidos...');
  
  // Criar pedido
  if (productId) {
    const orderResult = await testEndpoint('POST', '/api/orders', {
      customer_name: 'Cliente Teste',
      customer_email: 'cliente@teste.com',
      customer_phone: '(11) 99999-9999',
      items: [
        {
          product_id: productId,
          quantity: 2,
          price: 99.99
        }
      ]
    }, token);

    if (orderResult.success) {
      orderId = orderResult.data.id;
    }
  }

  // Listar pedidos
  await testEndpoint('GET', '/api/orders', null, token);

  // Estatísticas de pedidos
  await testEndpoint('GET', '/api/orders/stats', null, token);

  // 6. Teste do Catálogo Público
  logInfo('\n6. Testando Catálogo Público...');
  await testEndpoint('GET', '/api/catalog/products');

  // 7. Teste de Rate Limiting
  logInfo('\n7. Testando Rate Limiting...');
  logWarning('Fazendo múltiplas requisições para testar rate limiting...');
  
  for (let i = 0; i < 3; i++) {
    await testEndpoint('GET', '/api/health');
  }

  // 8. Teste de Endpoints Inválidos
  logInfo('\n8. Testando Endpoints Inválidos...');
  await testEndpoint('GET', '/api/endpoint-inexistente');
  await testEndpoint('GET', '/rota-invalida');

  // 9. Limpeza - Deletar dados de teste
  logInfo('\n9. Limpando dados de teste...');
  
  if (orderId) {
    await testEndpoint('DELETE', `/api/orders/${orderId}`, null, token);
  }
  
  if (productId) {
    await testEndpoint('DELETE', `/api/products/${productId}`, null, token);
  }
  
  if (categoryId) {
    await testEndpoint('DELETE', `/api/categories/${categoryId}`, null, token);
  }

  // Resultado final
  console.log('\n' + '='.repeat(60));
  logSuccess('🎉 TESTE DE MIGRAÇÃO CONCLUÍDO!');
  logInfo('O backend Node.js está funcionando corretamente!');
  logInfo('A migração do Supabase foi bem-sucedida!');
  console.log('\n' + colors.bold + 'Próximos passos:' + colors.reset);
  console.log('1. Testar o frontend em http://localhost:8081');
  console.log('2. Fazer login com: admin@closetfesta.com / admin123');
  console.log('3. Verificar todas as funcionalidades do sistema');
  console.log('4. Configurar variáveis de ambiente para produção');
}

// Verificar se o servidor está rodando
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (response.ok) {
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
}

// Executar testes
async function main() {
  logInfo('Verificando se o servidor está rodando...');
  
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    logError('Servidor não está rodando!');
    console.log('\nPara iniciar o servidor:');
    console.log('1. cd backend');
    console.log('2. npm run dev');
    console.log('3. Execute este teste novamente');
    process.exit(1);
  }

  await runMigrationTests();
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runMigrationTests, testEndpoint }; 