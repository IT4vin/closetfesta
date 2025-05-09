
import { supabase } from "@/integrations/supabase/client";

// Interfaces
export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
}

export interface ProductImage {
  id: string;
  storage_path: string;
  file_name: string;
  product_id: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category_id?: string;
  deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  product_categories?: ProductCategory;
  product_images?: ProductImage[];
}

export interface ProductFilters {
  category_id?: string;
  available?: boolean;
  min_price?: number;
  max_price?: number;
  search?: string;
}

// Helper function to get auth token
const getAuthHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  
  if (!data.session?.access_token) {
    throw new Error("Usuário não autenticado");
  }
  
  return {
    Authorization: `Bearer ${data.session.access_token}`
  };
};

// Product API functions
export const productService = {
  // List all products with optional filters
  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    try {
      const headers = await getAuthHeaders();
      
      // Build query string from filters
      let queryString = '';
      if (filters) {
        const params = new URLSearchParams();
        if (filters.category_id) params.append('category_id', filters.category_id);
        if (filters.available !== undefined) params.append('available', String(filters.available));
        if (filters.min_price !== undefined) params.append('min_price', String(filters.min_price));
        if (filters.max_price !== undefined) params.append('max_price', String(filters.max_price));
        if (filters.search) params.append('search', filters.search);
        queryString = `?${params.toString()}`;
      }

      // Call the edge function with URL params for filter
      const { data } = await supabase.functions.invoke('products-api', {
        method: 'GET',
        headers,
        body: { 
          action: 'list_products',
          queryParams: filters || {} 
        }
      });
      
      return data.data || [];
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  },
  
  // Get a single product by ID
  async getProduct(id: string): Promise<Product> {
    try {
      const headers = await getAuthHeaders();
      
      const { data } = await supabase.functions.invoke('products-api', {
        method: 'GET',
        headers,
        body: { 
          action: 'get_product',
          id: id
        }
      });
      
      return data.data;
    } catch (error) {
      console.error(`Error getting product ${id}:`, error);
      throw error;
    }
  },
  
  // Create a new product
  async createProduct(product: Partial<Product>): Promise<Product> {
    try {
      const headers = await getAuthHeaders();
      
      const { data } = await supabase.functions.invoke('products-api', {
        method: 'POST',
        headers,
        body: { 
          action: 'create_product',
          product: product
        }
      });
      
      return data.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },
  
  // Update an existing product
  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    try {
      const headers = await getAuthHeaders();
      
      const { data } = await supabase.functions.invoke('products-api', {
        method: 'PUT',
        headers,
        body: { 
          action: 'update_product',
          id: id,
          product: product
        }
      });
      
      return data.data;
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      throw error;
    }
  },
  
  // Delete a product (soft delete)
  async deleteProduct(id: string): Promise<void> {
    try {
      const headers = await getAuthHeaders();
      
      await supabase.functions.invoke('products-api', {
        method: 'DELETE',
        headers,
        body: { 
          action: 'delete_product',
          id: id
        }
      });
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      throw error;
    }
  },
  
  // Upload images for a product
  async uploadProductImages(productId: string, files: File[]): Promise<ProductImage[]> {
    try {
      const headers = await getAuthHeaders();
      
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      // For file uploads, we'll use a specific endpoint
      const { data } = await supabase.functions.invoke('products-api', {
        method: 'POST',
        headers,
        body: { 
          action: 'upload_images',
          productId: productId,
          // Note: We can't send files directly in the JSON body
          // In a real implementation, we'd use storage.upload first, then register the images
          // For now we're just sending file names for the demo
          fileNames: files.map(f => f.name)
        }
      });
      
      return data.images;
    } catch (error) {
      console.error(`Error uploading images for product ${productId}:`, error);
      throw error;
    }
  },
  
  // Delete a product image
  async deleteProductImage(imageId: string): Promise<void> {
    try {
      const headers = await getAuthHeaders();
      
      await supabase.functions.invoke('products-api', {
        method: 'DELETE',
        headers,
        body: { 
          action: 'delete_image',
          imageId: imageId
        }
      });
    } catch (error) {
      console.error(`Error deleting image ${imageId}:`, error);
      throw error;
    }
  },
  
  // Get a public URL for an image
  getImageUrl(storagePath: string): string {
    // Extract bucket and path from storage path (format: 'bucket-name/path/to/file')
    const pathParts = storagePath.split('/');
    const bucketName = pathParts[0];
    const filePath = pathParts.slice(1).join('/');
    
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return data.publicUrl;
  }
};

// Category API functions
export const categoryService = {
  // List all categories
  async getCategories(): Promise<ProductCategory[]> {
    try {
      const headers = await getAuthHeaders();
      
      const { data } = await supabase.functions.invoke('products-api', {
        method: 'GET',
        headers,
        body: { 
          action: 'list_categories'
        }
      });
      
      return data.data || [];
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  },
  
  // Get a single category by ID
  async getCategory(id: string): Promise<ProductCategory> {
    try {
      const headers = await getAuthHeaders();
      
      const { data } = await supabase.functions.invoke('products-api', {
        method: 'GET',
        headers,
        body: { 
          action: 'get_category',
          id: id
        }
      });
      
      return data.data;
    } catch (error) {
      console.error(`Error getting category ${id}:`, error);
      throw error;
    }
  },
  
  // Create a new category
  async createCategory(category: Partial<ProductCategory>): Promise<ProductCategory> {
    try {
      const headers = await getAuthHeaders();
      
      const { data } = await supabase.functions.invoke('products-api', {
        method: 'POST',
        headers,
        body: { 
          action: 'create_category',
          category: category
        }
      });
      
      return data.data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },
  
  // Update an existing category
  async updateCategory(id: string, category: Partial<ProductCategory>): Promise<ProductCategory> {
    try {
      const headers = await getAuthHeaders();
      
      const { data } = await supabase.functions.invoke('products-api', {
        method: 'PUT',
        headers,
        body: { 
          action: 'update_category',
          id: id,
          category: category
        }
      });
      
      return data.data;
    } catch (error) {
      console.error(`Error updating category ${id}:`, error);
      throw error;
    }
  },
  
  // Delete a category
  async deleteCategory(id: string): Promise<void> {
    try {
      const headers = await getAuthHeaders();
      
      await supabase.functions.invoke('products-api', {
        method: 'DELETE',
        headers,
        body: { 
          action: 'delete_category',
          id: id
        }
      });
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error);
      throw error;
    }
  }
};

// Hook for products management - can be expanded as needed
export function useProducts() {
  const fetchProducts = async (filters?: ProductFilters) => {
    return await productService.getProducts(filters);
  };
  
  const fetchCategories = async () => {
    return await categoryService.getCategories();
  };
  
  return {
    fetchProducts,
    fetchCategories
  };
}
