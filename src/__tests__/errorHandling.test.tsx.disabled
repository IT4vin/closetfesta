import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary, withErrorBoundary } from '../components/common/ErrorBoundary';
import { useLoadingState } from '../hooks/useLoadingState';
import { LoadingSpinner, LoadingOverlay, Skeleton } from '../components/ui/LoadingSpinner';
import { errorHandler, ErrorType, ErrorSeverity, handleError, handleApiError } from '../utils/errorHandler';

// Mock console methods
const originalConsole = { ...console };
beforeEach(() => {
  console.error = vi.fn();
  console.group = vi.fn();
  console.groupEnd = vi.fn();
  console.log = vi.fn();
});

afterEach(() => {
  Object.assign(console, originalConsole);
  errorHandler.clearAllErrors();
  vi.clearAllMocks();
});

// Componente que gera erro para testes
const ErrorComponent: React.FC<{ shouldError?: boolean; errorMessage?: string }> = ({ 
  shouldError = true, 
  errorMessage = 'Test error' 
}) => {
  if (shouldError) {
    throw new Error(errorMessage);
  }
  return <div>No error</div>;
};

// Componente que usa loading state
const LoadingTestComponent: React.FC = () => {
  const {
    loading,
    startLoading,
    stopLoading,
    startActionLoading,
    withLoading,
    isActionLoading,
  } = useLoadingState();

  const handleAsyncAction = async () => {
    await withLoading(
      new Promise(resolve => setTimeout(resolve, 100)),
      { type: 'action', message: 'Processing...' }
    );
  };

  return (
    <div>
      <div data-testid="loading-state">
        {loading.isLoading ? 'Loading' : 'Not Loading'}
      </div>
      <div data-testid="loading-type">{loading.type || 'None'}</div>
      <div data-testid="loading-message">{loading.message || 'No message'}</div>
      <div data-testid="is-action-loading">{isActionLoading ? 'Yes' : 'No'}</div>
      
      <button onClick={() => startActionLoading('Custom action')}>
        Start Action Loading
      </button>
      <button onClick={stopLoading}>Stop Loading</button>
      <button onClick={handleAsyncAction}>Async Action</button>
    </div>
  );
};

describe('ErrorBoundary', () => {
  it('deve capturar e exibir erros', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Este componente encontrou um problema/)).toBeInTheDocument();
    expect(screen.getByText(/Tentar Novamente/)).toBeInTheDocument();
    expect(screen.getByText(/Ir para Início/)).toBeInTheDocument();
  });

  it('deve exibir diferentes mensagens baseadas no nível', () => {
    const { rerender } = render(
      <ErrorBoundary level="page">
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Ops! Algo deu errado nesta página/)).toBeInTheDocument();

    rerender(
      <ErrorBoundary level="critical">
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Erro crítico do sistema detectado/)).toBeInTheDocument();
  });

  it('deve permitir retry manual', async () => {
    let shouldError = true;
    const TestComponent = () => {
      if (shouldError) {
        throw new Error('Test error');
      }
      return <div>Success</div>;
    };

    render(
      <ErrorBoundary level="component" enableRecovery={true}>
        <TestComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Este componente encontrou um problema/)).toBeInTheDocument();

    // Simular correção do erro
    shouldError = false;
    
    const retryButton = screen.getByText(/Tentar Novamente/);
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });

  it('deve exibir detalhes técnicos em desenvolvimento', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ErrorComponent errorMessage="Detailed test error" />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Detalhes técnicos/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('deve usar fallback customizado quando fornecido', () => {
    const customFallback = <div>Custom error fallback</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
  });

  it('deve chamar callback onError quando fornecido', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ErrorComponent errorMessage="Callback test error" />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Callback test error' }),
      expect.any(Object)
    );
  });

  it('deve limitar tentativas de retry', async () => {
    let errorCount = 0;
    const TestComponent = () => {
      errorCount++;
      throw new Error(`Error ${errorCount}`);
    };

    render(
      <ErrorBoundary level="component" enableRecovery={true}>
        <TestComponent />
      </ErrorBoundary>
    );

    // Primeira tentativa
    const retryButton = screen.getByText(/Tentar Novamente/);
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText(/\(1\/3\)/)).toBeInTheDocument();
    });

    // Segunda tentativa
    fireEvent.click(screen.getByText(/Tentar Novamente/));

    await waitFor(() => {
      expect(screen.getByText(/\(2\/3\)/)).toBeInTheDocument();
    });

    // Terceira tentativa
    fireEvent.click(screen.getByText(/Tentar Novamente/));

    await waitFor(() => {
      expect(screen.getByText(/Recarregar Página/)).toBeInTheDocument();
      expect(screen.queryByText(/Tentar Novamente/)).not.toBeInTheDocument();
    });
  });
});

describe('withErrorBoundary HOC', () => {
  it('deve envolver componente com ErrorBoundary', () => {
    const TestComponent = () => <div>Test Component</div>;
    const WrappedComponent = withErrorBoundary(TestComponent, { level: 'page' });

    render(<WrappedComponent />);

    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('deve capturar erros no componente envolvido', () => {
    const WrappedErrorComponent = withErrorBoundary(ErrorComponent, { level: 'component' });

    render(<WrappedErrorComponent />);

    expect(screen.getByText(/Este componente encontrou um problema/)).toBeInTheDocument();
  });
});

describe('useLoadingState', () => {
  it('deve gerenciar estado de loading básico', async () => {
    render(<LoadingTestComponent />);

    expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    expect(screen.getByTestId('loading-type')).toHaveTextContent('None');

    fireEvent.click(screen.getByText('Start Action Loading'));

    expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading');
    expect(screen.getByTestId('loading-type')).toHaveTextContent('action');
    expect(screen.getByTestId('loading-message')).toHaveTextContent('Custom action');
    expect(screen.getByTestId('is-action-loading')).toHaveTextContent('Yes');

    fireEvent.click(screen.getByText('Stop Loading'));

    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('is-action-loading')).toHaveTextContent('No');
    });
  });

  it('deve funcionar com promises usando withLoading', async () => {
    render(<LoadingTestComponent />);

    fireEvent.click(screen.getByText('Async Action'));

    expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading');
    expect(screen.getByTestId('loading-message')).toHaveTextContent('Processing...');

    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    }, { timeout: 200 });
  });
});

describe('LoadingSpinner', () => {
  it('deve renderizar spinner básico', () => {
    render(<LoadingSpinner />);
    
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('deve renderizar diferentes variantes', () => {
    const { rerender } = render(<LoadingSpinner variant="dots" />);
    
    // Dots variant should render multiple dots
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(3);

    rerender(<LoadingSpinner variant="bars" />);
    
    // Bars variant should render multiple bars
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(4);
  });

  it('deve exibir mensagem personalizada', () => {
    render(<LoadingSpinner message="Custom loading message" />);
    
    expect(screen.getByText('Custom loading message')).toBeInTheDocument();
  });

  it('deve exibir progresso quando fornecido', () => {
    render(<LoadingSpinner progress={75} showProgress={true} />);
    
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Progresso')).toBeInTheDocument();
  });

  it('deve usar mensagem baseada no tipo', () => {
    render(<LoadingSpinner type="search" />);
    
    expect(screen.getByText('Realizando busca...')).toBeInTheDocument();
  });
});

describe('LoadingOverlay', () => {
  it('deve renderizar quando visível', () => {
    render(<LoadingOverlay isVisible={true} />);
    
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('não deve renderizar quando não visível', () => {
    render(<LoadingOverlay isVisible={false} />);
    
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
  });

  it('deve aplicar diferentes backdrops', () => {
    const { rerender } = render(<LoadingOverlay isVisible={true} backdrop="dark" />);
    
    expect(document.querySelector('.bg-black')).toBeInTheDocument();

    rerender(<LoadingOverlay isVisible={true} backdrop="blur" />);
    
    expect(document.querySelector('.backdrop-blur-sm')).toBeInTheDocument();
  });
});

describe('Skeleton', () => {
  it('deve renderizar skeleton básico', () => {
    render(<Skeleton />);
    
    expect(document.querySelector('.bg-gray-200')).toBeInTheDocument();
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('deve aplicar dimensões customizadas', () => {
    render(<Skeleton width="200px" height="50px" />);
    
    const skeleton = document.querySelector('.bg-gray-200') as HTMLElement;
    expect(skeleton.style.width).toBe('200px');
    expect(skeleton.style.height).toBe('50px');
  });

  it('deve renderizar diferentes variantes', () => {
    const { rerender } = render(<Skeleton variant="circular" />);
    
    expect(document.querySelector('.rounded-full')).toBeInTheDocument();

    rerender(<Skeleton variant="rectangular" />);
    
    expect(document.querySelector('.rounded-md')).toBeInTheDocument();
  });
});

describe('ErrorHandler', () => {
  it('deve criar erro estruturado', () => {
    const error = errorHandler.createError(
      ErrorType.NETWORK,
      'Network failed',
      'Check your connection'
    );

    expect(error.type).toBe(ErrorType.NETWORK);
    expect(error.message).toBe('Network failed');
    expect(error.userMessage).toBe('Check your connection');
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.retryable).toBe(true);
  });

  it('deve processar erro de JavaScript', () => {
    const jsError = new Error('JavaScript error');
    const appError = handleError(jsError);

    expect(appError.type).toBe(ErrorType.UNKNOWN);
    expect(appError.message).toBe('JavaScript error');
    expect(appError.stack).toBeDefined();
  });

  it('deve processar erro de API', () => {
    const apiResponse = { status: 404, statusText: 'Not Found' };
    const appError = handleApiError(apiResponse);

    expect(appError.type).toBe(ErrorType.NOT_FOUND);
    expect(appError.severity).toBe(ErrorSeverity.LOW);
    expect(appError.userMessage).toBe('O item solicitado não foi encontrado.');
  });

  it('deve determinar severidade corretamente', () => {
    const authError = errorHandler.createError(ErrorType.AUTHENTICATION, 'Auth failed');
    const serverError = errorHandler.createError(ErrorType.SERVER_ERROR, 'Server failed');
    const validationError = errorHandler.createError(ErrorType.VALIDATION, 'Invalid data');

    expect(authError.severity).toBe(ErrorSeverity.HIGH);
    expect(serverError.severity).toBe(ErrorSeverity.CRITICAL);
    expect(validationError.severity).toBe(ErrorSeverity.LOW);
  });

  it('deve identificar erros retryable', () => {
    const networkError = errorHandler.createError(ErrorType.NETWORK, 'Network failed');
    const validationError = errorHandler.createError(ErrorType.VALIDATION, 'Invalid data');

    expect(networkError.retryable).toBe(true);
    expect(validationError.retryable).toBe(false);
  });

  it('deve gerenciar listeners de erro', () => {
    const listener = vi.fn();
    const removeListener = errorHandler.addErrorListener(listener);

    const error = handleError(new Error('Test error'));

    expect(listener).toHaveBeenCalledWith(error);

    removeListener();
    handleError(new Error('Another error'));

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('deve filtrar erros por tipo e severidade', () => {
    errorHandler.createError(ErrorType.NETWORK, 'Network 1');
    errorHandler.createError(ErrorType.NETWORK, 'Network 2');
    errorHandler.createError(ErrorType.VALIDATION, 'Validation 1');

    const networkErrors = errorHandler.getErrorsByType(ErrorType.NETWORK);
    const lowSeverityErrors = errorHandler.getErrorsBySeverity(ErrorSeverity.LOW);

    expect(networkErrors).toHaveLength(2);
    expect(lowSeverityErrors).toHaveLength(1);
  });

  it('deve limpar erros', () => {
    const error1 = errorHandler.createError(ErrorType.NETWORK, 'Error 1');
    const error2 = errorHandler.createError(ErrorType.VALIDATION, 'Error 2');

    expect(errorHandler.getAllErrors()).toHaveLength(2);

    errorHandler.clearError(error1.id);
    expect(errorHandler.getAllErrors()).toHaveLength(1);

    errorHandler.clearAllErrors();
    expect(errorHandler.getAllErrors()).toHaveLength(0);
  });
});

describe('Integração Error Boundary + Loading States', () => {
  it('deve funcionar juntos em cenário real', async () => {
    const ProblematicComponent = () => {
      const { withLoading } = useLoadingState();
      const [shouldError, setShouldError] = React.useState(false);

      const handleAction = async () => {
        await withLoading(
          new Promise((resolve, reject) => {
            setTimeout(() => {
              if (shouldError) {
                reject(new Error('Async error'));
              } else {
                resolve('Success');
              }
            }, 50);
          }),
          { type: 'action', message: 'Processing...' }
        );
      };

      if (shouldError) {
        throw new Error('Component error');
      }

      return (
        <div>
          <button onClick={() => setShouldError(true)}>Trigger Error</button>
          <button onClick={handleAction}>Async Action</button>
        </div>
      );
    };

    render(
      <ErrorBoundary level="component" enableRecovery={true}>
        <ProblematicComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Trigger Error')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Trigger Error'));

    expect(screen.getByText(/Este componente encontrou um problema/)).toBeInTheDocument();
  });
}); 