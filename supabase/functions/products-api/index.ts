
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get the authorization header from the request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { 
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Setup supabase client with the auth header
    const supabaseWithAuth = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Check if user is an admin
    const {
      data: { user },
      error: userError,
    } = await supabaseWithAuth.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { 
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Parse request body
    const requestBody = await req.json();
    const { action } = requestBody;

    // We can skip admin check for read operations on products and categories
    const isReadOperation = req.method === 'GET' || (action && action.startsWith('list_') || action.startsWith('get_'));
    
    // Check admin status for write operations
    if (!isReadOperation) {
      const { data: isAdmin } = await supabaseWithAuth.rpc('is_admin', {
        user_id: user.id,
      });
      
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: "Apenas administradores podem realizar esta operação" }),
          { 
            status: 403, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }
    
    // Route the request based on action and method
    let result;
    
    if (action === 'list_products') {
      // List products with optional filters
      const { queryParams } = requestBody;
      result = await listProducts(supabaseWithAuth, queryParams);
    } 
    else if (action === 'get_product') {
      // Get a specific product
      const { id } = requestBody;
      result = await getProduct(supabaseWithAuth, id);
    }
    else if (action === 'create_product') {
      // Create a new product
      const { product } = requestBody;
      result = await createProduct(supabaseWithAuth, product);
    }
    else if (action === 'update_product') {
      // Update an existing product
      const { id, product } = requestBody;
      result = await updateProduct(supabaseWithAuth, id, product);
    }
    else if (action === 'delete_product') {
      // Delete a product
      const { id } = requestBody;
      result = await deleteProduct(supabaseWithAuth, id);
    }
    else if (action === 'upload_images') {
      // Upload images to an existing product
      const { productId, fileNames } = requestBody;
      // This is a simplified version since we can't handle file uploads directly in the JSON body
      // In a real implementation, we'd have the files already uploaded to storage
      result = await simulateAddProductImages(supabaseWithAuth, productId, fileNames);
    }
    else if (action === 'delete_image') {
      // Delete a specific image
      const { imageId } = requestBody;
      result = await deleteProductImage(supabaseWithAuth, imageId);
    }
    else if (action === 'list_categories') {
      // List all categories
      result = await listCategories(supabaseWithAuth);
    }
    else if (action === 'get_category') {
      // Get a specific category
      const { id } = requestBody;
      result = await getCategory(supabaseWithAuth, id);
    }
    else if (action === 'create_category') {
      // Create a new category
      const { category } = requestBody;
      result = await createCategory(supabaseWithAuth, category);
    }
    else if (action === 'update_category') {
      // Update an existing category
      const { id, category } = requestBody;
      result = await updateCategory(supabaseWithAuth, id, category);
    }
    else if (action === 'delete_category') {
      // Delete a category
      const { id } = requestBody;
      result = await deleteCategory(supabaseWithAuth, id);
    }

    if (!result) {
      return new Response(
        JSON.stringify({ error: "Operação inválida" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor", details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

// Product functions
async function listProducts(supabase, filters) {
  let query = supabase
    .from('products')
    .select(`
      *,
      product_categories (id, name),
      product_images (id, storage_path, file_name)
    `)
    .eq('deleted', false);

  // Apply filters
  if (filters.category_id) {
    query = query.eq('category_id', filters.category_id);
  }
  
  if (filters.available === true) {
    query = query.gt('quantity', 0);
  }
  
  if (filters.min_price) {
    query = query.gte('price', parseFloat(filters.min_price));
  }
  
  if (filters.max_price) {
    query = query.lte('price', parseFloat(filters.max_price));
  }
  
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  
  // Order by creation date, newest first
  query = query.order('created_at', { ascending: false });
  
  const { data, error } = await query;
  
  if (error) throw error;
  return { data };
}

async function getProduct(supabase, id) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_categories (id, name, description),
      product_images (id, storage_path, file_name)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return { data };
}

async function createProduct(supabase, productData) {
  const { images, ...productFields } = productData;
  
  // Insert the product first
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert(productFields)
    .select()
    .single();
  
  if (productError) throw productError;
  
  // Handle any provided image URLs
  if (images && images.length > 0) {
    const imageRecords = images.map(img => ({
      product_id: product.id,
      storage_path: img.storage_path,
      file_name: img.file_name
    }));
    
    const { data: imageData, error: imageError } = await supabase
      .from('product_images')
      .insert(imageRecords)
      .select();
    
    if (imageError) throw imageError;
    product.images = imageData;
  } else {
    product.images = [];
  }
  
  return { data: product };
}

async function updateProduct(supabase, id, productData) {
  const { images, ...productFields } = productData;
  
  // Update product data
  const { data: product, error: productError } = await supabase
    .from('products')
    .update(productFields)
    .eq('id', id)
    .select()
    .single();
  
  if (productError) throw productError;
  
  // If new images were provided, add them
  if (images && images.length > 0) {
    const imageRecords = images.map(img => ({
      product_id: id,
      storage_path: img.storage_path,
      file_name: img.file_name
    }));
    
    const { data: imageData, error: imageError } = await supabase
      .from('product_images')
      .insert(imageRecords)
      .select();
    
    if (imageError) throw imageError;
    
    // Get all images for this product
    const { data: allImages } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', id);
      
    product.images = allImages;
  }
  
  return { data: product };
}

async function deleteProduct(supabase, id) {
  // Get product images before deleting
  const { data: images } = await supabase
    .from('product_images')
    .select('storage_path')
    .eq('product_id', id);
  
  // Soft delete the product
  const { data, error } = await supabase
    .from('products')
    .update({ deleted: true })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  // Delete images from storage if any
  if (images && images.length > 0) {
    for (const image of images) {
      const path = image.storage_path.replace('product-images/', '');
      await supabase.storage.from('product-images').remove([path]);
    }
  }
  
  return { data, message: "Produto excluído com sucesso" };
}

// Simple simulation of image upload - in real app we'd process actual file uploads
async function simulateAddProductImages(supabase, productId, fileNames) {
  // Check if product exists
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('id', productId)
    .single();
    
  if (productError) throw new Error("Produto não encontrado");
  
  // Create simulated image records
  const imageRecords = fileNames.map(fileName => {
    const uniqueId = crypto.randomUUID();
    const filePath = `${productId}/${uniqueId}-${fileName}`;
    
    return {
      product_id: productId,
      storage_path: `product-images/${filePath}`,
      file_name: fileName
    };
  });
  
  // Save image records to database
  const { data: images, error: imageError } = await supabase
    .from('product_images')
    .insert(imageRecords)
    .select();
    
  if (imageError) throw imageError;
  
  return { 
    data: { images },
    message: `${fileNames.length} imagens simuladas carregadas com sucesso`
  };
}

async function deleteProductImage(supabase, imageId) {
  // Get image info before deleting
  const { data: image, error: getError } = await supabase
    .from('product_images')
    .select('*')
    .eq('id', imageId)
    .single();
  
  if (getError) throw getError;
  
  // Delete from database
  const { error: deleteError } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId);
  
  if (deleteError) throw deleteError;
  
  // Delete from storage
  if (image.storage_path) {
    const path = image.storage_path.replace('product-images/', '');
    await supabase.storage.from('product-images').remove([path]);
  }
  
  return { 
    data: image,
    message: "Imagem excluída com sucesso"
  };
}

// Category functions
async function listCategories(supabase) {
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .order('name');
    
  if (error) throw error;
  return { data };
}

async function getCategory(supabase, id) {
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return { data };
}

async function createCategory(supabase, categoryData) {
  const { data, error } = await supabase
    .from('product_categories')
    .insert(categoryData)
    .select()
    .single();
    
  if (error) throw error;
  return { data };
}

async function updateCategory(supabase, id, categoryData) {
  const { data, error } = await supabase
    .from('product_categories')
    .update(categoryData)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return { data };
}

async function deleteCategory(supabase, id) {
  // Check if category is used by any products
  const { data: products, error: checkError } = await supabase
    .from('products')
    .select('id')
    .eq('category_id', id)
    .limit(1);
    
  if (checkError) throw checkError;
  
  if (products.length > 0) {
    throw new Error("Esta categoria está sendo usada por produtos e não pode ser excluída");
  }
  
  const { data, error } = await supabase
    .from('product_categories')
    .delete()
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return { 
    data, 
    message: "Categoria excluída com sucesso" 
  };
}
