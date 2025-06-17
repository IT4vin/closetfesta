
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadTemplate } from '@/utils/excelUtils';
import { useToast } from '@/hooks/use-toast';

// Hooks e componentes refatorados
import { useFileUpload } from './hooks/useFileUpload';
import { useImportValidation } from './hooks/useImportValidation';
import { FileDropzone } from './components/FileDropzone';
import { ImportPreview } from './components/ImportPreview';
import { ImportErrors } from './components/ImportErrors';

interface ImportProductsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportConfirm: (products: any[]) => void;
}

const ImportProductsModal: React.FC<ImportProductsModalProps> = ({ 
  open, 
  onOpenChange, 
  onImportConfirm 
}) => {
  const { toast } = useToast();
  
  // Hook para upload de arquivos
  const fileUpload = useFileUpload({
    acceptedTypes: ['.xlsx', '.xls'],
    maxSize: 10 * 1024 * 1024, // 10MB
    onFileSelect: handleFileSelect,
  });
  
  // Hook para validação de importação
  const validation = useImportValidation();
  
  // Processar arquivo selecionado
  async function handleFileSelect(file: File) {
    try {
      await validation.processExcelFile(file);
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      fileUpload.finishUpload();
    }
  }
  
  // Confirmar importação
  const handleConfirmImport = () => {
    try {
      const products = validation.convertToProducts();
      onImportConfirm(products);
      
      toast({
        title: 'Importação concluída',
        description: `${products.length} produtos importados com sucesso.`,
      });
      
      handleClose();
    } catch (error) {
      // Erro já tratado no hook
    }
  };
  
  // Fechar modal e resetar estado
  const handleClose = () => {
    fileUpload.reset();
    validation.reset();
    onOpenChange(false);
  };
  
  // Voltar para upload
  const handleBackToUpload = () => {
    validation.goToStage('upload');
    fileUpload.reset();
  };
  
  // Download do template
  const handleDownloadTemplate = () => {
    downloadTemplate();
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Importar Produtos</DialogTitle>
        </DialogHeader>
        
        {/* Estágio de Upload */}
        {validation.stage === 'upload' && (
          <div className="space-y-6">
            <FileDropzone
              dragActive={fileUpload.dragActive}
              fileName={fileUpload.fileName}
              isUploading={fileUpload.isUploading || validation.isProcessing}
              acceptedTypes={['.xlsx', '.xls']}
              dropzoneProps={fileUpload.getDropzoneProps()}
              inputProps={fileUpload.getInputProps()}
            />
            
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
        
        {/* Estágio de Preview */}
        {validation.stage === 'preview' && (
          <ImportPreview validData={validation.validData} />
        )}
        
        {/* Estágio de Erros */}
        {validation.stage === 'errors' && (
          <ImportErrors 
            errors={validation.errors}
            onDownloadTemplate={handleDownloadTemplate}
          />
        )}
        
        {/* Footer com botões */}
        <DialogFooter className="gap-2 mt-6">
          {validation.stage === 'upload' ? (
            <Button onClick={handleClose} variant="outline">
              Cancelar
            </Button>
          ) : (
            <Button onClick={handleBackToUpload} variant="outline">
              Voltar
            </Button>
          )}
          
          {validation.stage === 'preview' && (
            <Button 
              onClick={handleConfirmImport} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!validation.stats.canProceed}
            >
              Confirmar Importação
            </Button>
          )}
          
          {validation.stage === 'errors' && (
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
