
import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Download, Upload, FileText, X, CheckCircle, 
  AlertCircle, ArrowDown, FileX 
} from 'lucide-react';
import { 
  Table, TableBody, TableCaption, TableCell, 
  TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  downloadTemplate, 
  parseImportedExcel, 
  convertTemplateRowsToProducts, 
  ProductTemplateRow 
} from '@/utils/excelUtils';
import { useToast } from '@/hooks/use-toast';

interface ImportProductsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportConfirm: (products: any[]) => void;
}

const ImportProductsModal = ({ 
  open, 
  onOpenChange, 
  onImportConfirm 
}: ImportProductsModalProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStage, setImportStage] = useState<'upload' | 'preview' | 'errors'>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ row: number; column: string; message: string }[]>([]);
  const [validData, setValidData] = useState<ProductTemplateRow[]>([]);
  
  // Handle file drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Handle dropped file
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  // Handle selected file from input
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  // Process the selected file
  const handleFile = async (file: File) => {
    // Check if file is Excel
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: 'Formato não suportado',
        description: 'Por favor, selecione um arquivo Excel (.xlsx ou .xls).',
        variant: 'destructive',
      });
      return;
    }
    
    setFileName(file.name);
    setImporting(true);
    
    try {
      const result = await parseImportedExcel(file);
      setValidData(result.validData);
      
      if (result.errors.length > 0) {
        setErrors(result.errors);
        setImportStage('errors');
      } else if (result.validData.length > 0) {
        setImportStage('preview');
      } else {
        toast({
          title: 'Arquivo vazio',
          description: 'O arquivo não contém dados válidos para importação.',
          variant: 'destructive',
        });
        resetImportState();
      }
    } catch (error) {
      toast({
        title: 'Erro na importação',
        description: error instanceof Error ? error.message : 'Erro desconhecido.',
        variant: 'destructive',
      });
      resetImportState();
    } finally {
      setImporting(false);
    }
  };
  
  // Reset the import state
  const resetImportState = () => {
    setImporting(false);
    setImportStage('upload');
    setFileName(null);
    setErrors([]);
    setValidData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Confirm the import
  const confirmImport = () => {
    try {
      const products = convertTemplateRowsToProducts(validData);
      onImportConfirm(products);
      toast({
        title: 'Importação concluída',
        description: `${products.length} produtos importados com sucesso.`,
      });
      onOpenChange(false);
      resetImportState();
    } catch (error) {
      toast({
        title: 'Erro ao importar',
        description: 'Não foi possível concluir a importação. Tente novamente.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    resetImportState();
    onOpenChange(false);
  };
  
  // Return to upload stage
  const backToUpload = () => {
    setImportStage('upload');
  };
  
  // Download the template file
  const handleDownloadTemplate = () => {
    downloadTemplate();
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Importar Produtos</DialogTitle>
        </DialogHeader>
        
        {importStage === 'upload' && (
          <div className="space-y-6">
            <div 
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
                ${dragActive ? 'border-marsala bg-marsala/5' : 'border-neutral-300 hover:border-neutral-400'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileInput}
              />
              
              {fileName ? (
                <div className="space-y-2">
                  <FileText size={48} className="mx-auto text-neutral-500" />
                  <p className="font-medium">{fileName}</p>
                  {importing ? (
                    <p>Processando arquivo...</p>
                  ) : (
                    <p className="text-sm text-neutral-500">Arquivo selecionado</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload size={48} className="mx-auto text-neutral-500" />
                  <p className="font-medium">Arraste o arquivo Excel ou clique para selecionar</p>
                  <p className="text-sm text-neutral-500">Arquivo Excel (.xlsx ou .xls)</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-center">
              <Button 
                onClick={handleDownloadTemplate}
                variant="outline" 
                className="flex items-center gap-2"
              >
                <Download size={16} />
                <span>Baixar Modelo de Planilha</span>
              </Button>
            </div>
          </div>
        )}
        
        {importStage === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <CheckCircle size={20} className="text-green-600" />
                <span>Validação concluída</span>
              </h3>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {validData.length} produtos
              </span>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço Venda</TableHead>
                    <TableHead>Preço Aluguel</TableHead>
                    <TableHead>Ativo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.Nome}</TableCell>
                      <TableCell>{row.SKU}</TableCell>
                      <TableCell>{row.Categoria}</TableCell>
                      <TableCell>R$ {row['Preço Venda']}</TableCell>
                      <TableCell>R$ {row['Preço Aluguel'] || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          row.Ativo === 'SIM' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {row.Ativo}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <p className="text-sm text-neutral-500">
              Todos os {validData.length} produtos foram validados e estão prontos para importação. 
              <br/>
              Clique em "Confirmar Importação" para concluir ou "Voltar" para selecionar outro arquivo.
            </p>
          </div>
        )}
        
        {importStage === 'errors' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <AlertCircle size={20} className="text-red-600" />
                <span>Erros encontrados</span>
              </h3>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                {errors.length} problemas
              </span>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto border rounded-md">
              <Table>
                <TableCaption>Corrija os erros e tente novamente</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Linha</TableHead>
                    <TableHead>Coluna</TableHead>
                    <TableHead>Problema</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errors.map((error, index) => (
                    <TableRow key={index}>
                      <TableCell>{error.row}</TableCell>
                      <TableCell>{error.column}</TableCell>
                      <TableCell>{error.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <p className="text-sm text-neutral-500">
              Foram encontrados erros no arquivo. Corrija os problemas indicados e tente novamente.
              <br/>
              Baixe o modelo para garantir a estrutura correta do arquivo.
            </p>
          </div>
        )}
        
        <DialogFooter className="gap-2 mt-6">
          {importStage === 'upload' ? (
            <Button onClick={handleCancel} variant="outline">
              Cancelar
            </Button>
          ) : (
            <Button onClick={backToUpload} variant="outline">
              Voltar
            </Button>
          )}
          
          {importStage === 'preview' && (
            <Button 
              onClick={confirmImport} 
              className="bg-marsala hover:bg-marsala/90"
            >
              Confirmar Importação
            </Button>
          )}
          
          {importStage === 'errors' && (
            <Button 
              onClick={handleDownloadTemplate} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Download size={16} />
              <span>Baixar Modelo</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportProductsModal;
