import { useEffect, useRef } from 'react';
import { AUTO_SAVE_CONFIG } from '@/config/productFormConfig';

interface UseAutoSaveOptions {
  data: any;
  enabled?: boolean;
  onSave?: (data: any) => void;
  storageKey?: string;
  intervalMs?: number;
}

export const useAutoSave = ({
  data,
  enabled = AUTO_SAVE_CONFIG.enabled,
  onSave,
  storageKey = AUTO_SAVE_CONFIG.storageKey,
  intervalMs = AUTO_SAVE_CONFIG.intervalMs,
}: UseAutoSaveOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');

  // Salva dados no localStorage
  const saveToStorage = (dataToSave: any) => {
    try {
      const serialized = JSON.stringify({
        data: dataToSave,
        timestamp: Date.now(),
        version: '1.0'
      });
      
      // Só salva se os dados mudaram
      if (serialized !== lastSavedRef.current) {
        localStorage.setItem(storageKey, serialized);
        lastSavedRef.current = serialized;
        
        if (onSave) {
          onSave(dataToSave);
        }
        
        console.log('📄 Rascunho salvo automaticamente');
      }
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
    }
  };

  // Carrega dados do localStorage
  const loadFromStorage = (): any | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      return parsed.data;
    } catch (error) {
      console.error('Erro ao carregar rascunho:', error);
      return null;
    }
  };

  // Remove rascunho do localStorage
  const clearStorage = () => {
    try {
      localStorage.removeItem(storageKey);
      lastSavedRef.current = '';
      console.log('🗑️ Rascunho removido');
    } catch (error) {
      console.error('Erro ao limpar rascunho:', error);
    }
  };

  // Verifica se existe rascunho salvo
  const hasDraft = (): boolean => {
    return localStorage.getItem(storageKey) !== null;
  };

  // Obtém informações do rascunho
  const getDraftInfo = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      return {
        timestamp: parsed.timestamp,
        version: parsed.version,
        data: parsed.data
      };
    } catch (error) {
      return null;
    }
  };

  // Effect para salvamento automático
  useEffect(() => {
    if (!enabled || !data) return;

    // Limpa timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Agenda novo salvamento
    timeoutRef.current = setTimeout(() => {
      saveToStorage(data);
    }, intervalMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, intervalMs, storageKey]);

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    saveToStorage,
    loadFromStorage,
    clearStorage,
    hasDraft,
    getDraftInfo,
    isAutoSaveEnabled: enabled
  };
}; 