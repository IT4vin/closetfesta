// Service Worker para Closet Festa PWA
const CACHE_NAME = 'closet-festa-v1.0.0';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const API_CACHE = `${CACHE_NAME}-api`;

// Arquivos para cache estático (sempre em cache)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  // Adicione aqui outros assets estáticos importantes
];

// Estratégias de cache
const CACHE_STRATEGIES = {
  // Cache first para assets estáticos
  CACHE_FIRST: 'cache-first',
  // Network first para API
  NETWORK_FIRST: 'network-first',
  // Stale while revalidate para imagens
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Pré-cache de assets estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(error => {
        console.error('❌ Erro no pré-cache:', error);
      })
  );
  
  // Força ativação imediata
  self.skipWaiting();
});

// Atualizar Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker ativado');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName.startsWith('closet-festa-') && 
                     cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE &&
                     cacheName !== API_CACHE;
            })
            .map(cacheName => {
              console.log('🗑️ Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
  );
  
  // Assume controle imediato
  self.clients.claim();
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requisições não HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }

  // Estratégia baseada no tipo de requisição
  if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isImageRequest(url)) {
    event.respondWith(handleImageRequest(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Identifica requisições da API
function isAPIRequest(url) {
  return url.hostname === 'localhost' && 
         (url.port === '3001' || url.pathname.startsWith('/api/'));
}

// Identifica requisições de imagens
function isImageRequest(url) {
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
}

// Identifica assets estáticos
function isStaticAsset(url) {
  return url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/i) ||
         STATIC_ASSETS.includes(url.pathname);
}

// Gerencia requisições da API (Network First)
async function handleAPIRequest(request) {
  try {
    console.log('🌐 API Request:', request.url);
    
    // Tenta network primeiro
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Se sucesso, atualiza cache
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('📱 Usando cache da API para:', request.url);
    
    // Se falhar, tenta cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Se não tem cache, retorna resposta offline
    return new Response(JSON.stringify({
      success: false,
      message: 'Sem conexão. Dados indisponíveis offline.',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Gerencia requisições de imagens (Stale While Revalidate)
async function handleImageRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => {
      // Fallback para imagem placeholder se disponível
      return caches.match('/placeholder-product.jpg');
    });
  
  // Retorna cache imediatamente se disponível, senão aguarda network
  return cachedResponse || fetchPromise;
}

// Gerencia assets estáticos (Cache First)
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('❌ Asset não encontrado:', request.url);
    return new Response('Asset não encontrado', { status: 404 });
  }
}

// Gerencia outras requisições dinâmicas
async function handleDynamicRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Página offline para navegação
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    return new Response('Conteúdo indisponível offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Background Sync para pedidos offline
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-orders') {
    console.log('🔄 Sincronizando pedidos pendentes...');
    event.waitUntil(syncPendingOrders());
  }
});

// Sincroniza pedidos salvos offline
async function syncPendingOrders() {
  try {
    // Aqui você implementaria a lógica para enviar pedidos salvos offline
    // quando a conexão for restaurada
    console.log('✅ Sincronização de pedidos concluída');
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
  }
}

// Push notifications (futuro)
self.addEventListener('push', event => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      tag: 'closet-festa-notification'
    };
    
    event.waitUntil(
      self.registration.showNotification('Closet Festa', options)
    );
  }
});

// Clique em notificação
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('🚀 Service Worker do Closet Festa carregado'); 