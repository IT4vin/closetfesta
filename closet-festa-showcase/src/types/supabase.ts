
import { Database } from "@/integrations/supabase/types";
import { Product, StoreInfo } from "@/types";

type SupabaseProduct = Database['public']['Tables']['products']['Row'];
type SupabaseStoreSettings = Database['public']['Tables']['store_settings']['Row'];

export const mapSupabaseProductToProduct = (supabaseProduct: SupabaseProduct): Product => {
  return {
    id: supabaseProduct.id,
    name: supabaseProduct.name,
    description: supabaseProduct.description || '',
    rentalPrice: supabaseProduct.rental_price || 0,
    salePrice: supabaseProduct.sale_price,
    sizes: (supabaseProduct.sizes || []) as Product['sizes'],
    category: supabaseProduct.category || '',
    tags: supabaseProduct.tags || [],
    featured: supabaseProduct.featured || false,
    contactLinks: supabaseProduct.external_links as Product['contactLinks'] || {
      whatsapp: '',
      instagram: '',
      shopee: ''
    }
  };
};

export const mapProductToSupabaseProduct = (product: Product): Partial<SupabaseProduct> => {
  return {
    name: product.name,
    description: product.description,
    rental_price: product.rentalPrice,
    sale_price: product.salePrice,
    sizes: product.sizes,
    category: product.category,
    tags: product.tags || [],
    featured: product.featured || false,
    external_links: product.contactLinks as any
  };
};

export const mapSupabaseSettingsToStoreInfo = (supabaseSettings: SupabaseStoreSettings): StoreInfo => {
  const theme = supabaseSettings.theme as any;
  
  return {
    name: supabaseSettings.name,
    description: supabaseSettings.description || '',
    logo: supabaseSettings.logo_url || '',
    theme: theme?.primary || 'marsala',
    contacts: theme?.contact_links || {
      whatsapp: '',
      instagram: '',
      shopee: ''
    }
  };
};
