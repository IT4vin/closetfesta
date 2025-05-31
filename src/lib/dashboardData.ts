import PermissionManager from './permissions';

// Interfaces de dados do negócio
export interface Rental {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_telefone: string;
  produto_id: string;
  produto_nome: string;
  produto_categoria: string;
  data_retirada: string;
  data_devolucao: string;
  status: 'ativo' | 'devolvido' | 'atrasado' | 'cancelado';
  valor_total: number;
  valor_pago: number;
  forma_pagamento: 'dinheiro' | 'pix' | 'cartao' | 'parcelado';
  observacoes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  cliente_id?: string;
  cliente_nome?: string;
  produto_id: string;
  produto_nome: string;
  produto_categoria: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  forma_pagamento: 'dinheiro' | 'pix' | 'cartao' | 'parcelado';
  desconto?: number;
  observacoes?: string;
  created_by: string;
  created_at: string;
}

export interface Product {
  id: string;
  nome: string;
  categoria: string;
  tamanho: string;
  cor: string;
  marca?: string;
  valor_aluguel: number;
  valor_venda?: number;
  status: 'disponivel' | 'alugado' | 'vendido' | 'manutencao';
  quantidade_total: number;
  quantidade_disponivel: number;
  descricao?: string;
  imagem_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  endereco?: string;
  cpf?: string;
  data_nascimento?: string;
  total_alugueis: number;
  total_gasto: number;
  ultimo_aluguel?: string;
  status: 'ativo' | 'inativo';
  created_at: string;
}

export interface DashboardMetrics {
  receita_mensal: number;
  receita_diaria: number;
  alugueis_ativos: number;
  vendas_mes: number;
  taxa_ocupacao: number;
  clientes_ativos: number;
  produtos_disponivel: number;
  devolucoes_hoje: number;
  alugueis_atrasados: number;
  faturamento_pendente: number;
}

export interface FinancialSummary {
  entrada_mes: number;
  saida_mes: number;
  lucro_mes: number;
  entrada_dia: number;
  meta_mensal: number;
  percentual_meta: number;
}

// Serviço de dados do dashboard
class DashboardDataService {
  private static readonly RENTALS_KEY = 'closetfesta_rentals';
  private static readonly SALES_KEY = 'closetfesta_sales';
  private static readonly PRODUCTS_KEY = 'closetfesta_products';
  private static readonly CLIENTS_KEY = 'closetfesta_clients';

  // Inicializar dados de demonstração
  static initializeDemoData(): void {
    if (!localStorage.getItem(this.RENTALS_KEY)) {
      localStorage.setItem(this.RENTALS_KEY, JSON.stringify(this.generateDemoRentals()));
    }
    if (!localStorage.getItem(this.SALES_KEY)) {
      localStorage.setItem(this.SALES_KEY, JSON.stringify(this.generateDemoSales()));
    }
    if (!localStorage.getItem(this.PRODUCTS_KEY)) {
      localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(this.generateDemoProducts()));
    }
    if (!localStorage.getItem(this.CLIENTS_KEY)) {
      localStorage.setItem(this.CLIENTS_KEY, JSON.stringify(this.generateDemoClients()));
    }
  }

  // Métricas principais do dashboard
  static getDashboardMetrics(): DashboardMetrics {
    if (!PermissionManager.hasPermission('dashboard', 'read')) {
      throw new Error('Sem permissão para acessar métricas do dashboard');
    }

    this.initializeDemoData();
    
    const rentals = this.getRentals();
    const sales = this.getSales();
    const products = this.getProducts();
    const clients = this.getClients();
    
    const now = new Date();
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Cálculos
    const rentalsThisMonth = rentals.filter(r => new Date(r.created_at) >= firstDayMonth);
    const salesThisMonth = sales.filter(s => new Date(s.created_at) >= firstDayMonth);
    const activeRentals = rentals.filter(r => r.status === 'ativo');
    const todayReturns = rentals.filter(r => {
      const returnDate = new Date(r.data_devolucao);
      return returnDate.toDateString() === today.toDateString();
    });
    const lateRentals = rentals.filter(r => {
      return r.status === 'ativo' && new Date(r.data_devolucao) < now;
    });
    
    const receitaMensal = rentalsThisMonth.reduce((sum, r) => sum + r.valor_pago, 0) +
                         salesThisMonth.reduce((sum, s) => sum + s.valor_total, 0);
    
    const receitaDiaria = rentals.filter(r => {
      const rentDate = new Date(r.created_at);
      return rentDate.toDateString() === today.toDateString();
    }).reduce((sum, r) => sum + r.valor_pago, 0) + 
    sales.filter(s => {
      const saleDate = new Date(s.created_at);
      return saleDate.toDateString() === today.toDateString();
    }).reduce((sum, s) => sum + s.valor_total, 0);

    const totalProducts = products.reduce((sum, p) => sum + p.quantidade_total, 0);
    const availableProducts = products.reduce((sum, p) => sum + p.quantidade_disponivel, 0);
    const taxaOcupacao = totalProducts > 0 ? ((totalProducts - availableProducts) / totalProducts) * 100 : 0;

    return {
      receita_mensal: receitaMensal,
      receita_diaria: receitaDiaria,
      alugueis_ativos: activeRentals.length,
      vendas_mes: salesThisMonth.length,
      taxa_ocupacao: Math.round(taxaOcupacao),
      clientes_ativos: clients.filter(c => c.status === 'ativo').length,
      produtos_disponivel: availableProducts,
      devolucoes_hoje: todayReturns.length,
      alugueis_atrasados: lateRentals.length,
      faturamento_pendente: activeRentals.reduce((sum, r) => sum + (r.valor_total - r.valor_pago), 0)
    };
  }

  // Resumo financeiro
  static getFinancialSummary(): FinancialSummary {
    if (!PermissionManager.hasPermission('financial', 'read')) {
      throw new Error('Sem permissão para acessar dados financeiros');
    }

    const now = new Date();
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const rentals = this.getRentals();
    const sales = this.getSales();
    
    const entradaMes = rentals.filter(r => new Date(r.created_at) >= firstDayMonth)
                             .reduce((sum, r) => sum + r.valor_pago, 0) +
                      sales.filter(s => new Date(s.created_at) >= firstDayMonth)
                           .reduce((sum, s) => sum + s.valor_total, 0);
    
    const entradaDia = rentals.filter(r => {
      const rentDate = new Date(r.created_at);
      return rentDate.toDateString() === today.toDateString();
    }).reduce((sum, r) => sum + r.valor_pago, 0) + 
    sales.filter(s => {
      const saleDate = new Date(s.created_at);
      return saleDate.toDateString() === today.toDateString();
    }).reduce((sum, s) => sum + s.valor_total, 0);

    const metaMensal = 15000; // Meta mensal de R$ 15.000
    const percentualMeta = (entradaMes / metaMensal) * 100;
    
    return {
      entrada_mes: entradaMes,
      saida_mes: 2500, // Gastos fixos simulados
      lucro_mes: entradaMes - 2500,
      entrada_dia: entradaDia,
      meta_mensal: metaMensal,
      percentual_meta: Math.round(percentualMeta)
    };
  }

  // Aluguéis em atraso
  static getLateRentals(): Rental[] {
    const rentals = this.getRentals();
    const now = new Date();
    
    return rentals.filter(r => {
      return r.status === 'ativo' && new Date(r.data_devolucao) < now;
    }).sort((a, b) => new Date(a.data_devolucao).getTime() - new Date(b.data_devolucao).getTime());
  }

  // Devoluções para hoje
  static getTodayReturns(): Rental[] {
    const rentals = this.getRentals();
    const today = new Date();
    
    return rentals.filter(r => {
      const returnDate = new Date(r.data_devolucao);
      return returnDate.toDateString() === today.toDateString() && r.status === 'ativo';
    });
  }

  // Próximas devoluções (10 dias)
  static getUpcomingReturns(): Rental[] {
    const rentals = this.getRentals();
    const now = new Date();
    const tenDaysFromNow = new Date(now.getTime() + (10 * 24 * 60 * 60 * 1000));
    
    return rentals.filter(r => {
      const returnDate = new Date(r.data_devolucao);
      return returnDate > now && returnDate <= tenDaysFromNow && r.status === 'ativo';
    }).sort((a, b) => new Date(a.data_devolucao).getTime() - new Date(b.data_devolucao).getTime());
  }

  // Produtos mais alugados
  static getTopProducts(): Array<{id: string, nome: string, categoria: string, quantidade: number, receita: number}> {
    const rentals = this.getRentals();
    const productStats: {[key: string]: {nome: string, categoria: string, quantidade: number, receita: number}} = {};
    
    rentals.forEach(rental => {
      if (!productStats[rental.produto_id]) {
        productStats[rental.produto_id] = {
          nome: rental.produto_nome,
          categoria: rental.produto_categoria,
          quantidade: 0,
          receita: 0
        };
      }
      productStats[rental.produto_id].quantidade++;
      productStats[rental.produto_id].receita += rental.valor_total;
    });
    
    return Object.entries(productStats)
      .map(([id, stats]) => ({id, ...stats}))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);
  }

  // Atividades recentes
  static getRecentActivities(): Array<{type: string, description: string, timestamp: string, user: string}> {
    const rentals = this.getRentals();
    const sales = this.getSales();
    const activities: Array<{type: string, description: string, timestamp: string, user: string}> = [];
    
    // Adicionar aluguéis recentes
    rentals.slice(-10).forEach(rental => {
      activities.push({
        type: 'rental',
        description: `Novo aluguel: ${rental.produto_nome} para ${rental.cliente_nome}`,
        timestamp: rental.created_at,
        user: rental.created_by
      });
    });
    
    // Adicionar vendas recentes
    sales.slice(-10).forEach(sale => {
      activities.push({
        type: 'sale',
        description: `Venda: ${sale.quantidade}x ${sale.produto_nome}`,
        timestamp: sale.created_at,
        user: sale.created_by
      });
    });
    
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);
  }

  // Métodos auxiliares privados
  private static getRentals(): Rental[] {
    return JSON.parse(localStorage.getItem(this.RENTALS_KEY) || '[]');
  }

  private static getSales(): Sale[] {
    return JSON.parse(localStorage.getItem(this.SALES_KEY) || '[]');
  }

  private static getProducts(): Product[] {
    return JSON.parse(localStorage.getItem(this.PRODUCTS_KEY) || '[]');
  }

  private static getClients(): Client[] {
    return JSON.parse(localStorage.getItem(this.CLIENTS_KEY) || '[]');
  }

  // Dados de demonstração
  private static generateDemoRentals(): Rental[] {
    const currentUser = PermissionManager.getCurrentUser();
    const userName = currentUser?.full_name || 'Sistema';
    
    return [
      {
        id: '1',
        cliente_id: 'c1',
        cliente_nome: 'Maria Silva',
        cliente_telefone: '(11) 99999-1234',
        produto_id: 'p1',
        produto_nome: 'Vestido de Festa Azul',
        produto_categoria: 'Vestidos',
        data_retirada: '2025-05-28',
        data_devolucao: '2025-05-31',
        status: 'ativo',
        valor_total: 150,
        valor_pago: 150,
        forma_pagamento: 'pix',
        created_by: userName,
        created_at: '2025-05-28T10:00:00Z',
        updated_at: '2025-05-28T10:00:00Z'
      },
      {
        id: '2',
        cliente_id: 'c2',
        cliente_nome: 'Ana Costa',
        cliente_telefone: '(11) 88888-5678',
        produto_id: 'p2',
        produto_nome: 'Smoking Preto',
        produto_categoria: 'Ternos',
        data_retirada: '2025-05-25',
        data_devolucao: '2025-05-30',
        status: 'atrasado',
        valor_total: 200,
        valor_pago: 100,
        forma_pagamento: 'cartao',
        created_by: userName,
        created_at: '2025-05-25T14:30:00Z',
        updated_at: '2025-05-25T14:30:00Z'
      }
      // ... mais dados de demonstração
    ];
  }

  private static generateDemoSales(): Sale[] {
    const currentUser = PermissionManager.getCurrentUser();
    const userName = currentUser?.full_name || 'Sistema';
    
    return [
      {
        id: '1',
        produto_id: 'p10',
        produto_nome: 'Gravata Azul',
        produto_categoria: 'Acessórios',
        quantidade: 2,
        valor_unitario: 25,
        valor_total: 50,
        forma_pagamento: 'dinheiro',
        created_by: userName,
        created_at: '2025-05-30T16:45:00Z'
      }
    ];
  }

  private static generateDemoProducts(): Product[] {
    return [
      {
        id: 'p1',
        nome: 'Vestido de Festa Azul',
        categoria: 'Vestidos',
        tamanho: 'M',
        cor: 'Azul',
        marca: 'Festa Chic',
        valor_aluguel: 150,
        valor_venda: 300,
        status: 'alugado',
        quantidade_total: 1,
        quantidade_disponivel: 0,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-05-28T10:00:00Z'
      }
      // ... mais produtos
    ];
  }

  private static generateDemoClients(): Client[] {
    return [
      {
        id: 'c1',
        nome: 'Maria Silva',
        telefone: '(11) 99999-1234',
        email: 'maria@email.com',
        total_alugueis: 5,
        total_gasto: 750,
        ultimo_aluguel: '2025-05-28',
        status: 'ativo',
        created_at: '2025-01-10T10:00:00Z'
      }
      // ... mais clientes
    ];
  }
}

export default DashboardDataService; 