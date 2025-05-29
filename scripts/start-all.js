#!/usr/bin/env node

import { spawn } from 'child_process';
import fetch from 'node-fetch';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkApiHealth(url, name) {
  return new Promise((resolve) => {
    fetch(url)
      .then(response => {
        if (response.ok) {
          resolve({ name, status: 'OK', url });
        } else {
          resolve({ name, status: `HTTP ${response.status}`, url });
        }
      })
      .catch(error => {
        resolve({ name, status: 'Offline', url, error: error.message });
      });
  });
}

async function showSystemStatus() {
  log('\n🔍 Verificando status do sistema...', 'cyan');
  
  const services = [
    { name: 'Backend API', url: 'http://localhost:3001/health' },
    { name: 'Frontend Admin', url: 'http://localhost:8090' },
    { name: 'Showcase', url: 'http://localhost:8085' }
  ];

  const results = await Promise.all(
    services.map(service => checkApiHealth(service.url, service.name))
  );

  log('\n📊 Status dos Serviços:', 'bright');
  results.forEach(result => {
    const statusColor = result.status === 'OK' ? 'green' : 'red';
    log(`  ${result.name}: ${result.status}`, statusColor);
    if (result.status === 'OK') {
      log(`    🌐 ${result.url}`, 'blue');
    }
  });

  const allRunning = results.every(r => r.status === 'OK');
  
  if (allRunning) {
    log('\n🎉 Todos os serviços estão funcionando!', 'green');
    log('\n📋 Links Úteis:', 'bright');
    log('   🔧 Admin: http://localhost:8090', 'blue');
    log('   🛍️  Catálogo: http://localhost:8085', 'blue');
    log('   📡 API: http://localhost:3001/api', 'blue');
  } else {
    log('\n⚠️  Alguns serviços não estão respondendo', 'yellow');
    log('   Execute: npm run dev:all', 'cyan');
  }
}

function displayWelcomeMessage() {
  log('🚀 CLOSET FESTA - SISTEMA COMPLETO', 'magenta');
  log('=====================================', 'magenta');
  log('Backend Node.js + Frontend React + Showcase', 'cyan');
  log('✅ Migração do Supabase concluída com sucesso!\n', 'green');
}

function displayInstructions() {
  log('\n📚 Como usar:', 'bright');
  log('  • npm run dev:all     - Inicia todos os serviços', 'cyan');
  log('  • npm run dev:backend - Apenas o backend', 'cyan');
  log('  • npm run dev         - Apenas o frontend admin', 'cyan');
  log('  • npm run dev:showcase - Apenas o catálogo', 'cyan');
  log('  • node scripts/test-api.mjs - Testar API', 'cyan');

  log('\n🗃️  Banco de dados:', 'bright');
  log('  • npm run backend:migrate - Executar migrações', 'cyan');
  log('  • npm run backend:seed    - Popular com dados', 'cyan');
  log('  • npm run backend:reset   - Resetar banco', 'cyan');

  log('\n📁 Estrutura:', 'bright');
  log('  • backend/           - API Node.js + SQLite', 'cyan');
  log('  • src/               - Frontend Admin (React)', 'cyan');
  log('  • closet-festa-showcase/ - Catálogo público', 'cyan');
}

async function main() {
  displayWelcomeMessage();
  await showSystemStatus();
  displayInstructions();

  log('\n💡 Dica: Execute "npm run dev:all" para iniciar tudo!', 'yellow');
}

main().catch(console.error); 