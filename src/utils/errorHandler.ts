export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  details?: any;
  timestamp: number;
  stack?: string;
  context?: {
    userId?: string;
    page?: string;
    action?: string;
    component?: string;
    [key: string]: any;
  };
  retryable: boolean;
  retryCount?: number;
  maxRetries?: number;
}

export interface ErrorHandlerOptions {
  showToUser?: boolean;
  logToConsole?: boolean;
  logToService?: boolean;
  retryable?: boolean;
  maxRetries?: number;
  context?: Record<string, any>;
}

class ErrorHandler {
  private errors: Map<string, AppError> = new Map();
  private listeners: Array<(error: AppError) => void> = [];
  private retryQueue: Map<string, () => Promise<any>> = new Map();

  // Criar erro estruturado
  createError(
    type: ErrorType,
    message: string,
    userMessage?: string,
    options: Partial<AppError & ErrorHandlerOptions> = {}
  ): AppError {
    const id = this.generateErrorId();
    const timestamp = Date.now();

    const error: AppError = {
      id,
      type,
      severity: this.determineSeverity(type),
      message,
      userMessage: userMessage || this.getDefaultUserMessage(type),
      timestamp,
      retryable: this.isRetryable(type),
      retryCount: 0,
      maxRetries: 3,
      ...options,
    };

    this.errors.set(id, error);
    return error;
  }

  // Processar erro capturado
  handleError(
    error: Error | AppError | any,
    options: ErrorHandlerOptions = {}
  ): AppError {
    let appError: AppError;

    if (this.isAppError(error)) {
      appError = error;
    } else if (error instanceof Error) {
      appError = this.createErrorFromException(error, options);
    } else {
      appError = this.createError(
        ErrorType.UNKNOWN,
        'Erro desconhecido',
        'Ocorreu um erro inesperado',
        { details: error, ...options }
      );
    }

    // Adicionar contexto se fornecido
    if (options.context) {
      appError.context = { ...appError.context, ...options.context };
    }

    // Processar o erro
    this.processError(appError, options);

    return appError;
  }

  // Processar erro de rede/API
  handleApiError(
    response: Response | any,
    options: ErrorHandlerOptions = {}
  ): AppError {
    const status = response.status || response.code || 0;
    let type: ErrorType;
    let message: string;
    let userMessage: string;

    switch (true) {
      case status === 401:
        type = ErrorType.AUTHENTICATION;
        message = 'Não autenticado';
        userMessage = 'Sua sessão expirou. Faça login novamente.';
        break;
      case status === 403:
        type = ErrorType.AUTHORIZATION;
        message = 'Não autorizado';
        userMessage = 'Você não tem permissão para esta ação.';
        break;
      case status === 404:
        type = ErrorType.NOT_FOUND;
        message = 'Recurso não encontrado';
        userMessage = 'O item solicitado não foi encontrado.';
        break;
      case status >= 400 && status < 500:
        type = ErrorType.CLIENT_ERROR;
        message = `Erro do cliente: ${status}`;
        userMessage = 'Houve um problema com sua solicitação.';
        break;
      case status >= 500:
        type = ErrorType.SERVER_ERROR;
        message = `Erro do servidor: ${status}`;
        userMessage = 'Erro interno do servidor. Tente novamente.';
        break;
      case status === 0:
        type = ErrorType.NETWORK;
        message = 'Erro de rede';
        userMessage = 'Verifique sua conexão com a internet.';
        break;
      default:
        type = ErrorType.UNKNOWN;
        message = 'Erro desconhecido da API';
        userMessage = 'Ocorreu um erro inesperado.';
    }

    return this.handleError(
      this.createError(type, message, userMessage, {
        details: { status, response },
        ...options,
      }),
      options
    );
  }

  // Tentar novamente uma operação
  async retry(errorId: string): Promise<any> {
    const error = this.errors.get(errorId);
    if (!error || !error.retryable) {
      throw new Error('Erro não pode ser repetido');
    }

    const retryFn = this.retryQueue.get(errorId);
    if (!retryFn) {
      throw new Error('Função de retry não encontrada');
    }

    if (error.retryCount >= (error.maxRetries || 3)) {
      throw new Error('Máximo de tentativas excedido');
    }

    try {
      error.retryCount++;
      const result = await retryFn();
      this.clearError(errorId);
      return result;
    } catch (retryError) {
      return this.handleError(retryError, { context: { originalErrorId: errorId } });
    }
  }

  // Registrar função para retry
  registerRetry(errorId: string, retryFn: () => Promise<any>): void {
    this.retryQueue.set(errorId, retryFn);
  }

  // Limpar erro
  clearError(errorId: string): void {
    this.errors.delete(errorId);
    this.retryQueue.delete(errorId);
  }

  // Limpar todos os erros
  clearAllErrors(): void {
    this.errors.clear();
    this.retryQueue.clear();
  }

  // Obter erro por ID
  getError(errorId: string): AppError | undefined {
    return this.errors.get(errorId);
  }

  // Obter todos os erros
  getAllErrors(): AppError[] {
    return Array.from(this.errors.values());
  }

  // Obter erros por tipo
  getErrorsByType(type: ErrorType): AppError[] {
    return this.getAllErrors().filter(error => error.type === type);
  }

  // Obter erros por severidade
  getErrorsBySeverity(severity: ErrorSeverity): AppError[] {
    return this.getAllErrors().filter(error => error.severity === severity);
  }

  // Adicionar listener para erros
  addErrorListener(listener: (error: AppError) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Métodos privados
  private processError(error: AppError, options: ErrorHandlerOptions): void {
    // Log no console (desenvolvimento)
    if (options.logToConsole !== false && process.env.NODE_ENV === 'development') {
      this.logToConsole(error);
    }

    // Log para serviço (produção)
    if (options.logToService !== false && process.env.NODE_ENV === 'production') {
      this.logToService(error);
    }

    // Notificar listeners
    this.notifyListeners(error);
  }

  private createErrorFromException(
    error: Error,
    options: Partial<AppError & ErrorHandlerOptions> = {}
  ): AppError {
    let type = ErrorType.UNKNOWN;
    let userMessage = 'Ocorreu um erro inesperado';

    // Detectar tipo baseado na mensagem/nome do erro
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      type = ErrorType.CLIENT_ERROR;
      userMessage = 'Erro interno da aplicação';
    } else if (error.message.includes('fetch') || error.message.includes('network')) {
      type = ErrorType.NETWORK;
      userMessage = 'Erro de conexão. Verifique sua internet.';
    } else if (error.message.includes('timeout')) {
      type = ErrorType.TIMEOUT;
      userMessage = 'A operação demorou muito para responder.';
    }

    return this.createError(
      type,
      error.message,
      userMessage,
      {
        stack: error.stack,
        details: { name: error.name, cause: (error as any).cause },
        ...options,
      }
    );
  }

  private isAppError(error: any): error is AppError {
    return error && typeof error === 'object' && 'id' in error && 'type' in error;
  }

  private determineSeverity(type: ErrorType): ErrorSeverity {
    switch (type) {
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return ErrorSeverity.HIGH;
      case ErrorType.SERVER_ERROR:
        return ErrorSeverity.CRITICAL;
      case ErrorType.NETWORK:
      case ErrorType.TIMEOUT:
        return ErrorSeverity.MEDIUM;
      case ErrorType.VALIDATION:
      case ErrorType.NOT_FOUND:
        return ErrorSeverity.LOW;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  private isRetryable(type: ErrorType): boolean {
    return [
      ErrorType.NETWORK,
      ErrorType.TIMEOUT,
      ErrorType.SERVER_ERROR,
    ].includes(type);
  }

  private getDefaultUserMessage(type: ErrorType): string {
    const messages = {
      [ErrorType.NETWORK]: 'Problema de conexão. Verifique sua internet.',
      [ErrorType.VALIDATION]: 'Dados inválidos fornecidos.',
      [ErrorType.AUTHENTICATION]: 'Você precisa fazer login.',
      [ErrorType.AUTHORIZATION]: 'Você não tem permissão para esta ação.',
      [ErrorType.NOT_FOUND]: 'Item não encontrado.',
      [ErrorType.SERVER_ERROR]: 'Erro interno do servidor.',
      [ErrorType.CLIENT_ERROR]: 'Erro na aplicação.',
      [ErrorType.TIMEOUT]: 'Operação demorou muito para responder.',
      [ErrorType.UNKNOWN]: 'Ocorreu um erro inesperado.',
    };

    return messages[type] || 'Ocorreu um erro.';
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logToConsole(error: AppError): void {
    const style = this.getConsoleStyle(error.severity);
    
    console.group(`%c🚨 ${error.severity} ERROR`, style);
    console.log('ID:', error.id);
    console.log('Type:', error.type);
    console.log('Message:', error.message);
    console.log('User Message:', error.userMessage);
    console.log('Timestamp:', new Date(error.timestamp).toISOString());
    
    if (error.context) {
      console.log('Context:', error.context);
    }
    
    if (error.details) {
      console.log('Details:', error.details);
    }
    
    if (error.stack) {
      console.log('Stack:', error.stack);
    }
    
    console.groupEnd();
  }

  private getConsoleStyle(severity: ErrorSeverity): string {
    const styles = {
      [ErrorSeverity.LOW]: 'color: #059669; font-weight: bold;',
      [ErrorSeverity.MEDIUM]: 'color: #d97706; font-weight: bold;',
      [ErrorSeverity.HIGH]: 'color: #dc2626; font-weight: bold;',
      [ErrorSeverity.CRITICAL]: 'color: #991b1b; font-weight: bold; background: #fef2f2;',
    };

    return styles[severity];
  }

  private async logToService(error: AppError): Promise<void> {
    try {
      // Aqui você integraria com serviços como Sentry, LogRocket, etc.
      // Por enquanto, apenas um placeholder
      console.log('Logging to service:', error);
      
      // Exemplo de integração:
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(error),
      // });
    } catch (logError) {
      console.error('Failed to log error to service:', logError);
    }
  }

  private notifyListeners(error: AppError): void {
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }
}

// Instância singleton
export const errorHandler = new ErrorHandler();

// Helpers para uso comum
export const createError = (
  type: ErrorType,
  message: string,
  userMessage?: string,
  options?: Partial<AppError & ErrorHandlerOptions>
) => errorHandler.createError(type, message, userMessage, options);

export const handleError = (
  error: Error | AppError | any,
  options?: ErrorHandlerOptions
) => errorHandler.handleError(error, options);

export const handleApiError = (
  response: Response | any,
  options?: ErrorHandlerOptions
) => errorHandler.handleApiError(response, options);

// Hook para React (será usado em outro arquivo)
export const useErrorHandler = () => {
  return {
    handleError,
    handleApiError,
    createError,
    retry: (errorId: string) => errorHandler.retry(errorId),
    clearError: (errorId: string) => errorHandler.clearError(errorId),
    clearAllErrors: () => errorHandler.clearAllErrors(),
    getError: (errorId: string) => errorHandler.getError(errorId),
    getAllErrors: () => errorHandler.getAllErrors(),
    addErrorListener: (listener: (error: AppError) => void) => 
      errorHandler.addErrorListener(listener),
  };
};

export default errorHandler; 