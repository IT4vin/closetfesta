
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { uploadProductImage, deleteProductImage, compressImage, ProductImage } from '@/services/imageService';

interface ImageUploaderProps {
  productId: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

interface PreviewImage {
  id: string;
  file: File;
  url: string;
  uploading?: boolean;
  error?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  productId,
  images,
  onImagesChange,
  maxImages = 10,
  disabled = false
}) => {
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalImages = images.length + previewImages.length;

  const handleFileSelect = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    
    // Check if adding these files would exceed the limit
    if (totalImages + fileArray.length > maxImages) {
      toast.error(`Limite de ${maxImages} fotos por produto. Exclua uma imagem para adicionar outra.`);
      return;
    }

    // Validate and create preview images
    const validFiles: PreviewImage[] = [];
    
    for (const file of fileArray) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Formato não suportado: ${file.name}. Use apenas JPG, PNG ou WebP.`);
        continue;
      }

      // Validate file size
      if (file.size > 5242880) {
        toast.error(`Arquivo muito grande: ${file.name}. Tamanho máximo: 5MB.`);
        continue;
      }

      const previewId = `preview-${Date.now()}-${Math.random()}`;
      const url = URL.createObjectURL(file);
      
      validFiles.push({
        id: previewId,
        file,
        url,
        uploading: false
      });
    }

    setPreviewImages(prev => [...prev, ...validFiles]);
  }, [totalImages, maxImages]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect, disabled]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFileSelect]);

  const uploadPreviewImage = async (previewImage: PreviewImage) => {
    setPreviewImages(prev => 
      prev.map(img => 
        img.id === previewImage.id 
          ? { ...img, uploading: true, error: undefined }
          : img
      )
    );

    try {
      // Compress image before upload
      const compressedFile = await compressImage(previewImage.file);
      
      const uploadedImage = await uploadProductImage(
        productId,
        compressedFile,
        totalImages
      );

      // Remove from preview and add to actual images
      setPreviewImages(prev => prev.filter(img => img.id !== previewImage.id));
      onImagesChange([...images, uploadedImage]);
      
      toast.success('Imagem enviada com sucesso!');
    } catch (error: any) {
      console.error('Upload error:', error);
      
      setPreviewImages(prev => 
        prev.map(img => 
          img.id === previewImage.id 
            ? { ...img, uploading: false, error: error.message }
            : img
        )
      );
      
      toast.error(`Erro ao enviar imagem: ${error.message}`);
    }
  };

  const removePreviewImage = (previewId: string) => {
    setPreviewImages(prev => {
      const imageToRemove = prev.find(img => img.id === previewId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter(img => img.id !== previewId);
    });
  };

  const removeUploadedImage = async (imageId: string) => {
    try {
      await deleteProductImage(imageId);
      onImagesChange(images.filter(img => img.id !== imageId));
      toast.success('Imagem removida com sucesso!');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(`Erro ao remover imagem: ${error.message}`);
    }
  };

  const uploadAllPreviews = async () => {
    const pendingUploads = previewImages.filter(img => !img.uploading && !img.error);
    
    for (const previewImage of pendingUploads) {
      await uploadPreviewImage(previewImage);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Imagens do Produto</h3>
        <Badge variant="secondary">
          {totalImages}/{maxImages} imagens
        </Badge>
      </div>

      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
          ${totalImages >= maxImages ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && totalImages < maxImages) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => {
          if (!disabled && totalImages < maxImages) {
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || totalImages >= maxImages}
        />
        
        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        
        {totalImages >= maxImages ? (
          <p className="text-gray-500">
            Limite de {maxImages} imagens atingido
          </p>
        ) : (
          <>
            <p className="text-gray-600 mb-1">
              Arraste imagens aqui ou clique para selecionar
            </p>
            <p className="text-sm text-gray-500">
              JPG, PNG, WebP até 5MB cada • Máximo {maxImages} imagens
            </p>
          </>
        )}
      </div>

      {/* Preview Images */}
      {previewImages.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Imagens para enviar:</h4>
            <Button
              onClick={uploadAllPreviews}
              size="sm"
              disabled={previewImages.every(img => img.uploading || img.error)}
            >
              Enviar todas
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previewImages.map((preview) => (
              <Card key={preview.id} className="relative">
                <CardContent className="p-2">
                  <div className="aspect-square relative rounded overflow-hidden bg-gray-100">
                    <img
                      src={preview.url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    
                    {preview.uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-white text-sm">Enviando...</div>
                      </div>
                    )}
                    
                    {preview.error && (
                      <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => uploadPreviewImage(preview)}
                      disabled={preview.uploading}
                    >
                      {preview.uploading ? 'Enviando...' : 'Enviar'}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removePreviewImage(preview.id)}
                      disabled={preview.uploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {preview.error && (
                    <p className="text-xs text-red-600 mt-1">{preview.error}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Images */}
      {images.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Imagens salvas:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <Card key={image.id} className="relative">
                <CardContent className="p-2">
                  <div className="aspect-square relative rounded overflow-hidden bg-gray-100">
                    <img
                      src={image.url}
                      alt={`Produto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    <div className="absolute top-1 left-1">
                      <Badge variant="secondary" className="text-xs">
                        {index + 1}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-gray-500 flex items-center">
                      <ImageIcon className="w-3 h-3 mr-1" />
                      {image.file_name}
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeUploadedImage(image.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && previewImages.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma imagem adicionada ainda</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
