#!/usr/bin/env node

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

class APITester {
  constructor() {
    this.token = null;
    this.userId = null;
    this.orderId = null;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();
      return { response, data };
    } catch (error) {
      console.error(`❌ Erro na requisição ${endpoint}:`, error.message);
      return { error };
    }
  }

  async testHealthCheck() {
    console.log('\n🔍 Testando Health Check...');
    
    const { response, data, error } = await this.request('/health', { method: 'GET' });
    
    if (error) {
      console.log('❌ Backend não está rodando');
      return false;
    }

    if (response.ok) {
      console.log('✅ Backend está funcionando');
      return true;
    }

    console.log('❌ Health check falhou');
    return false;
  }

  async testAuthentication() {
    console.log('\n🔐 Testando Autenticação...');

    // Teste de login com usuário existente
    const loginData = {
      email: 'admin@closetfesta.com',
      password: 'admin123'
    };

    const { response, data } = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData)
    });

    if (response.ok && data.success) {
      console.log('✅ Login realizado com sucesso');
      this.token = data.data.token;
      this.userId = data.data.user.id;
      console.log(`   Token: ${this.token.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ Falha no login:', data.message);
      return false;
    }
  }

  async testTokenValidation() {
    console.log('\n🎫 Testando Validação de Token...');

    const { response, data } = await this.request('/auth/me', {
      method: 'GET'
    });

    if (response.ok && data.success) {
      console.log('✅ Token válido');
      console.log(`   Usuário: ${data.data.name} (${data.data.email})`);
      return true;
    } else {
      console.log('❌ Token inválido:', data.message);
      return false;
    }
  }

  async testOrderCreation() {
    console.log('\n📦 Testando Criação de Pedido...');

    // Primeiro, vamos buscar um produto para usar no pedido
    const { response: prodResponse, data: prodData } = await this.request('/products?limit=1');
    
    if (!prodResponse.ok || !prodData.success || prodData.data.length === 0) {
      console.log('❌ Nenhum produto encontrado para criar pedido');
      return false;
    }

    const product = prodData.data[0];
    console.log(`   Usando produto: ${product.name}`);

    const orderData = {
      customer_name: 'Maria Silva',
      customer_email: 'maria@teste.com',
      customer_phone: '11999999999',
      customer_address: 'Rua das Flores, 123',
      order_type: 'rental',
      rental_start_date: '2024-12-20T00:00:00.000Z',
      rental_end_date: '2024-12-22T00:00:00.000Z',
      notes: 'Pedido de teste',
      items: [
        {
          product_id: product.id,
          quantity: 1,
          size: 'M',
          unit_price: product.price || 100
        }
      ]
    };

    const { response, data } = await this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });

    if (response.ok && data.success) {
      console.log('✅ Pedido criado com sucesso');
      this.orderId = data.data.id;
      console.log(`   ID do Pedido: ${this.orderId}`);
      console.log(`   Total: R$ ${data.data.total}`);
      return true;
    } else {
      console.log('❌ Falha ao criar pedido:', data.message);
      return false;
    }
  }

  async testOrderStatusUpdate() {
    console.log('\n🔄 Testando Atualização de Status...');

    if (!this.orderId) {
      console.log('❌ Nenhum pedido disponível para atualizar');
      return false;
    }

    const statusData = {
      status: 'confirmed'
    };

    const { response, data } = await this.request(`/orders/${this.orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData)
    });

    if (response.ok && data.success) {
      console.log('✅ Status atualizado com sucesso');
      console.log(`   Novo status: ${data.data.status}`);
      return true;
    } else {
      console.log('❌ Falha ao atualizar status:', data.message);
      return false;
    }
  }

  async testAvailabilityCheck() {
    console.log('\n📅 Testando Verificação de Disponibilidade...');

    // Buscar um produto para testar
    const { response: prodResponse, data: prodData } = await this.request('/products?limit=1');
    
    if (!prodResponse.ok || !prodData.success || prodData.data.length === 0) {
      console.log('❌ Nenhum produto encontrado');
      return false;
    }

    const product = prodData.data[0];

    const availabilityData = {
      items: [
        {
          product_id: product.id,
          quantity: 1
        }
      ],
      rental_start_date: '2024-12-25T00:00:00.000Z',
      rental_end_date: '2024-12-27T00:00:00.000Z'
    };

    const { response, data } = await this.request('/orders/check-availability', {
      method: 'POST',
      body: JSON.stringify(availabilityData)
    });

    if (response.ok && data.success) {
      console.log('✅ Verificação de disponibilidade funcionando');
      console.log(`   Produto disponível: ${data.data.available}`);
      return true;
    } else {
      console.log('❌ Falha na verificação:', data.message);
      return false;
    }
  }

  async testOrderStatistics() {
    console.log('\n📊 Testando Estatísticas de Pedidos...');

    const { response, data } = await this.request('/orders/stats');

    if (response.ok && data.success) {
      console.log('✅ Estatísticas funcionando');
      console.log(`   Total de pedidos: ${data.data.total_orders}`);
      console.log(`   Pedidos de aluguel: ${data.data.rental_orders}`);
      console.log(`   Receita total: R$ ${data.data.total_revenue || 0}`);
      return true;
    } else {
      console.log('❌ Falha nas estatísticas:', data.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Iniciando testes das novas funcionalidades...\n');

    const results = [];

    results.push(await this.testHealthCheck());
    
    if (results[0]) {
      results.push(await this.testAuthentication());
      
      if (results[1]) {
        results.push(await this.testTokenValidation());
        results.push(await this.testOrderCreation());
        
        if (results[3]) {
          results.push(await this.testOrderStatusUpdate());
        }
        
        results.push(await this.testAvailabilityCheck());
        results.push(await this.testOrderStatistics());
      }
    }

    const passed = results.filter(Boolean).length;
    const total = results.length;

    console.log('\n' + '='.repeat(50));
    console.log(`📋 Resultado dos Testes: ${passed}/${total} passaram`);
    
    if (passed === total) {
      console.log('🎉 Todas as novas funcionalidades estão funcionando!');
    } else {
      console.log('⚠️  Algumas funcionalidades precisam de correção');
    }
    
    return passed === total;
  }
}

// Executar testes
const tester = new APITester();
tester.runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Erro nos testes:', error);
    process.exit(1);
  }); 