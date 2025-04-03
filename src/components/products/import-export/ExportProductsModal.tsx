
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Filter, FileText } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { exportProductsToExcel } from '@/utils/excelUtils';

interface ExportProductsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: any[];
  filteredProducts: any[];
  hasFilters: boolean;
}

const ExportProductsModal = ({ 
  open, 
  onOpenChange, 
  products, 
  filteredProducts, 
  hasFilters 
}: ExportProductsModalProps) => {
  const [exportFiltered, setExportFiltered] = useState(false);
  
  // Handle export action
  const handleExport = () => {
    const dataToExport = exportFiltered ? filteredProducts : products;
    exportProductsToExcel(dataToExport);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Exportar Produtos</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-center flex-col gap-4">
            <FileText size={64} className="text-neutral-400" />
            <h3 className="text-lg font-medium text-center">
              Exportar {products.length} produtos para Excel
            </h3>
          </div>
          
          {hasFilters && (
            <div className="flex items-start space-x-2 border rounded-md p-4 bg-neutral-50">
              <Checkbox 
                id="exportFiltered" 
                checked={exportFiltered} 
                onCheckedChange={(checked) => setExportFiltered(checked === true)}
              />
              <div className="space-y-1">
                <Label 
                  htmlFor="exportFiltered"
                  className="text-sm font-medium flex items-center gap-1"
                >
                  <Filter size={14} />
                  <span>Exportar apenas produtos filtrados</span>
                </Label>
                <p className="text-sm text-neutral-500">
                  {filteredProducts.length} produtos correspondem aos filtros aplicados
                </p>
              </div>
            </div>
          )}
          
          <p className="text-sm text-neutral-500 text-center">
            O arquivo exportado conterá todos os dados dos produtos no formato padrão.
          </p>
        </div>
        
        <DialogFooter className="gap-2">
          <Button 
            onClick={() => onOpenChange(false)} 
            variant="outline"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleExport} 
            className="bg-marsala hover:bg-marsala/90 flex items-center gap-2"
          >
            <Download size={16} />
            <span>Exportar para Excel</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportProductsModal;
