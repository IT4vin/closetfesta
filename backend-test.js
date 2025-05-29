const http = require('http');

function testBackend(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (err) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function main() {
  console.log('🔍 Testando backend...\n');
  
  const tests = [
    { name: 'Health Check', url: 'http://localhost:3001/health' },
    { name: 'API Health', url: 'http://localhost:3001/api/health' },
    { name: 'Categorias', url: 'http://localhost:3001/api/categories' },
    { name: 'Produtos', url: 'http://localhost:3001/api/products' },
    { name: 'Catálogo', url: 'http://localhost:3001/api/catalog/products' }
  ];
  
  for (const test of tests) {
    try {
      process.stdout.write(`${test.name}: `);
      const result = await testBackend(test.url);
      if (result.status === 200) {
        console.log(`✅ OK (${result.status})`);
        if (result.data.success !== undefined) {
          console.log(`   Success: ${result.data.success}, Total: ${result.data.total || 'N/A'}`);
        }
      } else {
        console.log(`❌ Erro ${result.status}`);
      }
    } catch (err) {
      console.log(`❌ ${err.message}`);
    }
  }
}

main().catch(console.error); 