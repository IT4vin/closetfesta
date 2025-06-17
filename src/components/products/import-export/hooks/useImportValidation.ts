import { useState, useCallback } from 'react';
import { parseImportedExcel, convertTemplateRowsToProducts, ProductTemplateRow } from '@/utils/excelUtils';
import { useToast } from '@/hooks/use-toast';

export type ImportStage = 'upload' | 'preview' | 'errors';

export interface ValidationError {
  row: number;
  column: string;
  message: string;
}

export interface ImportValidationState {
  stage: ImportStage;
  validData: ProductTemplateRow[];
  errors: ValidationError[];
  isProcessing: boolean;
}

export const useImportValidation = () => {
  const { toast } = useToast();
  
  const [state, setState] = useState<ImportValidationState>({
    stage: 'upload',
    validData: [],
    errors: [],
    isProcessing: false,
  });

  // Processar arquivo Excel
  const processExcelFile = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const result = await parseImportedExcel(file);
      
      setState(prev => ({
        ...prev,
        validData: result.validData,
        errors: result.errors,
        stage: result.errors.length > 0 ? 'errors' : 
               result.validData.length > 0 ? 'preview' : 'upload',
        isProcessing: false,
      }));

      // Mostrar feedback baseado no resultado
      if (result.errors.length > 0) {
        toast({
          title: 'Erros encontrados',
          description: `${result.errors.length} problemas foram identificados no arquivo.`,
          variant: 'destructive',
        });
      } else if (result.validData.length === 0) {
        toast({
          title: 'Arquivo vazio',
          description: 'O arquivo não contém dados válidos para importação.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Validação concluída',
          description: `${result.validData.length} produtos validados com sucesso.`,
        });
      }
      
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false }));
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: 'Erro na validação',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw error;
    }
  }, [toast]);

  // Converter dados validados para produtos
  const convertToProducts = useCallback(() => {
    try {
      const products = convertTemplateRowsToProducts(state.validData);
      
      toast({
        title: 'Conversão concluída',
        description: `${products.length} produtos convertidos com sucesso.`,
      });
      
      return products;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na conversão';
      
      toast({
        title: 'Erro na conversão',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw error;
    }
  }, [state.validData, toast]);

  // Navegar entre estágios
  const goToStage = useCallback((stage: ImportStage) => {
    setState(prev => ({ ...prev, stage }));
  }, []);

  // Reset do estado
  const reset = useCallback(() => {
    setState({
      stage: 'upload',
      validData: [],
      errors: [],
      isProcessing: false,
    });
  }, []);

  // Estatísticas dos dados
  const getStats = useCallback(() => {
    return {
      totalValid: state.validData.length,
      totalErrors: state.errors.length,
      hasData: state.validData.length > 0,
      hasErrors: state.errors.length > 0,
      canProceed: state.validData.length > 0 && state.stage === 'preview',
    };
  }, [state]);

  // Agrupar erros por tipo
  const getErrorsByType = useCallback(() => {
    const errorTypes: Record<string, ValidationError[]> = {};
    
    state.errors.forEach(error => {
      if (!errorTypes[error.column]) {
        errorTypes[error.column] = [];
      }
      errorTypes[error.column].push(error);
    });
    
    return errorTypes;
  }, [state.errors]);

  // Obter erros críticos (que impedem importação)
  const getCriticalErrors = useCallback(() => {
    return state.errors.filter(error => 
      ['Nome', 'SKU', 'Preço Venda'].includes(error.column)
    );
  }, [state.errors]);

  return {
    // Estado
    ...state,
    
    // Métodos principais
    processExcelFile,
    convertToProducts,
    goToStage,
    reset,
    
    // Utilitários
    getStats,
    getErrorsByType,
    getCriticalErrors,
    
    // Estados derivados
    stats: getStats(),
    errorsByType: getErrorsByType(),
    criticalErrors: getCriticalErrors(),
  };
}; 