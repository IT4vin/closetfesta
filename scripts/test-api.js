#!/usr/bin/env node

const API_BASE_URL = 'http://localhost:3001';

async function testApi() {
  console.log('🧪 Testando API do backend...\n');

  const tests = [
    {
      name: 'Health Check',
      url: '/health',
      method: 'GET'
    },
    {
      name: 'API Health Check',
      url: '/api/health',
      method: 'GET'
    },
    {
      name: 'Listar Categorias',
      url: '/api/categories',
      method: 'GET'
    },
    {
      name: 'Listar Produtos',
      url: '/api/products',
      method: 'GET'
    },
    {
      name: 'Catálogo Público',
      url: '/api/catalog/products',
      method: 'GET'
    },
    {
      name: 'Informações do Sistema',
      url: '/api/info',
      method: 'GET'
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`🔍 Testando: ${test.name}`);
      
      const response = await fetch(`${API_BASE_URL}${test.url}`, {
        method: test.method
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${test.name} - OK`);
        
        if (test.url === '/api/products' || test.url === '/api/categories') {
          console.log(`   📊 ${data.total || data.data?.length || 0} itens encontrados`);
        }
        
        passedTests++;
      } else {
        console.log(`❌ ${test.name} - HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Erro: ${error.message}`);
    }
    
    console.log(''); // Linha em branco
  }

  console.log('📈 Resumo dos Testes:');
  console.log(`✅ Passou: ${passedTests}/${totalTests}`);
  console.log(`❌ Falhou: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 Todos os testes passaram! API está funcionando corretamente.');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique se o backend está rodando na porta 3001.');
  }
}

// Executar apenas se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testApi().catch(console.error);
}

export default testApi; 