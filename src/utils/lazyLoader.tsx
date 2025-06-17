import React, { Suspense, ComponentType } from 'react';
import LazyPageLoader from '@/components/common/LazyPageLoader';

interface LazyLoadOptions {
  fallbackTitle?: string;
  fallbackDescription?: string;
  retryCount?: number;
}

/**
 * Utilitário para criar componentes lazy-loaded com fallback personalizado
 */
export const createLazyPage = (
  importFn: () => Promise<{ default: ComponentType<any> }>,
  options: LazyLoadOptions = {}
) => {
  const LazyComponent = React.lazy(importFn);
  
  const WrappedComponent: React.FC<any> = (props) => (
    <Suspense 
      fallback={
        <LazyPageLoader 
          title={options.fallbackTitle}
          description={options.fallbackDescription}
        />
      }
    >
      <LazyComponent {...props} />
    </Suspense>
  );
  
  // Adicionar displayName para debugging
  WrappedComponent.displayName = `LazyPage(Component)`;
  
  return WrappedComponent;
};

/**
 * Preload de componentes para melhorar performance
 */
export const preloadPage = (importFn: () => Promise<{ default: ComponentType<any> }>) => {
  // Preload o componente em background
  importFn().catch(error => {
    console.warn('Falha ao precarregar página:', error);
  });
};

/**
 * Hook para preload de páginas baseado em interação do usuário
 */
export const usePagePreloader = () => {
  const preloadOnHover = (importFn: () => Promise<{ default: ComponentType<any> }>) => {
    return {
      onMouseEnter: () => preloadPage(importFn),
      onFocus: () => preloadPage(importFn),
    };
  };
  
  return { preloadOnHover };
};

/**
 * Configurações específicas para cada página
 */
export const pageConfigs = {
  dashboard: {
    fallbackTitle: "Carregando Dashboard...",
    fallbackDescription: "Preparando seus dados e métricas"
  },
  products: {
    fallbackTitle: "Carregando Produtos...",
    fallbackDescription: "Buscando catálogo de produtos"
  },
  clients: {
    fallbackTitle: "Carregando Clientes...",
    fallbackDescription: "Carregando informações dos clientes"
  },
  financial: {
    fallbackTitle: "Carregando Financeiro...",
    fallbackDescription: "Processando dados financeiros"
  },
  reports: {
    fallbackTitle: "Carregando Relatórios...",
    fallbackDescription: "Gerando relatórios e análises"
  },
  settings: {
    fallbackTitle: "Carregando Configurações...",
    fallbackDescription: "Preparando painel de configurações"
  },
  calendar: {
    fallbackTitle: "Carregando Agenda...",
    fallbackDescription: "Sincronizando eventos e compromissos"
  },
  inventory: {
    fallbackTitle: "Carregando Estoque...",
    fallbackDescription: "Atualizando informações de estoque"
  },
  pdv: {
    fallbackTitle: "Carregando PDV...",
    fallbackDescription: "Inicializando ponto de venda"
  },
  catalog: {
    fallbackTitle: "Carregando Catálogo...",
    fallbackDescription: "Preparando catálogo de produtos"
  }
}; 