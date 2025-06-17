import { createLazyPage, pageConfigs } from '@/utils/lazyLoader';

// Lazy loading de todas as páginas principais
export const LazyIndex = createLazyPage(
  () => import('../Index'),
  pageConfigs.dashboard
);

export const LazyCalendar = createLazyPage(
  () => import('../Calendar'),
  pageConfigs.calendar
);

export const LazyProducts = createLazyPage(
  () => import('../Products'),
  pageConfigs.products
);

export const LazyProductDetail = createLazyPage(
  () => import('../ProductDetail'),
  pageConfigs.products
);

export const LazyClients = createLazyPage(
  () => import('../Clients'),
  pageConfigs.clients
);

export const LazyClientDetail = createLazyPage(
  () => import('../ClientDetail'),
  pageConfigs.clients
);

export const LazyFinancial = createLazyPage(
  () => import('../Financial'),
  pageConfigs.financial
);

export const LazyInventory = createLazyPage(
  () => import('../Inventory'),
  pageConfigs.inventory
);

export const LazyPDV = createLazyPage(
  () => import('../PDV'),
  pageConfigs.pdv
);

export const LazyReports = createLazyPage(
  () => import('../Reports'),
  pageConfigs.reports
);

export const LazySettings = createLazyPage(
  () => import('../Settings'),
  pageConfigs.settings
);

export const LazyCatalog = createLazyPage(
  () => import('../Catalog'),
  pageConfigs.catalog
);

// Páginas que não precisam de lazy loading (muito pequenas ou críticas)
export { default as Login } from '../Login';
export { default as NotFound } from '../NotFound'; 