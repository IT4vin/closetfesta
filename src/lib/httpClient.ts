import PermissionManager from './permissions';

// Interface para configuração de requisições
export interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retryAttempts?: number;
}

// Interface para resposta
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
  ok: boolean;
}

// Configurações do cliente HTTP
const DEFAULT_TIMEOUT = 10000; // 10 segundos
const DEFAULT_RETRY_ATTEMPTS = 1;

class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private refreshing: boolean = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
    config: RequestConfig;
  }> = [];

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  // Interceptador de requisição - adiciona token automaticamente
  private async interceptRequest(config: RequestConfig): Promise<RequestConfig> {
    try {
      const session = PermissionManager.getCurrentSession();
      
      if (session?.token) {
        config.headers = {
          ...this.defaultHeaders,
          ...config.headers,
          'Authorization': `Bearer ${session.token}`,
        };
        
        console.log('🔑 Token adicionado à requisição');
      } else {
        config.headers = {
          ...this.defaultHeaders,
          ...config.headers,
        };
      }

      // Atualizar atividade do usuário
      if (session) {
        PermissionManager.updateLastActivity();
      }

      return config;
    } catch (error) {
      console.error('❌ Erro no interceptador de requisição:', error);
      throw error;
    }
  }

  // Interceptador de resposta - trata erros de autenticação
  private async interceptResponse<T>(
    response: Response, 
    originalConfig: RequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      // Verificar se a resposta é bem-sucedida
      if (response.ok) {
        const data = response.headers.get('content-type')?.includes('application/json') 
          ? await response.json()
          : await response.text();

        return {
          data,
          status: response.status,
          headers: response.headers,
          ok: true,
        };
      }

      // Tratar erros de autenticação
      if (response.status === 401) {
        console.log('🔒 Token expirado (401), tentando refresh...');
        return this.handleTokenExpiry(originalConfig);
      }

      if (response.status === 403) {
        console.log('🚫 Acesso negado (403), fazendo logout...');
        await this.handleForbidden();
        throw new Error('Acesso negado');
      }

      // Outros erros HTTP
      const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);

    } catch (error) {
      console.error('❌ Erro no interceptador de resposta:', error);
      throw error;
    }
  }

  // Tratar token expirado (401)
  private async handleTokenExpiry<T>(originalConfig: RequestConfig): Promise<ApiResponse<T>> {
    if (this.refreshing) {
      // Se já estamos tentando refresh, adicionar à fila
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject, config: originalConfig });
      });
    }

    this.refreshing = true;

    try {
      console.log('🔄 Tentando renovar token...');
      
      // Simular refresh token (em produção seria uma chamada real)
      const refreshed = await this.refreshToken();
      
      if (refreshed) {
        console.log('✅ Token renovado com sucesso');
        
        // Processar fila de requisições falidas
        this.processFailedQueue(null);
        
        // Tentar novamente a requisição original
        return this.request<T>(originalConfig);
      } else {
        throw new Error('Falha ao renovar token');
      }

    } catch (error) {
      console.error('❌ Falha no refresh do token:', error);
      
      // Processar fila com erro
      this.processFailedQueue(error);
      
      // Fazer logout se não conseguir renovar
      await this.handleForbidden();
      throw error;
      
    } finally {
      this.refreshing = false;
    }
  }

  // Renovar token (simulação - em produção seria uma chamada à API)
  private async refreshToken(): Promise<boolean> {
    try {
      const session = PermissionManager.getCurrentSession();
      
      if (!session) {
        return false;
      }

      // Em produção, aqui seria feita uma chamada para o endpoint de refresh
      // Simulando uma renovação bem-sucedida se a sessão ainda é válida
      const now = new Date();
      const expiresAt = new Date(session.expires_at);
      
      if (expiresAt > now) {
        // Extender a sessão por mais 24h
        session.expires_at = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        session.last_activity = now.toISOString();
        
        localStorage.setItem('closetfesta_session', JSON.stringify(session));
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
      return false;
    }
  }

  // Processar fila de requisições que falharam
  private processFailedQueue(error: any) {
    this.failedQueue.forEach(({ resolve, reject, config }) => {
      if (error) {
        reject(error);
      } else {
        resolve(this.request(config));
      }
    });
    
    this.failedQueue = [];
  }

  // Tratar acesso proibido (403) ou falha no refresh
  private async handleForbidden(): Promise<void> {
    console.log('🚪 Fazendo logout automático por erro de autenticação...');
    
    try {
      PermissionManager.logout();
    } catch (error) {
      console.error('❌ Erro no logout automático:', error);
      // Forçar recarregamento como último recurso
      window.location.reload();
    }
  }

  // Método principal de requisição
  async request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    const {
      url,
      method = 'GET',
      body,
      timeout = DEFAULT_TIMEOUT,
      retryAttempts = DEFAULT_RETRY_ATTEMPTS,
    } = config;

    let attempt = 0;
    let lastError: Error;

    while (attempt <= retryAttempts) {
      try {
        // Interceptar requisição
        const interceptedConfig = await this.interceptRequest(config);
        
        // Preparar opções do fetch
        const fetchOptions: RequestInit = {
          method,
          headers: interceptedConfig.headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(timeout),
        };

        // Fazer requisição
        console.log(`🌐 ${method} ${this.baseURL}${url} (tentativa ${attempt + 1})`);
        const response = await fetch(`${this.baseURL}${url}`, fetchOptions);

        // Interceptar resposta
        return await this.interceptResponse<T>(response, config);

      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (attempt <= retryAttempts) {
          console.log(`⚠️ Tentativa ${attempt} falhou, tentando novamente...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Backoff
        } else {
          console.error(`❌ Todas as tentativas falharam para ${method} ${url}:`, lastError);
          throw lastError;
        }
      }
    }

    throw lastError!;
  }

  // Métodos de conveniência
  async get<T = any>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'GET' });
  }

  async post<T = any>(url: string, body?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'POST', body });
  }

  async put<T = any>(url: string, body?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PUT', body });
  }

  async delete<T = any>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'DELETE' });
  }

  async patch<T = any>(url: string, body?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PATCH', body });
  }

  // Configurar base URL
  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  // Configurar headers padrão
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }
}

// Instância padrão do cliente HTTP
export const httpClient = new HttpClient();

// Hook para usar o cliente HTTP nos componentes
export const useHttpClient = () => {
  return httpClient;
};

export default HttpClient; 