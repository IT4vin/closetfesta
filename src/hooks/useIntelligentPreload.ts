import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

// Mapeamento de páginas relacionadas para preload inteligente
const relatedPages: Record<string, string[]> = {
  '/': ['products', 'clients', 'calendar'],
  '/products': ['inventory', 'catalog', 'clients'],
  '/clients': ['products', 'calendar', 'financial'],
  '/calendar': ['clients', 'products'],
  '/financial': ['clients', 'reports'],
  '/inventory': ['products', 'catalog'],
  '/pdv': ['products', 'clients', 'inventory'],
  '/reports': ['financial', 'products', 'clients'],
  '/settings': []
};

// Funções de import das páginas
const pageImports: Record<string, () => Promise<any>> = {
  'products': () => import('../pages/Products'),
  'clients': () => import('../pages/Clients'),
  'calendar': () => import('../pages/Calendar'),
  'financial': () => import('../pages/Financial'),
  'inventory': () => import('../pages/Inventory'),
  'catalog': () => import('../pages/Catalog'),
  'pdv': () => import('../pages/PDV'),
  'reports': () => import('../pages/Reports'),
  'settings': () => import('../pages/Settings')
};

export const useIntelligentPreload = () => {
  const location = useLocation();

  // Preload de páginas relacionadas
  const preloadRelatedPages = useCallback((currentPath: string) => {
    const related = relatedPages[currentPath] || [];
    
    related.forEach(pageName => {
      const importFn = pageImports[pageName];
      if (importFn) {
        // Delay para não impactar a performance da página atual
        setTimeout(() => {
          importFn().catch(error => {
            console.warn(`Falha ao precarregar página ${pageName}:`, error);
          });
        }, 1000);
      }
    });
  }, []);

  // Preload baseado em idle time
  const preloadOnIdle = useCallback(() => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        preloadRelatedPages(location.pathname);
      });
    } else {
      // Fallback para navegadores sem suporte
      setTimeout(() => {
        preloadRelatedPages(location.pathname);
      }, 2000);
    }
  }, [location.pathname, preloadRelatedPages]);

  // Preload baseado em conexão
  const shouldPreload = useCallback(() => {
    // Verificar se a conexão é boa o suficiente para preload
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      // Não precarregar em conexões lentas ou limitadas
      if (connection.saveData || 
          connection.effectiveType === 'slow-2g' || 
          connection.effectiveType === '2g') {
        return false;
      }
    }
    
    return true;
  }, []);

  // Preload baseado em interação do usuário
  const preloadOnHover = useCallback((pageName: string) => {
    return {
      onMouseEnter: () => {
        if (shouldPreload()) {
          const importFn = pageImports[pageName];
          if (importFn) {
            importFn().catch(error => {
              console.warn(`Falha ao precarregar página ${pageName} no hover:`, error);
            });
          }
        }
      }
    };
  }, [shouldPreload]);

  // Preload baseado em foco
  const preloadOnFocus = useCallback((pageName: string) => {
    return {
      onFocus: () => {
        if (shouldPreload()) {
          const importFn = pageImports[pageName];
          if (importFn) {
            importFn().catch(error => {
              console.warn(`Falha ao precarregar página ${pageName} no focus:`, error);
            });
          }
        }
      }
    };
  }, [shouldPreload]);

  // Executar preload quando a rota mudar
  useEffect(() => {
    if (shouldPreload()) {
      preloadOnIdle();
    }
  }, [location.pathname, shouldPreload, preloadOnIdle]);

  return {
    preloadOnHover,
    preloadOnFocus,
    preloadRelatedPages
  };
}; 