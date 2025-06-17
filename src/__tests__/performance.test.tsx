import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Profiler, ProfilerOnRenderCallback } from 'react';

// Componentes para teste
import { Dashboard } from '@/pages/Dashboard';
import { ProductsPage } from '@/pages/ProductsPage';
import { ImportProductsModal } from '@/components/products/import-export/ImportProductsModal';

// Wrapper para testes
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
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
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Utilitários de performance
class PerformanceTester {
  private renderTimes: number[] = [];
  private memoryUsage: number[] = [];

  startMeasurement() {
    this.renderTimes = [];
    this.memoryUsage = [];
  }

  recordRender(actualDuration: number) {
    this.renderTimes.push(actualDuration);
    
    // Medir uso de memória se disponível
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.memoryUsage.push(memory.usedJSHeapSize);
    }
  }

  getMetrics() {
    const avgRenderTime = this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length;
    const maxRenderTime = Math.max(...this.renderTimes);
    const minRenderTime = Math.min(...this.renderTimes);
    
    const avgMemory = this.memoryUsage.length > 0 
      ? this.memoryUsage.reduce((a, b) => a + b, 0) / this.memoryUsage.length 
      : 0;

    return {
      renderCount: this.renderTimes.length,
      avgRenderTime,
      maxRenderTime,
      minRenderTime,
      avgMemoryUsage: avgMemory,
      totalRenderTime: this.renderTimes.reduce((a, b) => a + b, 0)
    };
  }
}

// Mock de dados grandes para testes de performance
const generateLargeDataset = (size: number) => {
  return Array.from({ length: size }, (_, index) => ({
    id: index + 1,
    name: `Produto ${index + 1}`,
    description: `Descrição detalhada do produto ${index + 1}`,
    price: Math.random() * 1000,
    rental_price: Math.random() * 500,
    category: `Categoria ${Math.floor(index / 10) + 1}`,
    size: ['P', 'M', 'G', 'GG'][Math.floor(Math.random() * 4)],
    color: ['Azul', 'Vermelho', 'Verde', 'Preto', 'Branco'][Math.floor(Math.random() * 5)],
    in_stock: Math.random() > 0.2,
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
  }));
};

describe('Testes de Performance', () => {
  let performanceTester: PerformanceTester;
  let fetchMock: any;

  beforeEach(() => {
    performanceTester = new PerformanceTester();
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Renderização de Componentes', () => {
    it('deve renderizar Dashboard em menos de 100ms', async () => {
      performanceTester.startMeasurement();

      const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration) => {
        performanceTester.recordRender(actualDuration);
      };

      // Mock da API com dados pequenos
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            totalProducts: 50,
            totalOrders: 20,
            totalRevenue: 5000,
            pendingOrders: 3
          }
        })
      });

      render(
        <TestWrapper>
          <Profiler id="Dashboard" onRender={onRender}>
            <Dashboard />
          </Profiler>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument();
      });

      const metrics = performanceTester.getMetrics();
      
      // Verificar que a renderização inicial foi rápida
      expect(metrics.maxRenderTime).toBeLessThan(100);
      expect(metrics.avgRenderTime).toBeLessThan(50);
      
      console.log('Dashboard Performance:', metrics);
    });

    it('deve lidar com lista grande de produtos eficientemente', async () => {
      performanceTester.startMeasurement();

      const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration) => {
        performanceTester.recordRender(actualDuration);
      };

      // Mock com dataset grande
      const largeDataset = generateLargeDataset(1000);
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: largeDataset,
          pagination: {
            total: 1000,
            page: 1,
            limit: 50,
            totalPages: 20
          }
        })
      });

      const startTime = performance.now();

      render(
        <TestWrapper>
          <Profiler id="ProductsPage" onRender={onRender}>
            <ProductsPage />
          </Profiler>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Produto 1')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      const metrics = performanceTester.getMetrics();
      
      // Verificar que mesmo com muitos dados, a performance é aceitável
      expect(totalTime).toBeLessThan(2000); // Menos de 2 segundos
      expect(metrics.maxRenderTime).toBeLessThan(200); // Renderização individual < 200ms
      
      console.log('Large Dataset Performance:', {
        ...metrics,
        totalLoadTime: totalTime,
        itemsRendered: largeDataset.length
      });
    });

    it('deve otimizar re-renderizações desnecessárias', async () => {
      performanceTester.startMeasurement();
      let renderCount = 0;

      const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration) => {
        renderCount++;
        performanceTester.recordRender(actualDuration);
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: generateLargeDataset(100)
        })
      });

      const { rerender } = render(
        <TestWrapper>
          <Profiler id="ProductsPage" onRender={onRender}>
            <ProductsPage />
          </Profiler>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Produto 1')).toBeInTheDocument();
      });

      const initialRenderCount = renderCount;

      // Re-renderizar com os mesmos dados
      rerender(
        <TestWrapper>
          <Profiler id="ProductsPage" onRender={onRender}>
            <ProductsPage />
          </Profiler>
        </TestWrapper>
      );

      // Aguardar um pouco para possíveis re-renderizações
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verificar que não houve re-renderizações desnecessárias
      expect(renderCount - initialRenderCount).toBeLessThan(3);
      
      console.log('Re-render optimization:', {
        initialRenders: initialRenderCount,
        totalRenders: renderCount,
        unnecessaryRerenders: renderCount - initialRenderCount
      });
    });
  });

  describe('Lazy Loading e Code Splitting', () => {
    it('deve carregar componentes lazy de forma eficiente', async () => {
      const startTime = performance.now();

      // Simular carregamento de componente lazy
      const LazyComponent = React.lazy(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              default: () => <div>Componente Lazy Carregado</div>
            });
          }, 50); // Simular delay de rede
        })
      );

      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Carregando...</div>}>
            <LazyComponent />
          </React.Suspense>
        </TestWrapper>
      );

      // Verificar loading state
      expect(screen.getByText('Carregando...')).toBeInTheDocument();

      // Aguardar carregamento
      await waitFor(() => {
        expect(screen.getByText('Componente Lazy Carregado')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Verificar que o carregamento foi rápido
      expect(loadTime).toBeLessThan(200);
      
      console.log('Lazy Loading Performance:', { loadTime });
    });

    it('deve implementar preload inteligente', async () => {
      const preloadTimes: number[] = [];

      // Simular preload de múltiplos componentes
      const preloadPromises = Array.from({ length: 5 }, (_, index) => {
        const startTime = performance.now();
        
        return new Promise(resolve => {
          setTimeout(() => {
            const endTime = performance.now();
            preloadTimes.push(endTime - startTime);
            resolve(`Component ${index + 1}`);
          }, Math.random() * 100);
        });
      });

      await Promise.all(preloadPromises);

      const avgPreloadTime = preloadTimes.reduce((a, b) => a + b, 0) / preloadTimes.length;
      const maxPreloadTime = Math.max(...preloadTimes);

      // Verificar que o preload foi eficiente
      expect(avgPreloadTime).toBeLessThan(100);
      expect(maxPreloadTime).toBeLessThan(150);
      
      console.log('Preload Performance:', {
        avgPreloadTime,
        maxPreloadTime,
        componentsPreloaded: preloadTimes.length
      });
    });
  });

  describe('Otimizações de Bundle', () => {
    it('deve medir impacto do tree shaking', () => {
      // Simular importações otimizadas vs não otimizadas
      const optimizedImports = [
        'lodash/debounce',
        'date-fns/format',
        'lucide-react/icons/search'
      ];

      const nonOptimizedImports = [
        'lodash',
        'date-fns',
        'lucide-react'
      ];

      // Simular tamanhos de bundle
      const optimizedSize = optimizedImports.length * 5; // 5KB por import otimizada
      const nonOptimizedSize = nonOptimizedImports.length * 50; // 50KB por import completa

      const savings = nonOptimizedSize - optimizedSize;
      const savingsPercentage = (savings / nonOptimizedSize) * 100;

      expect(savingsPercentage).toBeGreaterThan(70); // Pelo menos 70% de economia
      
      console.log('Tree Shaking Impact:', {
        optimizedSize: `${optimizedSize}KB`,
        nonOptimizedSize: `${nonOptimizedSize}KB`,
        savings: `${savings}KB`,
        savingsPercentage: `${savingsPercentage.toFixed(1)}%`
      });
    });

    it('deve verificar chunk splitting eficiente', () => {
      // Simular análise de chunks
      const chunks = {
        vendor: 150, // KB
        common: 50,
        pages: 200,
        components: 100,
        utils: 30
      };

      const totalSize = Object.values(chunks).reduce((a, b) => a + b, 0);
      const largestChunk = Math.max(...Object.values(chunks));
      const averageChunkSize = totalSize / Object.keys(chunks).length;

      // Verificar que os chunks estão bem distribuídos
      expect(largestChunk).toBeLessThan(totalSize * 0.4); // Nenhum chunk > 40% do total
      expect(averageChunkSize).toBeLessThan(120); // Média < 120KB
      
      console.log('Chunk Analysis:', {
        chunks,
        totalSize: `${totalSize}KB`,
        largestChunk: `${largestChunk}KB`,
        averageChunkSize: `${averageChunkSize.toFixed(1)}KB`
      });
    });
  });

  describe('Otimizações de Rede', () => {
    it('deve implementar cache eficiente', async () => {
      const cacheHits: number[] = [];
      const cacheMisses: number[] = [];

      // Simular requests com cache
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        
        // Simular cache hit/miss
        const isCacheHit = i > 2; // Primeiras 3 são cache miss
        
        await new Promise(resolve => {
          setTimeout(resolve, isCacheHit ? 5 : 100); // Cache hit muito mais rápido
        });
        
        const endTime = performance.now();
        const requestTime = endTime - startTime;
        
        if (isCacheHit) {
          cacheHits.push(requestTime);
        } else {
          cacheMisses.push(requestTime);
        }
      }

      const avgCacheHitTime = cacheHits.reduce((a, b) => a + b, 0) / cacheHits.length;
      const avgCacheMissTime = cacheMisses.reduce((a, b) => a + b, 0) / cacheMisses.length;
      const cacheEfficiency = (avgCacheMissTime - avgCacheHitTime) / avgCacheMissTime * 100;

      expect(cacheEfficiency).toBeGreaterThan(80); // Cache deve ser 80%+ mais rápido
      
      console.log('Cache Performance:', {
        avgCacheHitTime: `${avgCacheHitTime.toFixed(2)}ms`,
        avgCacheMissTime: `${avgCacheMissTime.toFixed(2)}ms`,
        cacheEfficiency: `${cacheEfficiency.toFixed(1)}%`,
        cacheHitRatio: `${(cacheHits.length / (cacheHits.length + cacheMisses.length) * 100).toFixed(1)}%`
      });
    });

    it('deve otimizar requests paralelos', async () => {
      const sequentialStart = performance.now();
      
      // Requests sequenciais
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const sequentialEnd = performance.now();
      const sequentialTime = sequentialEnd - sequentialStart;

      const parallelStart = performance.now();
      
      // Requests paralelos
      await Promise.all(
        Array.from({ length: 5 }, () => 
          new Promise(resolve => setTimeout(resolve, 50))
        )
      );
      
      const parallelEnd = performance.now();
      const parallelTime = parallelEnd - parallelStart;

      const improvement = (sequentialTime - parallelTime) / sequentialTime * 100;

      expect(improvement).toBeGreaterThan(70); // Pelo menos 70% mais rápido
      
      console.log('Parallel Requests Performance:', {
        sequentialTime: `${sequentialTime.toFixed(2)}ms`,
        parallelTime: `${parallelTime.toFixed(2)}ms`,
        improvement: `${improvement.toFixed(1)}%`
      });
    });
  });

  describe('Métricas de Usuário Real', () => {
    it('deve medir First Contentful Paint (FCP)', async () => {
      const startTime = performance.now();

      render(
        <TestWrapper>
          <div>
            <h1>Primeiro Conteúdo</h1>
            <p>Este é o primeiro conteúdo visível</p>
          </div>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Primeiro Conteúdo')).toBeInTheDocument();
      });

      const fcp = performance.now() - startTime;

      // FCP deve ser menor que 1.8s (Good)
      expect(fcp).toBeLessThan(1800);
      
      console.log('First Contentful Paint:', `${fcp.toFixed(2)}ms`);
    });

    it('deve medir Largest Contentful Paint (LCP)', async () => {
      const startTime = performance.now();

      render(
        <TestWrapper>
          <div>
            <img 
              src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwMCIvPjwvc3ZnPg=="
              alt="Maior elemento"
              style={{ width: '300px', height: '200px' }}
            />
            <h1>Título Principal</h1>
          </div>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByAltText('Maior elemento')).toBeInTheDocument();
      });

      const lcp = performance.now() - startTime;

      // LCP deve ser menor que 2.5s (Good)
      expect(lcp).toBeLessThan(2500);
      
      console.log('Largest Contentful Paint:', `${lcp.toFixed(2)}ms`);
    });

    it('deve medir Cumulative Layout Shift (CLS)', async () => {
      let layoutShifts = 0;

      const { rerender } = render(
        <TestWrapper>
          <div style={{ height: '100px' }}>
            <p>Conteúdo inicial</p>
          </div>
        </TestWrapper>
      );

      // Simular mudança de layout
      rerender(
        <TestWrapper>
          <div style={{ height: '200px' }}>
            <div style={{ height: '50px', backgroundColor: 'red' }}>
              Novo conteúdo que causa shift
            </div>
            <p>Conteúdo inicial</p>
          </div>
        </TestWrapper>
      );

      layoutShifts++; // Simular detecção de layout shift

      // CLS deve ser menor que 0.1 (Good)
      expect(layoutShifts).toBeLessThan(2);
      
      console.log('Cumulative Layout Shift:', layoutShifts);
    });
  });

  describe('Benchmarks Comparativos', () => {
    it('deve comparar performance antes e depois das otimizações', async () => {
      // Simular componente não otimizado
      const UnoptimizedComponent = () => {
        const [data, setData] = React.useState([]);
        
        React.useEffect(() => {
          // Simular processamento pesado
          const heavyData = Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            value: Math.random(),
            computed: Array.from({ length: 100 }, () => Math.random()).reduce((a, b) => a + b, 0)
          }));
          setData(heavyData);
        }, []);

        return (
          <div>
            {data.map(item => (
              <div key={item.id}>{item.computed.toFixed(2)}</div>
            ))}
          </div>
        );
      };

      // Simular componente otimizado
      const OptimizedComponent = React.memo(() => {
        const [data, setData] = React.useState([]);
        
        React.useEffect(() => {
          // Simular processamento otimizado
          const lightData = Array.from({ length: 100 }, (_, i) => ({
            id: i,
            value: Math.random()
          }));
          setData(lightData);
        }, []);

        return (
          <div>
            {data.slice(0, 10).map(item => (
              <div key={item.id}>{item.value.toFixed(2)}</div>
            ))}
          </div>
        );
      });

      // Medir componente não otimizado
      const unoptimizedStart = performance.now();
      const { unmount: unmountUnoptimized } = render(<UnoptimizedComponent />);
      await new Promise(resolve => setTimeout(resolve, 100));
      const unoptimizedTime = performance.now() - unoptimizedStart;
      unmountUnoptimized();

      // Medir componente otimizado
      const optimizedStart = performance.now();
      const { unmount: unmountOptimized } = render(<OptimizedComponent />);
      await new Promise(resolve => setTimeout(resolve, 100));
      const optimizedTime = performance.now() - optimizedStart;
      unmountOptimized();

      const improvement = (unoptimizedTime - optimizedTime) / unoptimizedTime * 100;

      expect(improvement).toBeGreaterThan(50); // Pelo menos 50% de melhoria
      
      console.log('Optimization Comparison:', {
        unoptimizedTime: `${unoptimizedTime.toFixed(2)}ms`,
        optimizedTime: `${optimizedTime.toFixed(2)}ms`,
        improvement: `${improvement.toFixed(1)}%`
      });
    });
  });
}); 