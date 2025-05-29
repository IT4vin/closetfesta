const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${json.message || responseData}`));
          }
        } catch (err) {
          reject(new Error(`Parse error: ${err.message}`));
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function seedData() {
  console.log('🌱 Populando banco com dados de exemplo...\n');

  try {
    // Criar categorias
    const categories = [
      { name: 'Vestidos de Festa', description: 'Vestidos elegantes para ocasiões especiais' },
      { name: 'Vestidos de Casamento', description: 'Vestidos para cerimônias de casamento' },
      { name: 'Roupas Masculinas', description: 'Ternos e roupas formais masculinas' },
      { name: 'Acessórios', description: 'Bolsas, sapatos e acessórios diversos' },
      { name: 'Infantil', description: 'Roupas especiais para crianças' }
    ];

    const createdCategories = [];
    for (const category of categories) {
      try {
        const result = await makeRequest('POST', '/categories', category);
        createdCategories.push(result.data);
        console.log(`✅ Categoria criada: ${category.name}`);
      } catch (error) {
        console.log(`⚠️  Categoria ${category.name}: ${error.message}`);
      }
    }

    // Criar produtos
    if (createdCategories.length > 0) {
      const products = [
        {
          name: 'Vestido Longo Bordado',
          description: 'Vestido longo com bordados delicados, ideal para festas elegantes',
          price: 250.00,
          quantity: 2,
          category_id: createdCategories[0].id,
          sizes: 'P, M, G',
          featured: true
        },
        {
          name: 'Vestido de Noiva Clássico',
          description: 'Vestido de noiva em seda com cauda, design clássico e atemporal',
          price: 800.00,
          quantity: 1,
          category_id: createdCategories[1].id,
          sizes: 'M',
          featured: true
        },
        {
          name: 'Terno Social Completo',
          description: 'Terno social masculino completo com gravata e sapatos',
          price: 180.00,
          quantity: 3,
          category_id: createdCategories[2].id,
          sizes: 'M, G, GG',
          featured: false
        },
        {
          name: 'Bolsa de Festa Dourada',
          description: 'Bolsa pequena dourada com corrente, perfeita para ocasiões especiais',
          price: 45.00,
          quantity: 5,
          category_id: createdCategories[3].id,
          sizes: 'único',
          featured: false
        },
        {
          name: 'Vestido Infantil Princesa',
          description: 'Vestido infantil estilo princesa com tule e brilhos',
          price: 120.00,
          quantity: 3,
          category_id: createdCategories[4].id,
          sizes: '4, 6, 8, 10',
          featured: true
        },
        {
          name: 'Vestido de Madrinha',
          description: 'Vestido midi ideal para madrinhas de casamento',
          price: 200.00,
          quantity: 2,
          category_id: createdCategories[0].id,
          sizes: 'P, M, G',
          featured: false
        }
      ];

      for (const product of products) {
        try {
          const result = await makeRequest('POST', '/products', product);
          console.log(`✅ Produto criado: ${product.name} (R$ ${product.price})`);
        } catch (error) {
          console.log(`⚠️  Produto ${product.name}: ${error.message}`);
        }
      }
    }

    console.log('\n🎉 Dados de exemplo criados com sucesso!');
    console.log('📊 Agora você pode acessar o frontend e ver os dados.');
    
  } catch (error) {
    console.error('❌ Erro ao popular banco:', error);
  }
}

seedData(); 