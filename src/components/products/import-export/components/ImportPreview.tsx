import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ProductTemplateRow } from '@/utils/excelUtils';

export interface ImportPreviewProps {
  validData: ProductTemplateRow[];
  className?: string;
}

export const ImportPreview: React.FC<ImportPreviewProps> = ({
  validData,
  className = '',
}) => {
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numPrice || 0);
  };

  const getStatusBadge = (status: string) => {
    const isActive = status === 'SIM';
    return (
      <Badge 
        variant={isActive ? 'default' : 'secondary'}
        className={isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}
      >
        {status}
      </Badge>
    );
  };

  if (validData.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">Nenhum dado válido para exibir</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <CheckCircle size={20} className="text-green-600" />
          <span>Validação concluída</span>
        </h3>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          {validData.length} produtos
        </Badge>
      </div>

      {/* Table */}
      <div className="max-h-[400px] overflow-y-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Nome</TableHead>
              <TableHead className="w-[120px]">SKU</TableHead>
              <TableHead className="w-[150px]">Categoria</TableHead>
              <TableHead className="w-[120px]">Preço Venda</TableHead>
              <TableHead className="w-[120px]">Preço Aluguel</TableHead>
              <TableHead className="w-[100px]">Ativo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validData.map((row, index) => (
              <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <TableCell className="font-medium">
                  <div className="max-w-[180px] truncate" title={row.Nome}>
                    {row.Nome}
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                    {row.SKU}
                  </code>
                </TableCell>
                <TableCell>
                  <div className="max-w-[130px] truncate" title={row.Categoria}>
                    {row.Categoria}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {formatPrice(row['Preço Venda'])}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {row['Preço Aluguel'] ? formatPrice(row['Preço Aluguel']) : '-'}
                </TableCell>
                <TableCell>
                  {getStatusBadge(row.Ativo)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer info */}
      <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
        <p>
          ✅ Todos os {validData.length} produtos foram validados e estão prontos para importação.
        </p>
        <p className="mt-1">
          Clique em "Confirmar Importação" para concluir ou "Voltar" para selecionar outro arquivo.
        </p>
      </div>
    </div>
  );
}; 