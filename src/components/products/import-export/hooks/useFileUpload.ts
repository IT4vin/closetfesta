import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface FileUploadState {
  dragActive: boolean;
  fileName: string | null;
  isUploading: boolean;
  file: File | null;
}

export interface FileUploadOptions {
  acceptedTypes?: string[];
  maxSize?: number; // em bytes
  onFileSelect?: (file: File) => void;
  onError?: (error: string) => void;
}

export const useFileUpload = (options: FileUploadOptions = {}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    acceptedTypes = ['.xlsx', '.xls'],
    maxSize = 10 * 1024 * 1024, // 10MB default
    onFileSelect,
    onError
  } = options;

  const [state, setState] = useState<FileUploadState>({
    dragActive: false,
    fileName: null,
    isUploading: false,
    file: null,
  });

  // Validar arquivo
  const validateFile = useCallback((file: File): string | null => {
    // Verificar tipo
    const hasValidExtension = acceptedTypes.some(type => 
      file.name.toLowerCase().endsWith(type.toLowerCase())
    );
    
    if (!hasValidExtension) {
      return `Formato não suportado. Tipos aceitos: ${acceptedTypes.join(', ')}`;
    }

    // Verificar tamanho
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`;
    }

    return null;
  }, [acceptedTypes, maxSize]);

  // Processar arquivo selecionado
  const processFile = useCallback((file: File) => {
    const error = validateFile(file);
    
    if (error) {
      toast({
        title: 'Arquivo inválido',
        description: error,
        variant: 'destructive',
      });
      
      if (onError) {
        onError(error);
      }
      return;
    }

    setState(prev => ({
      ...prev,
      file,
      fileName: file.name,
      isUploading: true,
    }));

    if (onFileSelect) {
      onFileSelect(file);
    }
  }, [validateFile, toast, onFileSelect, onError]);

  // Handlers para drag and drop
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setState(prev => ({ ...prev, dragActive: true }));
    } else if (e.type === 'dragleave') {
      setState(prev => ({ ...prev, dragActive: false }));
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, dragActive: false }));
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  // Handler para input file
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  }, [processFile]);

  // Abrir seletor de arquivo
  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Reset do estado
  const reset = useCallback(() => {
    setState({
      dragActive: false,
      fileName: null,
      isUploading: false,
      file: null,
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Finalizar upload
  const finishUpload = useCallback(() => {
    setState(prev => ({ ...prev, isUploading: false }));
  }, []);

  // Gerar props para área de drop
  const getDropzoneProps = useCallback(() => ({
    onDragEnter: handleDrag,
    onDragLeave: handleDrag,
    onDragOver: handleDrag,
    onDrop: handleDrop,
    onClick: openFileSelector,
  }), [handleDrag, handleDrop, openFileSelector]);

  // Gerar props para input file
  const getInputProps = useCallback(() => ({
    ref: fileInputRef,
    type: 'file' as const,
    accept: acceptedTypes.join(','),
    className: 'hidden',
    onChange: handleFileInput,
  }), [acceptedTypes, handleFileInput]);

  return {
    // Estado
    ...state,
    
    // Métodos
    processFile,
    reset,
    finishUpload,
    openFileSelector,
    
    // Props helpers
    getDropzoneProps,
    getInputProps,
    
    // Refs
    fileInputRef,
  };
}; 