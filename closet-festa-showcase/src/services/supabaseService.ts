
import { supabase } from "@/integrations/supabase/client";
import { Product, StoreInfo } from "@/types";
import { mapSupabaseProductToProduct, mapProductToSupabaseProduct, mapSupabaseSettingsToStoreInfo } from "@/types/supabase";

// Authentication
export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ 
    email, 
    password 
  });
  
  if (error) {
    throw error;
  }
  
  return data;
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }
  
  return true;
};

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user || null;
};

// Products
export const fetchProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images (
        id,
        url,
        file_name,
        display_order
      )
    `)
    .order('created_at', { ascending: false });
    
  if (error) {
    throw error;
  }
  
  return data.map(product => {
    const productData = mapSupabaseProductToProduct(product);
    return productData;
  });
};

export const createProduct = async (product: Omit<Product, 'id'>) => {
  // Create the insert data directly without using the mapping functions
  // to ensure all required fields are properly typed
  const insertData = {
    name: product.name,
    description: product.description || null,
    category: product.category || null,
    rental_price: product.rentalPrice || null,
    sale_price: product.salePrice || null,
    sizes: product.sizes || [],
    tags: product.tags || [],
    featured: product.featured || false,
    external_links: product.contactLinks || {}
  };
  
  const { data, error } = await supabase
    .from('products')
    .insert(insertData)
    .select()
    .single();
    
  if (error) {
    throw error;
  }
  
  return mapSupabaseProductToProduct(data);
};

export const updateProduct = async (id: string, product: Partial<Product>) => {
  // Create a proper update object with only the fields that should be updated
  const updateData: any = {};
  
  if (product.name !== undefined) updateData.name = product.name;
  if (product.description !== undefined) updateData.description = product.description;
  if (product.category !== undefined) updateData.category = product.category;
  if (product.rentalPrice !== undefined) updateData.rental_price = product.rentalPrice;
  if (product.salePrice !== undefined) updateData.sale_price = product.salePrice;
  if (product.sizes !== undefined) updateData.sizes = product.sizes;
  if (product.tags !== undefined) updateData.tags = product.tags;
  if (product.featured !== undefined) updateData.featured = product.featured;
  if (product.contactLinks !== undefined) updateData.external_links = product.contactLinks;

  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    throw error;
  }
  
  return mapSupabaseProductToProduct(data);
};

export const deleteProduct = async (id: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
    
  if (error) {
    throw error;
  }
  
  return true;
};

// Store Settings
export const fetchStoreSettings = async () => {
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .limit(1)
    .single();
    
  if (error) {
    throw error;
  }
  
  return mapSupabaseSettingsToStoreInfo(data);
};

export const updateStoreSettings = async (settings: Partial<StoreInfo>) => {
  // First get the current settings
  const { data: currentData } = await supabase
    .from('store_settings')
    .select('*')
    .limit(1);
  
  // If we have existing settings, update them
  if (currentData && currentData.length > 0) {
    const { error } = await supabase
      .from('store_settings')
      .update({
        name: settings.name || currentData[0].name,
        description: settings.description || currentData[0].description,
        logo_url: settings.logo || currentData[0].logo_url,
        theme: settings.theme ? { 
          primary: settings.theme,
          contact_links: settings.contacts || { 
            whatsapp: '', 
            instagram: '', 
            shopee: '' 
          }
        } : currentData[0].theme
      })
      .eq('id', currentData[0].id);
      
    if (error) {
      throw error;
    }
  } else {
    // Create new settings if none exist
    const { error } = await supabase
      .from('store_settings')
      .insert({
        name: settings.name || 'Closet Festa',
        description: settings.description || '',
        logo_url: settings.logo || '',
        theme: settings.theme ? { 
          primary: settings.theme,
          contact_links: settings.contacts || { 
            whatsapp: '', 
            instagram: '', 
            shopee: '' 
          }
        } : { primary: 'marsala', contact_links: { whatsapp: '', instagram: '', shopee: '' } }
      });
      
    if (error) {
      throw error;
    }
  }
  
  return fetchStoreSettings();
};
