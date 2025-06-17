import React from 'react';
import { Upload, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileDropzoneProps {
  dragActive: boolean;
  fileName: string | null;
  isUploading: boolean;
  acceptedTypes?: string[];
  className?: string;
  children?: React.ReactNode;
  dropzoneProps: {
    onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    onClick: () => void;
  };
  inputProps: {
    ref: React.RefObject<HTMLInputElement>;
    type: 'file';
    accept: string;
    className: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  dragActive,
  fileName,
  isUploading,
  acceptedTypes = ['.xlsx', '.xls'],
  className,
  children,
  dropzoneProps,
  inputProps,
}) => {
  const getDropzoneClasses = () => {
    return cn(
      'border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-200',
      {
        'border-blue-400 bg-blue-50 dark:bg-blue-950/20': dragActive,
        'border-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950/20': !dragActive,
        'pointer-events-none opacity-60': isUploading,
      },
      className
    );
  };

  const renderContent = () => {
    if (children) {
      return children;
    }

    if (fileName) {
      return (
        <div className="space-y-3">
          <FileText size={48} className="mx-auto text-gray-500" />
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {fileName}
            </p>
            {isUploading ? (
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Processando arquivo...
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Arquivo selecionado
              </p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <Upload 
          size={48} 
          className={cn(
            'mx-auto transition-colors',
            dragActive ? 'text-blue-500' : 'text-gray-400'
          )} 
        />
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {dragActive 
              ? 'Solte o arquivo aqui' 
              : 'Arraste o arquivo ou clique para selecionar'
            }
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Tipos aceitos: {acceptedTypes.join(', ')}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className={getDropzoneClasses()} {...dropzoneProps}>
      <input {...inputProps} />
      {renderContent()}
    </div>
  );
}; 