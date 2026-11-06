// Retido para compatibilidade de importações antigas.
// Dados sintéticos não podem ser inicializados nem lidos em produção.
// Consulte os hooks useLiveClosetData / useLiveFinanceData para métricas verdadeiras.
export interface DashboardMetrics {
  receita_mensal: number; receita_diaria: number; alugueis_ativos: number;
  vendas_mes: number; taxa_ocupacao: number; clientes_ativos: number;
  produtos_disponivel: number; devolucoes_hoje: number;
  alugueis_atrasados: number; faturamento_pendente: number;
}
export interface FinancialSummary {
  entrada_mes: number; saida_mes: number; lucro_mes: number;
  entrada_dia: number; meta_mensal: number; percentual_meta: number;
}
class DashboardDataService {
  static initializeDemoData(): void {
    // Desativado: proibido persistir dados demonstrativos no navegador.
  }
  static getDashboardMetrics(): DashboardMetrics {
    throw new Error("Dashboard local desativado. Use os dados reais do Supabase.");
  }
  static getFinancialSummary(): FinancialSummary {
    throw new Error("Financeiro local desativado. Use os dados reais do Supabase.");
  }
}
export default DashboardDataService;
