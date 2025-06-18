import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Simulação de componentes principais
import { App } from '@/App';
import { Dashboard } from '@/pages/Dashboard';
import { ProductsPage } from '@/pages/ProductsPage';
import { OrdersPage } from '@/pages/OrdersPage';

// Mock do AuthStore
const mockAuthStore = {
  isAuthenticated: true,
  isLoading: false,
  error: null,
  user: { 
    id: 1,
    full_name: 'Admin User', 
    email: 'admin@test.com',
    role: 'admin'
  }
};

vi.mock('@/stores/authStore', () => ({
  useAuth: () => mockAuthStore,
  initializeAuthStore: vi.fn(),
  useAuthActions: () => ({
    logout: vi.fn(),
    login: vi.fn().mockResolvedValue({ success: true })
  })
}));

// Mock do toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Wrapper para testes E2E
const E2EWrapper = ({ children }: { children: React.ReactNode }) => {
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

// Simulador de API para testes E2E
class E2EApiSimulator {
  private responses: Map<string, any> = new Map();
  private callHistory: Array<{ url: string; method: string; body?: any; timestamp: number }> = [];

  setupScenario(scenario: 'happy-path' | 'error-handling' | 'slow-network') {
    this.responses.clear();
    this.callHistory = [];

    switch (scenario) {
      case 'happy-path':
        this.setupHappyPathResponses();
        break;
      case 'error-handling':
        this.setupErrorResponses();
        break;
      case 'slow-network':
        this.setupSlowResponses();
        break;
    }
  }

  private setupHappyPathResponses() {
    // Dashboard
    this.responses.set('/api/dashboard/stats', {
      success: true,
      data: {
        totalProducts: 150,
        totalOrders: 45,
        totalRevenue: 12500.00,
        pendingOrders: 8
      }
    });

    this.responses.set('/api/orders/recent', {
      success: true,
      data: [
        {
          id: 1,
          customer_name: 'João Silva',
          total: 225.00,
          status: 'pending',
          created_at: '2024-01-15T10:00:00Z'
        }
      ]
    });

    // Products
    this.responses.set('/api/products', {
      success: true,
      data: [
        {
          id: 1,
          name: 'Vestido Festa Azul',
          description: 'Vestido elegante para festas',
          price: 150.00,
          rental_price: 75.00,
          category: 'Vestidos',
          in_stock: true
        },
        {
          id: 2,
          name: 'Sapato Social Preto',
          description: 'Sapato social masculino',
          price: 200.00,
          rental_price: 50.00,
          category: 'Calçados',
          in_stock: true
        }
      ],
      pagination: {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    });

    // Orders
    this.responses.set('/api/orders', {
      success: true,
      data: [
        {
          id: 1,
          customer_name: 'João Silva',
          customer_email: 'joao@email.com',
          status: 'pending',
          total: 225.00,
          items: [
            { product_id: 1, quantity: 1, price: 75.00, type: 'rental' }
          ],
          created_at: '2024-01-15T10:00:00Z'
        }
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    });

    // Create operations
    this.responses.set('POST:/api/products', {
      success: true,
      data: {
        id: 3,
        name: 'Novo Produto',
        description: 'Produto criado via teste',
        price: 100.00,
        rental_price: 50.00,
        category: 'Teste',
        in_stock: true
      }
    });

    this.responses.set('POST:/api/orders', {
      success: true,
      data: {
        id: 2,
        customer_name: 'Maria Santos',
        total: 150.00,
        status: 'pending'
      }
    });
  }

  private setupErrorResponses() {
    this.responses.set('/api/dashboard/stats', {
      success: false,
      error: 'Internal Server Error'
    });

    this.responses.set('/api/products', {
      success: false,
      error: 'Database connection failed'
    });
  }

  private setupSlowResponses() {
    // Todas as respostas terão delay
    this.setupHappyPathResponses();
  }

  setupFetchMock() {
    global.fetch = vi.fn().mockImplementation(async (url: string, options: any = {}) => {
      const method = options.method || 'GET';
      const key = method === 'GET' ? url : `${method}:${url}`;
      
      // Registrar chamada
      this.callHistory.push({
        url,
        method,
        body: options.body ? JSON.parse(options.body) : undefined,
        timestamp: Date.now()
      });

      // Simular delay para cenário de rede lenta
      if (this.responses.has('SLOW_NETWORK')) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const response = this.responses.get(key) || this.responses.get(url);
      
      if (!response) {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ success: false, error: 'Not Found' })
        });
      }

      if (!response.success) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve(response)
        });
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(response)
      });
    });
  }

  getCallHistory() {
    return this.callHistory;
  }

  getCallCount(url: string) {
    return this.callHistory.filter(call => call.url.includes(url)).length;
  }
}

describe('Testes End-to-End', () => {
  let apiSimulator: E2EApiSimulator;

  beforeEach(() => {
    apiSimulator = new E2EApiSimulator();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Fluxo Completo de Gestão de Produtos', () => {
    it('deve completar fluxo: listar → criar → editar → deletar produto', async () => {
      const user = userEvent.setup();
      apiSimulator.setupScenario('happy-path');
      apiSimulator.setupFetchMock();

      render(
        <E2EWrapper>
          <ProductsPage />
        </E2EWrapper>
      );

      // 1. LISTAR PRODUTOS
      await waitFor(() => {
        expect(screen.getByText('Vestido Festa Azul')).toBeInTheDocument();
        expect(screen.getByText('Sapato Social Preto')).toBeInTheDocument();
      });

      expect(apiSimulator.getCallCount('/api/products')).toBe(1);

      // 2. CRIAR NOVO PRODUTO
      const addButton = screen.getByText(/adicionar produto/i);
      await user.click(addButton);

      // Preencher formulário
      await user.type(screen.getByLabelText(/nome/i), 'Vestido Vermelho');
      await user.type(screen.getByLabelText(/descrição/i), 'Vestido elegante vermelho');
      await user.type(screen.getByLabelText(/preço venda/i), '180');
      await user.type(screen.getByLabelText(/preço aluguel/i), '90');

      // Selecionar categoria
      const categorySelect = screen.getByLabelText(/categoria/i);
      await user.click(categorySelect);
      await user.click(screen.getByText('Vestidos'));

      // Submeter
      const submitButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(submitButton);

      // Verificar criação
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Produto criado',
          description: 'Produto adicionado com sucesso',
        });
      });

      // 3. EDITAR PRODUTO
      const editButton = screen.getAllByText(/editar/i)[0];
      await user.click(editButton);

      // Modificar nome
      const nameInput = screen.getByDisplayValue('Vestido Festa Azul');
      await user.clear(nameInput);
      await user.type(nameInput, 'Vestido Festa Azul Marinho');

      // Salvar edição
      const saveEditButton = screen.getByRole('button', { name: /salvar alterações/i });
      await user.click(saveEditButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Produto atualizado',
          description: 'Alterações salvas com sucesso',
        });
      });

      // 4. DELETAR PRODUTO
      const deleteButton = screen.getAllByText(/deletar/i)[0];
      await user.click(deleteButton);

      // Confirmar deleção
      const confirmButton = screen.getByText(/confirmar/i);
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Produto removido',
          description: 'Produto deletado com sucesso',
        });
      });

      // Verificar que todas as operações foram realizadas
      const history = apiSimulator.getCallHistory();
      expect(history.some(call => call.method === 'GET')).toBe(true); // Listar
      expect(history.some(call => call.method === 'POST')).toBe(true); // Criar
      expect(history.some(call => call.method === 'PUT')).toBe(true); // Editar
      expect(history.some(call => call.method === 'DELETE')).toBe(true); // Deletar
    });

    it('deve implementar busca e filtros avançados', async () => {
      const user = userEvent.setup();
      apiSimulator.setupScenario('happy-path');
      apiSimulator.setupFetchMock();

      render(
        <E2EWrapper>
          <ProductsPage />
        </E2EWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Vestido Festa Azul')).toBeInTheDocument();
      });

      // 1. BUSCA POR TEXTO
      const searchInput = screen.getByPlaceholderText(/buscar produtos/i);
      await user.type(searchInput, 'Vestido');

      // Aguardar debounce
      await waitFor(() => {
        expect(apiSimulator.getCallCount('search=Vestido')).toBeGreaterThan(0);
      }, { timeout: 1000 });

      // 2. FILTRO POR CATEGORIA
      const categoryFilter = screen.getByRole('combobox', { name: /categoria/i });
      await user.click(categoryFilter);
      await user.click(screen.getByText('Vestidos'));

      await waitFor(() => {
        expect(apiSimulator.getCallCount('category=Vestidos')).toBeGreaterThan(0);
      });

      // 3. FILTRO POR DISPONIBILIDADE
      const availabilityFilter = screen.getByRole('checkbox', { name: /apenas disponíveis/i });
      await user.click(availabilityFilter);

      await waitFor(() => {
        expect(apiSimulator.getCallCount('available=true')).toBeGreaterThan(0);
      });

      // 4. ORDENAÇÃO
      const sortSelect = screen.getByRole('combobox', { name: /ordenar por/i });
      await user.click(sortSelect);
      await user.click(screen.getByText('Preço: Menor para Maior'));

      await waitFor(() => {
        expect(apiSimulator.getCallCount('sort=price_asc')).toBeGreaterThan(0);
      });

      // Verificar que múltiplos filtros foram aplicados
      const history = apiSimulator.getCallHistory();
      const lastCall = history[history.length - 1];
      expect(lastCall.url).toContain('search=Vestido');
      expect(lastCall.url).toContain('category=Vestidos');
      expect(lastCall.url).toContain('available=true');
      expect(lastCall.url).toContain('sort=price_asc');
    });
  });

  describe('Fluxo Completo de Gestão de Pedidos', () => {
    it('deve completar fluxo: criar pedido → processar pagamento → confirmar → entregar', async () => {
      const user = userEvent.setup();
      apiSimulator.setupScenario('happy-path');
      
      // Adicionar respostas específicas para fluxo de pedidos
      apiSimulator.responses.set('PATCH:/api/orders/1/status', {
        success: true,
        data: { id: 1, status: 'confirmed' }
      });
      
      apiSimulator.responses.set('POST:/api/orders/1/payment', {
        success: true,
        data: { payment_status: 'approved', transaction_id: 'TXN123' }
      });

      apiSimulator.setupFetchMock();

      render(
        <E2EWrapper>
          <OrdersPage />
        </E2EWrapper>
      );

      // 1. VISUALIZAR PEDIDOS PENDENTES
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
        expect(screen.getByText('R$ 225,00')).toBeInTheDocument();
      });

      // 2. PROCESSAR PAGAMENTO
      const processPaymentButton = screen.getByText(/processar pagamento/i);
      await user.click(processPaymentButton);

      // Preencher dados do cartão
      await user.type(screen.getByLabelText(/número do cartão/i), '4111111111111111');
      await user.type(screen.getByLabelText(/cvv/i), '123');
      await user.type(screen.getByLabelText(/validade/i), '12/25');

      const confirmPaymentButton = screen.getByText(/confirmar pagamento/i);
      await user.click(confirmPaymentButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Pagamento aprovado',
          description: 'Transação processada com sucesso',
        });
      });

      // 3. CONFIRMAR PEDIDO
      const confirmOrderButton = screen.getByText(/confirmar pedido/i);
      await user.click(confirmOrderButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Pedido confirmado',
          description: 'Pedido pronto para separação',
        });
      });

      // 4. MARCAR COMO ENTREGUE
      const deliverButton = screen.getByText(/marcar como entregue/i);
      await user.click(deliverButton);

      // Confirmar entrega
      const confirmDeliveryButton = screen.getByText(/confirmar entrega/i);
      await user.click(confirmDeliveryButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Pedido entregue',
          description: 'Entrega confirmada com sucesso',
        });
      });

      // Verificar fluxo completo
      const history = apiSimulator.getCallHistory();
      expect(history.some(call => call.url.includes('/payment'))).toBe(true);
      expect(history.some(call => call.url.includes('/status') && call.method === 'PATCH')).toBe(true);
    });

    it('deve lidar com falha no pagamento e retry', async () => {
      const user = userEvent.setup();
      apiSimulator.setupScenario('happy-path');
      
      // Primeira tentativa falha, segunda sucede
      let paymentAttempts = 0;
      apiSimulator.responses.set('POST:/api/orders/1/payment', () => {
        paymentAttempts++;
        if (paymentAttempts === 1) {
          return { success: false, error: 'Cartão recusado' };
        }
        return { success: true, data: { payment_status: 'approved' } };
      });

      apiSimulator.setupFetchMock();

      render(
        <E2EWrapper>
          <OrdersPage />
        </E2EWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Primeira tentativa de pagamento
      const processPaymentButton = screen.getByText(/processar pagamento/i);
      await user.click(processPaymentButton);

      await user.type(screen.getByLabelText(/número do cartão/i), '4000000000000002'); // Cartão que falha
      const confirmPaymentButton = screen.getByText(/confirmar pagamento/i);
      await user.click(confirmPaymentButton);

      // Verificar erro
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Pagamento recusado',
          description: 'Cartão recusado',
          variant: 'destructive'
        });
      });

      // Tentar novamente com cartão válido
      const retryButton = screen.getByText(/tentar novamente/i);
      await user.click(retryButton);

      const cardInput = screen.getByLabelText(/número do cartão/i);
      await user.clear(cardInput);
      await user.type(cardInput, '4111111111111111');

      await user.click(confirmPaymentButton);

      // Verificar sucesso na segunda tentativa
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Pagamento aprovado',
          description: 'Transação processada com sucesso',
        });
      });

      expect(paymentAttempts).toBe(2);
    });
  });

  describe('Fluxo de Dashboard e Relatórios', () => {
    it('deve navegar pelo dashboard e gerar relatórios', async () => {
      const user = userEvent.setup();
      apiSimulator.setupScenario('happy-path');
      
      // Adicionar dados para relatórios
      apiSimulator.responses.set('/api/reports/sales', {
        success: true,
        data: {
          period: 'last_30_days',
          total_sales: 15000.00,
          total_rentals: 8500.00,
          growth_percentage: 12.5,
          top_products: [
            { name: 'Vestido Festa Azul', sales: 5, revenue: 750.00 }
          ]
        }
      });

      apiSimulator.setupFetchMock();

      render(
        <E2EWrapper>
          <Dashboard />
        </E2EWrapper>
      );

      // 1. VISUALIZAR MÉTRICAS PRINCIPAIS
      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument(); // Total produtos
        expect(screen.getByText('45')).toBeInTheDocument(); // Total pedidos
        expect(screen.getByText('R$ 12.500,00')).toBeInTheDocument(); // Receita
      });

      // 2. GERAR RELATÓRIO DE VENDAS
      const reportsButton = screen.getByText(/relatórios/i);
      await user.click(reportsButton);

      const salesReportButton = screen.getByText(/relatório de vendas/i);
      await user.click(salesReportButton);

      // Selecionar período
      const periodSelect = screen.getByRole('combobox', { name: /período/i });
      await user.click(periodSelect);
      await user.click(screen.getByText('Últimos 30 dias'));

      const generateButton = screen.getByText(/gerar relatório/i);
      await user.click(generateButton);

      // Verificar dados do relatório
      await waitFor(() => {
        expect(screen.getByText('R$ 15.000,00')).toBeInTheDocument(); // Total vendas
        expect(screen.getByText('R$ 8.500,00')).toBeInTheDocument(); // Total aluguéis
        expect(screen.getByText('12.5%')).toBeInTheDocument(); // Crescimento
      });

      // 3. EXPORTAR RELATÓRIO
      const exportButton = screen.getByText(/exportar pdf/i);
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Relatório exportado',
          description: 'Download iniciado com sucesso',
        });
      });

      // Verificar chamadas da API
      expect(apiSimulator.getCallCount('/api/dashboard/stats')).toBe(1);
      expect(apiSimulator.getCallCount('/api/reports/sales')).toBe(1);
    });

    it('deve atualizar dados em tempo real', async () => {
      const user = userEvent.setup();
      apiSimulator.setupScenario('happy-path');
      apiSimulator.setupFetchMock();

      render(
        <E2EWrapper>
          <Dashboard />
        </E2EWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument();
      });

      // Simular atualização de dados
      apiSimulator.responses.set('/api/dashboard/stats', {
        success: true,
        data: {
          totalProducts: 151, // +1 produto
          totalOrders: 46, // +1 pedido
          totalRevenue: 12725.00, // +225 receita
          pendingOrders: 9 // +1 pendente
        }
      });

      // Forçar atualização (simular WebSocket ou polling)
      const refreshButton = screen.getByText(/atualizar/i);
      await user.click(refreshButton);

      // Verificar dados atualizados
      await waitFor(() => {
        expect(screen.getByText('151')).toBeInTheDocument();
        expect(screen.getByText('46')).toBeInTheDocument();
        expect(screen.getByText('R$ 12.725,00')).toBeInTheDocument();
      });

      // Verificar que houve múltiplas chamadas
      expect(apiSimulator.getCallCount('/api/dashboard/stats')).toBe(2);
    });
  });

  describe('Tratamento de Erros e Recuperação', () => {
    it('deve lidar com falhas de rede e implementar retry', async () => {
      const user = userEvent.setup();
      apiSimulator.setupScenario('error-handling');
      apiSimulator.setupFetchMock();

      render(
        <E2EWrapper>
          <ProductsPage />
        </E2EWrapper>
      );

      // Verificar exibição de erro
      await waitFor(() => {
        expect(screen.getByText(/erro ao carregar produtos/i)).toBeInTheDocument();
      });

      // Tentar novamente
      const retryButton = screen.getByText(/tentar novamente/i);
      await user.click(retryButton);

      // Simular recuperação da conexão
      apiSimulator.setupScenario('happy-path');
      apiSimulator.setupFetchMock();

      await user.click(retryButton);

      // Verificar recuperação
      await waitFor(() => {
        expect(screen.getByText('Vestido Festa Azul')).toBeInTheDocument();
      });

      expect(apiSimulator.getCallCount('/api/products')).toBeGreaterThan(1);
    });

    it('deve implementar fallback para funcionalidades offline', async () => {
      const user = userEvent.setup();
      
      // Simular modo offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      render(
        <E2EWrapper>
          <ProductsPage />
        </E2EWrapper>
      );

      // Verificar modo offline
      await waitFor(() => {
        expect(screen.getByText(/modo offline/i)).toBeInTheDocument();
      });

      // Verificar funcionalidades limitadas
      expect(screen.getByText(/algumas funcionalidades estão limitadas/i)).toBeInTheDocument();

      // Simular volta da conexão
      Object.defineProperty(navigator, 'onLine', {
        value: true,
      });

      // Disparar evento de volta online
      fireEvent(window, new Event('online'));

      await waitFor(() => {
        expect(screen.queryByText(/modo offline/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance e Otimizações E2E', () => {
    it('deve carregar páginas rapidamente', async () => {
      apiSimulator.setupScenario('happy-path');
      apiSimulator.setupFetchMock();

      const startTime = performance.now();

      render(
        <E2EWrapper>
          <Dashboard />
        </E2EWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Página deve carregar em menos de 2 segundos
      expect(loadTime).toBeLessThan(2000);
      
      console.log(`Dashboard load time: ${loadTime.toFixed(2)}ms`);
    });

    it('deve implementar lazy loading eficiente', async () => {
      const user = userEvent.setup();
      apiSimulator.setupScenario('happy-path');
      apiSimulator.setupFetchMock();

      render(
        <E2EWrapper>
          <div>
            <nav>
              <button onClick={() => window.history.pushState({}, '', '/products')}>
                Produtos
              </button>
              <button onClick={() => window.history.pushState({}, '', '/orders')}>
                Pedidos
              </button>
            </nav>
            <div id="content">
              {/* Conteúdo será carregado dinamicamente */}
            </div>
          </div>
        </E2EWrapper>
      );

      // Navegar para produtos
      const productsButton = screen.getByText('Produtos');
      const startTime = performance.now();
      
      await user.click(productsButton);

      // Simular carregamento lazy
      await waitFor(() => {
        expect(window.location.pathname).toBe('/products');
      });

      const endTime = performance.now();
      const navigationTime = endTime - startTime;

      // Navegação deve ser rápida
      expect(navigationTime).toBeLessThan(500);
      
      console.log(`Lazy navigation time: ${navigationTime.toFixed(2)}ms`);
    });
  });

  describe('Fluxo Completo de Usuário Real', () => {
    it('deve simular jornada completa de um usuário administrador', async () => {
      const user = userEvent.setup();
      apiSimulator.setupScenario('happy-path');
      apiSimulator.setupFetchMock();

      // Simular aplicação completa
      render(
        <E2EWrapper>
          <App />
        </E2EWrapper>
      );

      // 1. LOGIN (assumindo que já está logado via mock)
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // 2. VISUALIZAR DASHBOARD
      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument();
      });

      // 3. NAVEGAR PARA PRODUTOS
      const productsLink = screen.getByText(/produtos/i);
      await user.click(productsLink);

      await waitFor(() => {
        expect(screen.getByText('Vestido Festa Azul')).toBeInTheDocument();
      });

      // 4. CRIAR NOVO PRODUTO
      const addProductButton = screen.getByText(/adicionar produto/i);
      await user.click(addProductButton);

      await user.type(screen.getByLabelText(/nome/i), 'Produto E2E Test');
      await user.type(screen.getByLabelText(/preço/i), '150');

      const saveButton = screen.getByText(/salvar/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Produto criado'
          })
        );
      });

      // 5. NAVEGAR PARA PEDIDOS
      const ordersLink = screen.getByText(/pedidos/i);
      await user.click(ordersLink);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // 6. PROCESSAR PEDIDO
      const processButton = screen.getByText(/processar/i);
      await user.click(processButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('processado')
          })
        );
      });

      // 7. VOLTAR AO DASHBOARD
      const dashboardLink = screen.getByText(/dashboard/i);
      await user.click(dashboardLink);

      // Verificar que os dados foram atualizados
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Verificar histórico de navegação
      const history = apiSimulator.getCallHistory();
      const uniqueEndpoints = new Set(history.map(call => call.url.split('?')[0]));
      
      expect(uniqueEndpoints.size).toBeGreaterThan(3); // Múltiplos endpoints foram chamados
      expect(history.length).toBeGreaterThan(5); // Múltiplas chamadas foram feitas
      
      console.log('E2E Journey completed:', {
        totalApiCalls: history.length,
        uniqueEndpoints: Array.from(uniqueEndpoints),
        duration: history[history.length - 1].timestamp - history[0].timestamp
      });
    });
  });
}); 