import React from 'react';
import { AlertCircle, Download } from 'lucide-react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ValidationError } from '../hooks/useImportValidation';

export interface ImportErrorsProps {
  errors: ValidationError[];
  onDownloadTemplate?: () => void;
  className?: string;
}

export const ImportErrors: React.FC<ImportErrorsProps> = ({
  errors,
  onDownloadTemplate,
  className = '',
}) => {
  // Agrupar erros por tipo
  const errorsByType = errors.reduce((acc, error) => {
    if (!acc[error.column]) {
      acc[error.column] = [];
    }
    acc[error.column].push(error);
    return acc;
  }, {} as Record<string, ValidationError[]>);

  // Obter severidade do erro
  const getErrorSeverity = (column: string) => {
    const criticalFields = ['Nome', 'SKU', 'Preço Venda'];
    return criticalFields.includes(column) ? 'critical' : 'warning';
  };

  // Obter cor do badge baseado na severidade
  const getSeverityBadge = (column: string) => {
    const severity = getErrorSeverity(column);
    return severity === 'critical' ? (
      <Badge variant="destructive" className="text-xs">
        Crítico
      </Badge>
    ) : (
      <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
        Aviso
      </Badge>
    );
  };

  // Estatísticas dos erros
  const criticalErrors = errors.filter(error => getErrorSeverity(error.column) === 'critical');
  const warningErrors = errors.filter(error => getErrorSeverity(error.column) === 'warning');

  if (errors.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">Nenhum erro encontrado</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <AlertCircle size={20} className="text-red-600" />
          <span>Erros encontrados</span>
        </h3>
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          {errors.length} problemas
        </Badge>
      </div>

      {/* Resumo dos erros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {criticalErrors.length > 0 && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>{criticalErrors.length} erros críticos</strong> que impedem a importação
            </AlertDescription>
          </Alert>
        )}
        
        {warningErrors.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>{warningErrors.length} avisos</strong> que podem ser corrigidos
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Resumo por campo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(errorsByType).map(([column, columnErrors]) => (
          <div key={column} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{column}</span>
              {getSeverityBadge(column)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {columnErrors.length} erro{columnErrors.length > 1 ? 's' : ''}
            </p>
          </div>
        ))}
      </div>

      {/* Tabela de erros */}
      <div className="max-h-[400px] overflow-y-auto border rounded-md">
        <Table>
          <TableCaption>Corrija os erros e tente novamente</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Linha</TableHead>
              <TableHead className="w-[120px]">Campo</TableHead>
              <TableHead className="w-[100px]">Severidade</TableHead>
              <TableHead>Problema</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {errors.map((error, index) => (
              <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <TableCell className="font-mono text-sm">
                  {error.row}
                </TableCell>
                <TableCell className="font-medium">
                  {error.column}
                </TableCell>
                <TableCell>
                  {getSeverityBadge(error.column)}
                </TableCell>
                <TableCell className="text-sm">
                  {error.message}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer info */}
      <div className="space-y-3">
        <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
          <p>
            ❌ Foram encontrados <strong>{errors.length} erros</strong> no arquivo.
          </p>
          <p className="mt-1">
            Corrija os problemas indicados e tente novamente. Baixe o modelo para garantir a estrutura correta.
          </p>
        </div>

        {onDownloadTemplate && (
          <div className="flex justify-center">
            <Button 
              onClick={onDownloadTemplate} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Download size={16} />
              <span>Baixar Modelo de Planilha</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}; 