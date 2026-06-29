import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Tipos para configuração de testes
export interface TestConfig {
  withRouter?: boolean;
  withQueryClient?: boolean;
  initialRoute?: string;
  queryClientOptions?: any;
}

export interface MockApiResponse {
  data?: any;
  error?: any;
  status?: number;
  delay?: number;
}

export interface PerformanceMetrics {
  renderTime: number;
  reRenderCount: number;
  memoryUsage: number;
}

// Provider customizado para testes
interface AllTheProvidersProps {
  children: ReactNode;
  config?: TestConfig;
}

const AllTheProviders = ({ children, config = {} }: AllTheProvidersProps) => {
  const {
    withRouter = true,
    withQueryClient = true,
    initialRoute = '/',
    queryClientOptions = {}
  } = config;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    ...queryClientOptions,
  });

  let component: ReactNode = children;

  if (withQueryClient) {
    component = (
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  }

  if (withRouter) {
    if (initialRoute !== '/') {
      window.history.pushState({}, 'Test page', initialRoute);
    }
    
    component = (
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  }

  return component as ReactElement;
};

// Render customizado com providers
export const renderWithProviders = (
  ui: ReactElement,
  options: RenderOptions & { config?: TestConfig } = {}
) => {
  const { config, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders config={config}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Utilitários para dados de teste
export class TestDataFactory {
  static createUser(overrides: Partial<any> = {}) {
    return {
      id: Math.floor(Math.random() * 1000),
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      created_at: new Date().toISOString(),
      ...overrides,
    };
  }

  static createProduct(overrides: Partial<any> = {}) {
    return {
      id: Math.floor(Math.random() * 1000),
      name: 'Test Product',
      description: 'Test product description',
      price: 99.99,
      category: 'Test Category',
      in_stock: true,
      created_at: new Date().toISOString(),
      ...overrides,
    };
  }

  static createOrder(overrides: Partial<any> = {}) {
    return {
      id: Math.floor(Math.random() * 1000),
      customer_name: 'Test Customer',
      customer_email: 'customer@example.com',
      status: 'pending',
      total: 199.98,
      items: [
        this.createProduct({ quantity: 2 })
      ],
      created_at: new Date().toISOString(),
      ...overrides,
    };
  }

  static createBulkData<T>(factory: () => T, count: number): T[] {
    return Array.from({ length: count }, factory);
  }
}

// Re-exportar testing library utilities
export * from '@testing-library/react';
export { vi } from 'vitest'; 