
import { supabase } from "@/integrations/supabase/client";

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const uploadProductImage = async (
  productId: string,
  file: File,
  displayOrder: number = 0
): Promise<ProductImage> => {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Formato de arquivo não suportado. Use apenas JPG, PNG ou WebP.');
  }

  // Validate file size (5MB limit)
  if (file.size > 5242880) {
    throw new Error('Arquivo muito grande. Tamanho máximo permitido: 5MB.');
  }

  // Generate unique file name
  const fileExt = file.name.split('.').pop();
  const fileName = `${productId}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

  // Upload to storage
  const { data: storageData, error: storageError } = await supabase.storage
    .from('product-images')
    .upload(fileName, file);

  if (storageError) {
    throw storageError;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  // Save image data to database
  const { data: imageData, error: dbError } = await supabase
    .from('product_images')
    .insert({
      product_id: productId,
      storage_path: storageData.path,
      url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      display_order: displayOrder
    })
    .select()
    .single();

  if (dbError) {
    // If database insert fails, clean up the uploaded file
    await supabase.storage.from('product-images').remove([fileName]);
    throw dbError;
  }

  return imageData;
};

export const getProductImages = async (productId: string): Promise<ProductImage[]> => {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('display_order', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
};

export const deleteProductImage = async (imageId: string): Promise<boolean> => {
  // First get the image data to delete from storage
  const { data: imageData, error: fetchError } = await supabase
    .from('product_images')
    .select('storage_path')
    .eq('id', imageId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('product-images')
    .remove([imageData.storage_path]);

  if (storageError) {
    console.warn('Failed to delete from storage:', storageError);
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId);

  if (dbError) {
    throw dbError;
  }

  return true;
};

export const updateImageOrder = async (imageId: string, newOrder: number): Promise<boolean> => {
  const { error } = await supabase
    .from('product_images')
    .update({ display_order: newOrder })
    .eq('id', imageId);

  if (error) {
    throw error;
  }

  return true;
};

export const compressImage = (file: File, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions (max 1200px)
      const maxSize = 1200;
      let { width, height } = img;

      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          const compressedFile = new File([blob!], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
};
