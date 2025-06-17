import { useState, useCallback, useRef, useEffect } from 'react';

export type LoadingType = 
  | 'initial'     // Carregamento inicial da página/componente
  | 'action'      // Ação do usuário (salvar, deletar, etc.)
  | 'background'  // Carregamento em background
  | 'refresh'     // Atualização de dados
  | 'pagination' // Carregamento de mais dados
  | 'search';     // Busca/filtro

export interface LoadingState {
  isLoading: boolean;
  type: LoadingType | null;
  message?: string;
  progress?: number; // 0-100
  startTime?: number;
  duration?: number;
}

export interface LoadingOptions {
  type?: LoadingType;
  message?: string;
  minDuration?: number; // Duração mínima em ms
  showProgress?: boolean;
  debounceMs?: number;
}

export interface UseLoadingStateReturn {
  // Estado atual
  loading: LoadingState;
  
  // Controles básicos
  startLoading: (options?: LoadingOptions) => void;
  stopLoading: () => void;
  setProgress: (progress: number) => void;
  
  // Helpers para diferentes tipos
  startInitialLoading: (message?: string) => void;
  startActionLoading: (message?: string) => void;
  startBackgroundLoading: (message?: string) => void;
  startRefreshLoading: (message?: string) => void;
  startPaginationLoading: (message?: string) => void;
  startSearchLoading: (message?: string) => void;
  
  // Wrapper para promises
  withLoading: <T>(
    promise: Promise<T>,
    options?: LoadingOptions
  ) => Promise<T>;
  
  // Estado derivado
  isInitialLoading: boolean;
  isActionLoading: boolean;
  isBackgroundLoading: boolean;
  isRefreshLoading: boolean;
  isPaginationLoading: boolean;
  isSearchLoading: boolean;
  
  // Utilitários
  hasBeenLoading: (minMs: number) => boolean;
  getLoadingDuration: () => number;
}

const DEFAULT_MESSAGES: Record<LoadingType, string> = {
  initial: 'Carregando...',
  action: 'Processando...',
  background: 'Atualizando...',
  refresh: 'Atualizando dados...',
  pagination: 'Carregando mais...',
  search: 'Buscando...',
};

export const useLoadingState = (
  initialLoading = false,
  initialType: LoadingType = 'initial'
): UseLoadingStateReturn => {
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: initialLoading,
    type: initialLoading ? initialType : null,
    message: initialLoading ? DEFAULT_MESSAGES[initialType] : undefined,
    startTime: initialLoading ? Date.now() : undefined,
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const debounceRef = useRef<NodeJS.Timeout>();
  const minDurationRef = useRef<number>(0);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const startLoading = useCallback((options: LoadingOptions = {}) => {
    const {
      type = 'initial',
      message = DEFAULT_MESSAGES[type],
      minDuration = 0,
      debounceMs = 0,
    } = options;

    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const doStartLoading = () => {
      const startTime = Date.now();
      minDurationRef.current = startTime + minDuration;

      setLoading({
        isLoading: true,
        type,
        message,
        progress: options.showProgress ? 0 : undefined,
        startTime,
      });
    };

    // Debounce se especificado
    if (debounceMs > 0) {
      debounceRef.current = setTimeout(doStartLoading, debounceMs);
    } else {
      doStartLoading();
    }
  }, []);

  const stopLoading = useCallback(() => {
    // Clear debounce se ainda não executou
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = undefined;
      return;
    }

    const now = Date.now();
    const remainingTime = Math.max(0, minDurationRef.current - now);

    const doStopLoading = () => {
      setLoading(prev => ({
        ...prev,
        isLoading: false,
        type: null,
        message: undefined,
        progress: undefined,
        duration: prev.startTime ? now - prev.startTime : undefined,
      }));
    };

    if (remainingTime > 0) {
      timeoutRef.current = setTimeout(doStopLoading, remainingTime);
    } else {
      doStopLoading();
    }
  }, []);

  const setProgress = useCallback((progress: number) => {
    setLoading(prev => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress)),
    }));
  }, []);

  // Helpers para diferentes tipos
  const startInitialLoading = useCallback((message?: string) => {
    startLoading({ type: 'initial', message, minDuration: 300 });
  }, [startLoading]);

  const startActionLoading = useCallback((message?: string) => {
    startLoading({ type: 'action', message, minDuration: 500 });
  }, [startLoading]);

  const startBackgroundLoading = useCallback((message?: string) => {
    startLoading({ type: 'background', message, debounceMs: 100 });
  }, [startLoading]);

  const startRefreshLoading = useCallback((message?: string) => {
    startLoading({ type: 'refresh', message, minDuration: 200 });
  }, [startLoading]);

  const startPaginationLoading = useCallback((message?: string) => {
    startLoading({ type: 'pagination', message });
  }, [startLoading]);

  const startSearchLoading = useCallback((message?: string) => {
    startLoading({ type: 'search', message, debounceMs: 300 });
  }, [startLoading]);

  // Wrapper para promises
  const withLoading = useCallback(async <T>(
    promise: Promise<T>,
    options: LoadingOptions = {}
  ): Promise<T> => {
    try {
      startLoading(options);
      const result = await promise;
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  // Estados derivados
  const isInitialLoading = loading.isLoading && loading.type === 'initial';
  const isActionLoading = loading.isLoading && loading.type === 'action';
  const isBackgroundLoading = loading.isLoading && loading.type === 'background';
  const isRefreshLoading = loading.isLoading && loading.type === 'refresh';
  const isPaginationLoading = loading.isLoading && loading.type === 'pagination';
  const isSearchLoading = loading.isLoading && loading.type === 'search';

  // Utilitários
  const hasBeenLoading = useCallback((minMs: number): boolean => {
    if (!loading.startTime) return false;
    return Date.now() - loading.startTime >= minMs;
  }, [loading.startTime]);

  const getLoadingDuration = useCallback((): number => {
    if (!loading.startTime) return 0;
    return Date.now() - loading.startTime;
  }, [loading.startTime]);

  return {
    loading,
    startLoading,
    stopLoading,
    setProgress,
    startInitialLoading,
    startActionLoading,
    startBackgroundLoading,
    startRefreshLoading,
    startPaginationLoading,
    startSearchLoading,
    withLoading,
    isInitialLoading,
    isActionLoading,
    isBackgroundLoading,
    isRefreshLoading,
    isPaginationLoading,
    isSearchLoading,
    hasBeenLoading,
    getLoadingDuration,
  };
}; 