import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

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
    login: vi.fn()
  })
}));

// Mock do toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock dos utilitários Excel
vi.mock('@/utils/excelUtils', () => ({
  parseImportedExcel: vi.fn(),
  convertTemplateRowsToProducts: vi.fn(),
  downloadTemplate: vi.fn(),
}));

// Componentes para teste
import { Dashboard } from '@/pages/Dashboard';
import { ProductsPage } from '@/pages/ProductsPage';
import { OrdersPage } from '@/pages/OrdersPage';

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

// Dados de teste
const mockProducts = [
  {
    id: 1,
    name: 'Vestido Festa',
    description: 'Vestido elegante para festas',
    price: 150.00,
    rental_price: 75.00,
    category: 'Vestidos',
    size: 'M',
    color: 'Azul',
    in_stock: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Sapato Social',
    description: 'Sapato social masculino',
    price: 200.00,
    rental_price: 50.00,
    category: 'Calçados',
    size: '42',
    color: 'Preto',
    in_stock: true,
    created_at: '2024-01-01T00:00:00Z'
  }
];

const mockOrders = [
  {
    id: 1,
    customer_name: 'João Silva',
    customer_email: 'joao@email.com',
    customer_phone: '(11) 99999-9999',
    status: 'pending',
    total: 225.00,
    items: [
      { product_id: 1, quantity: 1, price: 75.00, type: 'rental' },
      { product_id: 2, quantity: 1, price: 150.00, type: 'sale' }
    ],
    created_at: '2024-01-15T10:00:00Z'
  }
];

describe('Testes de Integração', () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Dashboard Integration', () => {
    it('deve carregar e exibir dados do dashboard', async () => {
      // Mock das APIs
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              totalProducts: 150,
              totalOrders: 45,
              totalRevenue: 12500.00,
              pendingOrders: 8
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockOrders.slice(0, 5)
          })
        });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Verificar loading inicial
      expect(screen.getByText(/carregando/i)).toBeInTheDocument();

      // Aguardar carregamento dos dados
      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument(); // Total produtos
        expect(screen.getByText('45')).toBeInTheDocument(); // Total pedidos
        expect(screen.getByText('R$ 12.500,00')).toBeInTheDocument(); // Receita
      });

      // Verificar se as APIs foram chamadas
      expect(fetchMock).toHaveBeenCalledWith('/api/dashboard/stats');
      expect(fetchMock).toHaveBeenCalledWith('/api/orders/recent');
    });

    it('deve lidar com erro na API do dashboard', async () => {
      fetchMock.mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/erro ao carregar/i)).toBeInTheDocument();
      });
    });
  });

  describe('Products Page Integration', () => {
    it('deve carregar, filtrar e gerenciar produtos', async () => {
      const user = userEvent.setup();

      // Mock da API de produtos
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockProducts,
          pagination: {
            total: 2,
            page: 1,
            limit: 10,
            totalPages: 1
          }
        })
      });

      render(
        <TestWrapper>
          <ProductsPage />
        </TestWrapper>
      );

      // Aguardar carregamento
      await waitFor(() => {
        expect(screen.getByText('Vestido Festa')).toBeInTheDocument();
        expect(screen.getByText('Sapato Social')).toBeInTheDocument();
      });

      // Testar filtro por categoria
      const categoryFilter = screen.getByRole('combobox', { name: /categoria/i });
      await user.click(categoryFilter);
      await user.click(screen.getByText('Vestidos'));

      // Verificar se a API foi chamada com filtro
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/api/products?category=Vestidos')
        );
      });

      // Testar busca por nome
      const searchInput = screen.getByPlaceholderText(/buscar produtos/i);
      await user.type(searchInput, 'Vestido');

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/api/products?search=Vestido')
        );
      });
    });

    it('deve criar novo produto', async () => {
      const user = userEvent.setup();

      // Mock inicial para listar produtos
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: [],
            pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
          })
        })
        // Mock para criar produto
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { id: 3, name: 'Novo Produto', ...mockProducts[0] }
          })
        })
        // Mock para recarregar lista
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: [{ id: 3, name: 'Novo Produto', ...mockProducts[0] }],
            pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
          })
        });

      render(
        <TestWrapper>
          <ProductsPage />
        </TestWrapper>
      );

      // Aguardar carregamento inicial
      await waitFor(() => {
        expect(screen.getByText(/adicionar produto/i)).toBeInTheDocument();
      });

      // Clicar no botão de adicionar
      const addButton = screen.getByText(/adicionar produto/i);
      await user.click(addButton);

      // Preencher formulário
      await user.type(screen.getByLabelText(/nome/i), 'Novo Produto');
      await user.type(screen.getByLabelText(/descrição/i), 'Descrição do produto');
      await user.type(screen.getByLabelText(/preço/i), '100');

      // Submeter formulário
      const submitButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(submitButton);

      // Verificar se o produto foi criado
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Novo Produto')
        });
      });

      // Verificar toast de sucesso
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Produto criado',
        description: 'Produto adicionado com sucesso',
      });
    });
  });

  describe('Orders Page Integration', () => {
    it('deve carregar e gerenciar pedidos', async () => {
      const user = userEvent.setup();

      // Mock da API de pedidos
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockOrders,
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1
          }
        })
      });

      render(
        <TestWrapper>
          <OrdersPage />
        </TestWrapper>
      );

      // Aguardar carregamento
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
        expect(screen.getByText('R$ 225,00')).toBeInTheDocument();
      });

      // Testar filtro por status
      const statusFilter = screen.getByRole('combobox', { name: /status/i });
      await user.click(statusFilter);
      await user.click(screen.getByText('Pendente'));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/api/orders?status=pending')
        );
      });
    });

    it('deve atualizar status do pedido', async () => {
      const user = userEvent.setup();

      // Mock inicial para listar pedidos
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockOrders,
            pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
          })
        })
        // Mock para atualizar status
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { ...mockOrders[0], status: 'confirmed' }
          })
        });

      render(
        <TestWrapper>
          <OrdersPage />
        </TestWrapper>
      );

      // Aguardar carregamento
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Clicar no botão de ações do pedido
      const actionsButton = screen.getByRole('button', { name: /ações/i });
      await user.click(actionsButton);

      // Confirmar pedido
      const confirmButton = screen.getByText(/confirmar/i);
      await user.click(confirmButton);

      // Verificar se a API foi chamada
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/orders/1/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'confirmed' })
        });
      });

      // Verificar toast de sucesso
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Status atualizado',
        description: 'Pedido confirmado com sucesso',
      });
    });
  });

  describe('Fluxo Completo de Venda', () => {
    it('deve completar fluxo de venda do início ao fim', async () => {
      const user = userEvent.setup();

      // Simular sequência de APIs para fluxo completo
      fetchMock
        // 1. Carregar produtos disponíveis
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockProducts.filter(p => p.in_stock)
          })
        })
        // 2. Verificar disponibilidade
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { available: true }
          })
        })
        // 3. Criar pedido
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              id: 2,
              customer_name: 'Maria Santos',
              total: 150.00,
              status: 'pending'
            }
          })
        })
        // 4. Processar pagamento
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { payment_status: 'approved' }
          })
        })
        // 5. Confirmar pedido
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { status: 'confirmed' }
          })
        });

      // Renderizar componente de PDV (assumindo que existe)
      render(
        <TestWrapper>
          <div data-testid="pdv-component">
            {/* Simulação do componente PDV */}
            <h1>Ponto de Venda</h1>
            <button>Adicionar Produto</button>
            <button>Finalizar Venda</button>
          </div>
        </TestWrapper>
      );

      // 1. Adicionar produto ao carrinho
      const addProductButton = screen.getByText('Adicionar Produto');
      await user.click(addProductButton);

      // 2. Finalizar venda
      const finalizeSaleButton = screen.getByText('Finalizar Venda');
      await user.click(finalizeSaleButton);

      // Verificar que todas as APIs foram chamadas na sequência correta
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(5);
      });
    });
  });

  describe('Tratamento de Erros de Rede', () => {
    it('deve lidar com falha de conexão', async () => {
      fetchMock.mockRejectedValue(new Error('Network Error'));

      render(
        <TestWrapper>
          <ProductsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/erro de conexão/i)).toBeInTheDocument();
      });

      // Verificar se o toast de erro foi exibido
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Erro de conexão',
        description: 'Verifique sua conexão com a internet',
        variant: 'destructive'
      });
    });

    it('deve lidar com erro 500 do servidor', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          success: false,
          error: 'Internal Server Error'
        })
      });

      render(
        <TestWrapper>
          <ProductsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/erro interno do servidor/i)).toBeInTheDocument();
      });
    });

    it('deve implementar retry automático', async () => {
      // Primeira chamada falha, segunda sucede
      fetchMock
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockProducts
          })
        });

      render(
        <TestWrapper>
          <ProductsPage />
        </TestWrapper>
      );

      // Aguardar retry automático
      await waitFor(() => {
        expect(screen.getByText('Vestido Festa')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verificar que houve retry
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance e Otimizações', () => {
    it('deve implementar debounce na busca', async () => {
      const user = userEvent.setup();

      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockProducts
        })
      });

      render(
        <TestWrapper>
          <ProductsPage />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/buscar produtos/i);

      // Digitar rapidamente
      await user.type(searchInput, 'vest');

      // Aguardar debounce (assumindo 300ms)
      await new Promise(resolve => setTimeout(resolve, 350));

      // Verificar que a API foi chamada apenas uma vez após o debounce
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('search=vest')
      );
    });

    it('deve implementar paginação lazy loading', async () => {
      const user = userEvent.setup();

      // Mock para primeira página
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockProducts,
            pagination: { total: 20, page: 1, limit: 10, totalPages: 2 }
          })
        })
        // Mock para segunda página
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockProducts.map(p => ({ ...p, id: p.id + 10 })),
            pagination: { total: 20, page: 2, limit: 10, totalPages: 2 }
          })
        });

      render(
        <TestWrapper>
          <ProductsPage />
        </TestWrapper>
      );

      // Aguardar primeira página
      await waitFor(() => {
        expect(screen.getByText('Vestido Festa')).toBeInTheDocument();
      });

      // Simular scroll para carregar mais
      const loadMoreButton = screen.getByText(/carregar mais/i);
      await user.click(loadMoreButton);

      // Verificar que a segunda página foi carregada
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('page=2')
        );
      });
    });
  });
}); 