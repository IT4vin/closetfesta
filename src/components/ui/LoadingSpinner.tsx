import React from 'react';
import { LoadingType } from '../../hooks/useLoadingState';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'ring';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  type?: LoadingType;
  message?: string;
  progress?: number;
  className?: string;
  showMessage?: boolean;
  showProgress?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const colorClasses = {
  primary: 'text-blue-600',
  secondary: 'text-gray-600',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
};

const typeMessages = {
  initial: 'Carregando página...',
  action: 'Processando sua solicitação...',
  background: 'Atualizando dados...',
  refresh: 'Sincronizando informações...',
  pagination: 'Carregando mais itens...',
  search: 'Realizando busca...',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'spinner',
  color = 'primary',
  type,
  message,
  progress,
  className = '',
  showMessage = true,
  showProgress = false,
}) => {
  const sizeClass = sizeClasses[size];
  const colorClass = colorClasses[color];
  const displayMessage = message || (type ? typeMessages[type] : 'Carregando...');

  const renderSpinner = () => {
    switch (variant) {
      case 'spinner':
        return (
          <svg
            className={`animate-spin ${sizeClass} ${colorClass}`}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );

      case 'dots':
        return (
          <div className={`flex space-x-1 ${colorClass}`}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`${size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'} bg-current rounded-full animate-pulse`}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s',
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div
            className={`${sizeClass} ${colorClass} bg-current rounded-full animate-pulse`}
            style={{ animationDuration: '1.5s' }}
          />
        );

      case 'bars':
        return (
          <div className={`flex space-x-1 ${colorClass}`}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`${size === 'sm' ? 'w-1 h-4' : size === 'md' ? 'w-1 h-6' : size === 'lg' ? 'w-2 h-8' : 'w-2 h-12'} bg-current animate-pulse`}
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1.2s',
                }}
              />
            ))}
          </div>
        );

      case 'ring':
        return (
          <div className={`${sizeClass} relative`}>
            <div className={`absolute inset-0 rounded-full border-2 border-gray-200`} />
            <div
              className={`absolute inset-0 rounded-full border-2 border-transparent border-t-current ${colorClass} animate-spin`}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const renderProgress = () => {
    if (!showProgress || progress === undefined) return null;

    return (
      <div className="mt-2 w-full max-w-xs">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progresso</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              color === 'primary' ? 'bg-blue-600' :
              color === 'secondary' ? 'bg-gray-600' :
              color === 'success' ? 'bg-green-600' :
              color === 'warning' ? 'bg-yellow-600' :
              'bg-red-600'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      {renderSpinner()}
      
      {showMessage && displayMessage && (
        <p className="mt-2 text-sm text-gray-600 text-center max-w-xs">
          {displayMessage}
        </p>
      )}
      
      {renderProgress()}
    </div>
  );
};

// Componente específico para overlay de loading
export interface LoadingOverlayProps extends LoadingSpinnerProps {
  isVisible: boolean;
  backdrop?: 'light' | 'dark' | 'blur';
  zIndex?: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  backdrop = 'light',
  zIndex = 50,
  ...spinnerProps
}) => {
  if (!isVisible) return null;

  const backdropClasses = {
    light: 'bg-white bg-opacity-80',
    dark: 'bg-black bg-opacity-50',
    blur: 'bg-white bg-opacity-70 backdrop-blur-sm',
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center ${backdropClasses[backdrop]}`}
      style={{ zIndex }}
    >
      <div className="bg-white rounded-lg shadow-lg p-6">
        <LoadingSpinner {...spinnerProps} />
      </div>
    </div>
  );
};

// Componente para loading inline
export interface InlineLoadingProps extends Omit<LoadingSpinnerProps, 'size'> {
  size?: 'xs' | 'sm' | 'md';
  position?: 'left' | 'right';
  children?: React.ReactNode;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  size = 'sm',
  position = 'left',
  children,
  showMessage = false,
  ...spinnerProps
}) => {
  const adjustedSize = size === 'xs' ? 'sm' : size === 'sm' ? 'md' : 'lg';

  return (
    <div className="flex items-center space-x-2">
      {position === 'left' && (
        <LoadingSpinner
          {...spinnerProps}
          size={adjustedSize}
          showMessage={showMessage}
          className="flex-shrink-0"
        />
      )}
      
      {children && <span className="flex-1">{children}</span>}
      
      {position === 'right' && (
        <LoadingSpinner
          {...spinnerProps}
          size={adjustedSize}
          showMessage={showMessage}
          className="flex-shrink-0"
        />
      )}
    </div>
  );
};

// Componente para skeleton loading
export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className = '',
  variant = 'text',
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200';
  
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // Pode ser customizado para wave
    none: '',
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Componente para múltiplos skeletons
export interface SkeletonGroupProps {
  lines?: number;
  spacing?: 'sm' | 'md' | 'lg';
  lastLineWidth?: string;
  className?: string;
}

export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({
  lines = 3,
  spacing = 'md',
  lastLineWidth = '60%',
  className = '',
}) => {
  const spacingClasses = {
    sm: 'space-y-1',
    md: 'space-y-2',
    lg: 'space-y-3',
  };

  return (
    <div className={`${spacingClasses[spacing]} ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? lastLineWidth : '100%'}
          height="1rem"
        />
      ))}
    </div>
  );
};

export default LoadingSpinner; 