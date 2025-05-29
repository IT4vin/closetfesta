import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001';

async function testApi() {
  console.log('🧪 Testando API do backend...\n');

  const tests = [
    { name: 'Health Check', url: '/health' },
    { name: 'API Health Check', url: '/api/health' },
    { name: 'Listar Categorias', url: '/api/categories' },
    { name: 'Listar Produtos', url: '/api/products' },
    { name: 'Catálogo Público', url: '/api/catalog/products' }
  ];

  let passed = 0;
  
  for (const test of tests) {
    try {
      console.log(`🔍 ${test.name}...`);
      const response = await fetch(`${API_BASE_URL}${test.url}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${test.name} - OK`);
        if (data.data && Array.isArray(data.data)) {
          console.log(`   📊 ${data.data.length} itens`);
        }
        passed++;
      } else {
        console.log(`❌ ${test.name} - HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - ${error.message}`);
    }
  }
  
  console.log(`\n📈 Resultado: ${passed}/${tests.length} testes passou`);
  
  if (passed === tests.length) {
    console.log('🎉 API funcionando perfeitamente!');
  } else {
    console.log('⚠️  Verifique se o backend está rodando na porta 3001');
  }
}

testApi(); 