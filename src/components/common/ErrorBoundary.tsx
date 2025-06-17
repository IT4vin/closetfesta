import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
  enableRecovery?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRecovering: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log do erro
    this.logError(error, errorInfo);

    // Callback personalizado
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-recovery para erros não críticos
    if (this.props.enableRecovery && this.props.level !== 'critical') {
      this.scheduleRecovery();
    }
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      level: this.props.level || 'component',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Em produção, enviar para serviço de logging
    if (process.env.NODE_ENV === 'production') {
      // Aqui você integraria com Sentry, LogRocket, etc.
      console.error('Error Boundary:', errorData);
    } else {
      console.group('🚨 Error Boundary');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Full Data:', errorData);
      console.groupEnd();
    }
  };

  private scheduleRecovery = () => {
    if (this.state.retryCount >= this.maxRetries) return;

    this.setState({ isRecovering: true });

    this.retryTimeoutId = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRecovering: false,
      }));
    }, 2000 + this.state.retryCount * 1000); // Backoff progressivo
  };

  private handleManualRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      window.location.reload();
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isRecovering: false,
    }));
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      // Fallback customizado
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback baseado no nível do erro
      return this.renderErrorFallback();
    }

    return this.props.children;
  }

  private renderErrorFallback = () => {
    const { level = 'component' } = this.props;
    const { error, retryCount, isRecovering } = this.state;

    const errorMessages = {
      page: 'Ops! Algo deu errado nesta página.',
      component: 'Este componente encontrou um problema.',
      critical: 'Erro crítico do sistema detectado.',
    };

    const canRetry = retryCount < this.maxRetries;
    const shouldShowDetails = process.env.NODE_ENV === 'development';

    return (
      <div className={`error-boundary error-boundary--${level}`}>
        <div className="error-boundary__content">
          <div className="error-boundary__icon">
            {level === 'critical' ? (
              <Bug className="w-12 h-12 text-red-500" />
            ) : (
              <AlertTriangle className="w-12 h-12 text-yellow-500" />
            )}
          </div>

          <h2 className="error-boundary__title">
            {errorMessages[level]}
          </h2>

          <p className="error-boundary__message">
            {level === 'critical' 
              ? 'Por favor, recarregue a página ou entre em contato com o suporte.'
              : 'Não se preocupe, você pode tentar novamente ou voltar à página inicial.'
            }
          </p>

          {shouldShowDetails && error && (
            <details className="error-boundary__details">
              <summary>Detalhes técnicos (desenvolvimento)</summary>
              <pre className="error-boundary__stack">
                {error.message}
                {'\n\n'}
                {error.stack}
              </pre>
            </details>
          )}

          <div className="error-boundary__actions">
            {isRecovering ? (
              <div className="error-boundary__recovering">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Tentando recuperar...</span>
              </div>
            ) : (
              <>
                {canRetry && level !== 'critical' && (
                  <button
                    onClick={this.handleManualRetry}
                    className="btn btn--primary"
                    disabled={isRecovering}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Tentar Novamente
                    {retryCount > 0 && ` (${retryCount}/${this.maxRetries})`}
                  </button>
                )}

                <button
                  onClick={this.handleGoHome}
                  className="btn btn--secondary"
                >
                  <Home className="w-4 h-4" />
                  Ir para Início
                </button>

                {!canRetry && (
                  <button
                    onClick={() => window.location.reload()}
                    className="btn btn--primary"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Recarregar Página
                  </button>
                )}
              </>
            )}
          </div>

          {retryCount > 0 && (
            <p className="error-boundary__retry-info">
              Tentativas: {retryCount}/{this.maxRetries}
            </p>
          )}
        </div>

        <style>{`
          .error-boundary {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            padding: 2rem;
            background: #fafafa;
            border-radius: 8px;
            border: 1px solid #e5e5e5;
          }

          .error-boundary--page {
            min-height: 400px;
            background: #fff;
          }

          .error-boundary--critical {
            background: #fef2f2;
            border-color: #fecaca;
          }

          .error-boundary__content {
            text-align: center;
            max-width: 500px;
          }

          .error-boundary__icon {
            margin-bottom: 1rem;
          }

          .error-boundary__title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #374151;
          }

          .error-boundary__message {
            color: #6b7280;
            margin-bottom: 1.5rem;
            line-height: 1.5;
          }

          .error-boundary__details {
            margin: 1rem 0;
            text-align: left;
          }

          .error-boundary__details summary {
            cursor: pointer;
            font-weight: 500;
            margin-bottom: 0.5rem;
          }

          .error-boundary__stack {
            background: #f3f4f6;
            padding: 1rem;
            border-radius: 4px;
            font-size: 0.875rem;
            overflow-x: auto;
            white-space: pre-wrap;
            word-break: break-word;
          }

          .error-boundary__actions {
            display: flex;
            gap: 0.75rem;
            justify-content: center;
            flex-wrap: wrap;
          }

          .error-boundary__recovering {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #6b7280;
            font-weight: 500;
          }

          .error-boundary__retry-info {
            margin-top: 1rem;
            font-size: 0.875rem;
            color: #6b7280;
          }

          .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-weight: 500;
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .btn--primary {
            background: #3b82f6;
            color: white;
          }

          .btn--primary:hover:not(:disabled) {
            background: #2563eb;
          }

          .btn--secondary {
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #d1d5db;
          }

          .btn--secondary:hover:not(:disabled) {
            background: #e5e7eb;
          }
        `}</style>
      </div>
    );
  };
}

// HOC para facilitar o uso
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default ErrorBoundary; 