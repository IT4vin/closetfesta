
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Product } from '@/types';

interface ImportExportActionsProps {
  products: Product[];
}

const ImportExportActions: React.FC<ImportExportActionsProps> = ({ products }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Nome',
      'Descrição',
      'Categoria',
      'Preço Aluguel',
      'Preço Venda',
      'Tamanhos',
      'Tags',
      'Destaque'
    ];

    const csvContent = [
      headers.join(','),
      ...products.map(product => [
        product.id,
        `"${product.name.replace(/"/g, '""')}"`,
        `"${(product.description || '').replace(/"/g, '""')}"`,
        product.category || '',
        product.rentalPrice || '',
        product.salePrice || '',
        `"${product.sizes.join('; ')}"`,
        `"${(product.tags || []).join('; ')}"`,
        product.featured ? 'Sim' : 'Não'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `produtos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`${products.length} produtos exportados para CSV`);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        
        // Basic validation
        if (!headers.includes('Nome') || !headers.includes('ID')) {
          toast.error('Arquivo CSV deve conter pelo menos as colunas ID e Nome');
          return;
        }

        toast.info('Importação de CSV será implementada na próxima versão');
        // TODO: Implement CSV import logic
      } catch (error) {
        toast.error('Erro ao processar arquivo CSV');
      }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={exportToCSV}>
        <Download className="w-4 h-4 mr-2" />
        Exportar CSV
      </Button>
      
      <Button 
        variant="outline" 
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-4 h-4 mr-2" />
        Importar CSV
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImport}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ImportExportActions;
