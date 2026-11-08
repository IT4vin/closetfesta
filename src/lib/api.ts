// ============================================================================
// Adaptador Supabase — substitui o antigo backend Node.js (localhost:3001).
// Mantém as mesmas assinaturas (*Api.method) usadas por hooks e componentes,
// mas grava/lê diretamente do Lovable Cloud (Supabase).
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { createRentalOrder, findRentalOrder, listRentalOrders } from '@/lib/rentalOrders';
import { confirmRentalPickup, confirmRentalReturn, recordRentalPayment } from '@/lib/rentalLifecycle';

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

// ---------- Tipos legados (compat com o restante do app) --------------------

export interface ProductImage {
  id: string;
  file_name: string;
  file_path: string;
  display_order: number;
  url: string;
  thumbnail_url: string;
}

export interface Product {
  id: string;
  sku?: string;
  barcode?: string;
  name: string;
  description: string;
  price: number;
  rental_price?: number;
  quantity: number;
  category_id: string;
  sizes: string[];
  featured: boolean;
  deleted: boolean;
  status: 'available' | 'rented' | 'maintenance' | 'reserved';
  created_at: string;
  updated_at: string;
  category?: { name: string; description: string };
  images: ProductImage[];
  // Aliases legados
  rentalPrice?: number;
  size?: string;
  color?: string;
  type?: string;
  subtype?: string;
  image?: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product: Product;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  item_type: 'sale' | 'rental';
  try_on_date?: string;
  pickup_date?: string;
  event_date?: string;
  return_date?: string;
  actual_return_date?: string;
  conflict_override?: boolean;
  late_fee?: number;
  status?: 'pending' | 'picked_up' | 'returned' | 'overdue';
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  customer_document?: string;
  customer_phone?: string;
  order_type: 'sale' | 'rental' | 'hybrid';
  status: 'draft' | 'confirmed' | 'completed' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  total_discount: number;
  total: number;
  total_sales: number;
  total_rentals: number;
  observations?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'pix' | 'transfer';
  payment_details?: any;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface RentalAlert {
  id: string;
  order_id: string;
  product_id: string;
  alert_type: 'pickup_reminder' | 'return_reminder' | 'overdue';
  scheduled_date: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  message?: string;
}

export interface LateFeeConfig {
  id: string;
  name: string;
  description: string;
  fee_type: 'fixed' | 'percentage' | 'daily_fixed' | 'daily_percentage';
  fee_value: number;
  grace_period_hours: number;
  max_fee_amount?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LateFeeCalculation {
  order_item_id: string;
  days_overdue: number;
  hours_overdue: number;
  base_amount: number;
  fee_config: LateFeeConfig;
  calculated_fee: number;
  applied_fee: number;
  waived: boolean;
  waived_reason?: string;
  calculated_at: string;
}

export interface Reservation {
  id: string;
  customer_name: string;
  customer_document?: string;
  customer_phone?: string;
  customer_email?: string;
  product_id: string;
  product: Product;
  reservation_date: string;
  event_date: string;
  pickup_date: string;
  return_date: string;
  status: 'pending' | 'confirmed' | 'picked_up' | 'completed' | 'cancelled';
  notes?: string;
  deposit_amount?: number;
  deposit_paid: boolean;
  deposit_method?: string;
  total_amount: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  available_slots: number;
  reserved_slots: number;
  is_available: boolean;
}

export interface AvailabilityCheck {
  product_id: string;
  date_from: string;
  date_to: string;
  is_available: boolean;
  conflicting_reservations: Array<{
    id: string;
    customer_name: string;
    pickup_date: string;
    return_date: string;
  }>;
}

// ---------- Helpers ---------------------------------------------------------

const ok = <T>(data: T, extra?: Partial<ApiResponse<T>>): ApiResponse<T> => ({
  success: true,
  data,
  ...extra,
});

const fail = (message: string, status = 400): never => {
  throw new ApiError(status, message);
};

function mapProductRow(row: any): Product {
  const meta = (row.metadata as any) || {};
  const images: ProductImage[] = ((row.product_images as any[]) || [])
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((img: any, i: number) => ({
      id: img.id,
      file_name: img.storage_path?.split('/').pop() || `img-${i}`,
      file_path: img.storage_path || img.url,
      display_order: img.position ?? i,
      url: img.url,
      thumbnail_url: img.url,
    }));
  return {
    id: row.id,
    sku: row.sku ?? undefined,
    barcode: row.barcode ?? undefined,
    name: row.name,
    description: row.description ?? '',
    price: Number(row.price ?? 0),
    rental_price: meta.rental_price != null ? Number(meta.rental_price) : Number(row.price ?? 0),
    quantity: Number(row.stock_quantity ?? 0),
    category_id: row.category_id ?? '',
    sizes: Array.isArray(meta.sizes) ? meta.sizes : (typeof meta.sizes === 'string' ? meta.sizes.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
    featured: Boolean(meta.featured),
    size: Array.isArray(meta.sizes) ? meta.sizes[0] : undefined,
    color: meta.color ?? undefined,
    type: meta.type ?? undefined,
    deleted: row.deleted_at != null,
    status: (!row.active || row.deleted_at) ? 'maintenance' : ((meta.status as Product['status']) || 'available'),
    created_at: row.created_at,
    updated_at: row.updated_at,
    category: row.product_categories ? { name: row.product_categories.name, description: row.product_categories.description ?? '' } : undefined,
    images,
    rentalPrice: meta.rental_price != null ? Number(meta.rental_price) : undefined,
    image: images[0]?.url,
  };
}

const PRODUCT_SELECT = '*, product_categories(name, description), product_images(id, url, storage_path, position, is_primary)';

// ---------- PRODUTOS --------------------------------------------------------

export const productsApi = {
  async findAll(params: {
    category_id?: string;
    featured?: boolean;
    in_stock?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ApiResponse<Product[]>> {
    let q = supabase
      .from('products')
      .select(PRODUCT_SELECT, { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (params.category_id) q = q.eq('category_id', params.category_id);
    if (params.in_stock) q = q.gt('stock_quantity', 0);
    if (params.search) q = q.ilike('name', `%${params.search}%`);
    if (params.limit) q = q.limit(params.limit);
    if (params.offset != null && params.limit) q = q.range(params.offset, params.offset + params.limit - 1);

    const { data, error, count } = await q;
    if (error) fail(error.message);

    let products = (data || []).map(mapProductRow);
    if (params.featured) products = products.filter(p => p.featured);
    return ok(products, { total: count ?? products.length });
  },

  async findById(id: string): Promise<ApiResponse<Product>> {
    const { data, error } = await supabase.from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle();
    if (error) fail(error.message);
    if (!data) fail('Produto não encontrado', 404);
    return ok(mapProductRow(data));
  },

  async create(input: any): Promise<ApiResponse<Product>> {
    const metadata: Record<string, any> = {};
    if (input.sizes) metadata.sizes = Array.isArray(input.sizes) ? input.sizes : String(input.sizes).split(',').map((s: string) => s.trim()).filter(Boolean);
    if (input.featured != null) metadata.featured = !!input.featured;
    if (input.rental_price != null) metadata.rental_price = Number(input.rental_price);
    if (input.rentalPrice != null) metadata.rental_price = Number(input.rentalPrice);
    if (input.status) metadata.status = input.status;
    if (input.color) metadata.color = input.color;
    if (input.type) metadata.type = input.type;

    const row: any = {
      name: input.name,
      description: input.description ?? null,
      price: Number(input.price ?? 0),
      stock_quantity: Number(input.quantity ?? input.stock_quantity ?? 0),
      category_id: input.category_id || null,
      sku: input.sku ?? null,
      barcode: input.barcode ?? null,
      cost: input.cost != null ? Number(input.cost) : null,
      min_stock: input.min_stock != null ? Number(input.min_stock) : null,
      unit: input.unit ?? 'un',
      active: input.active ?? true,
      metadata,
    };
    const { data, error } = await supabase.from('products').insert(row).select(PRODUCT_SELECT).single();
    if (error) fail(error.message);
    return ok(mapProductRow(data));
  },

  async update(id: string, input: any): Promise<ApiResponse<Product>> {
    const patch: any = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.price !== undefined) patch.price = Number(input.price);
    if (input.quantity !== undefined) patch.stock_quantity = Number(input.quantity);
    if (input.stock_quantity !== undefined) patch.stock_quantity = Number(input.stock_quantity);
    if (input.category_id !== undefined) patch.category_id = input.category_id || null;
    if (input.sku !== undefined) patch.sku = input.sku;
    if (input.cost !== undefined) patch.cost = input.cost != null ? Number(input.cost) : null;

    if (input.sizes !== undefined || input.featured !== undefined || input.rental_price !== undefined || input.status !== undefined || input.color !== undefined || input.type !== undefined) {
      const { data: existing } = await supabase.from('products').select('metadata').eq('id', id).maybeSingle();
      const metadata: Record<string, any> = { ...(existing?.metadata as any || {}) };
      if (input.sizes !== undefined) metadata.sizes = Array.isArray(input.sizes) ? input.sizes : String(input.sizes).split(',').map((s: string) => s.trim()).filter(Boolean);
      if (input.featured !== undefined) metadata.featured = !!input.featured;
      if (input.rental_price !== undefined) metadata.rental_price = Number(input.rental_price);
      if (input.status !== undefined) metadata.status = input.status;
      if (input.color !== undefined) metadata.color = input.color;
      if (input.type !== undefined) metadata.type = input.type;
      patch.metadata = metadata;
    }

    const { data, error } = await supabase.from('products').update(patch).eq('id', id).select(PRODUCT_SELECT).single();
    if (error) fail(error.message);
    return ok(mapProductRow(data));
  },

  async delete(id: string, hardDelete = false): Promise<ApiResponse<{ id: string }>> {
    if (hardDelete) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) fail(error.message);
    } else {
      const { error } = await supabase.from('products').update({ deleted_at: new Date().toISOString(), active: false }).eq('id', id);
      if (error) fail(error.message);
    }
    return ok({ id });
  },

  async uploadImages(productId: string, files: File[]): Promise<ApiResponse<ProductImage[]>> {
    const { data: existing, error: readError } = await supabase.from('product_images')
      .select('position').eq('product_id', productId).order('position', { ascending: false }).limit(1);
    if (readError) fail(readError.message);
    const startPosition = (existing?.[0]?.position ?? -1) + 1;
    const uploaded: ProductImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!['image/jpeg','image/png','image/webp'].includes(file.type) ||
          file.size > 8 * 1024 * 1024) fail('Foto inválida ou acima de 8 MB.');
      const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const path = `${productId}/${crypto.randomUUID()}-${safeName}`;
      const storage = supabase.storage.from('product-images');
      const { error: upErr } = await storage.upload(path, file, { upsert: false });
      if (upErr) fail(upErr.message);
      const { data: signed, error: signedError } = await storage.createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signedError || !signed?.signedUrl) {
        await storage.remove([path]);
        fail(signedError?.message || 'Não foi possível acessar a imagem.');
      }
      const url = signed.signedUrl;
      const position = startPosition + i;
      const { data, error } = await supabase.from('product_images').insert({
        product_id: productId, url, storage_path: path, position, is_primary: position === 0,
      }).select().single();
      if (error) {
        await storage.remove([path]);
        fail(error.message);
      }
      uploaded.push({
        id: data.id, file_name: file.name, file_path: path, display_order: position,
        url, thumbnail_url: url,
      });
    }
    return ok(uploaded);
  },

  async removeImage(_productId: string, imageId: string): Promise<ApiResponse<{ id: string }>> {
    const { data: img } = await supabase.from('product_images').select('storage_path').eq('id', imageId).maybeSingle();
    if (img?.storage_path) {
      await supabase.storage.from('product-images').remove([img.storage_path]);
    }
    const { error } = await supabase.from('product_images').delete().eq('id', imageId);
    if (error) fail(error.message);
    return ok({ id: imageId });
  },
};

// ---------- CATEGORIAS ------------------------------------------------------

export const categoriesApi = {
  async findAll(search?: string): Promise<ApiResponse<Category[]>> {
    let q = supabase.from('product_categories').select('*').order('name');
    if (search) q = q.ilike('name', `%${search}%`);
    const { data, error } = await q;
    if (error) fail(error.message);
    // contar produtos por categoria
    const { data: counts } = await supabase.from('products').select('category_id').is('deleted_at', null);
    const countMap = new Map<string, number>();
    (counts || []).forEach((r: any) => countMap.set(r.category_id, (countMap.get(r.category_id) || 0) + 1));
    const cats: Category[] = (data || []).map((c: any) => ({
      id: c.id, name: c.name, description: c.description ?? '',
      product_count: countMap.get(c.id) ?? 0,
      created_at: c.created_at, updated_at: c.updated_at,
    }));
    return ok(cats, { total: cats.length });
  },
  async findById(id: string): Promise<ApiResponse<Category>> {
    const { data, error } = await supabase.from('product_categories').select('*').eq('id', id).maybeSingle();
    if (error) fail(error.message);
    if (!data) fail('Categoria não encontrada', 404);
    return ok({ ...data, description: data.description ?? '', product_count: 0 } as Category);
  },
  async getProducts(id: string, params: any = {}) {
    return productsApi.findAll({ ...params, category_id: id });
  },
  async create(input: { name: string; description?: string }): Promise<ApiResponse<Category>> {
    const { data, error } = await supabase.from('product_categories').insert({ name: input.name, description: input.description ?? null }).select().single();
    if (error) fail(error.message);
    return ok({ ...data, description: data.description ?? '', product_count: 0 } as Category);
  },
  async update(id: string, input: { name?: string; description?: string }): Promise<ApiResponse<Category>> {
    const { data, error } = await supabase.from('product_categories').update(input).eq('id', id).select().single();
    if (error) fail(error.message);
    return ok({ ...data, description: data.description ?? '', product_count: 0 } as Category);
  },
  async delete(id: string): Promise<ApiResponse<{ id: string }>> {
    const { error } = await supabase.from('product_categories').delete().eq('id', id);
    if (error) fail(error.message);
    return ok({ id });
  },
};

// ---------- CATÁLOGO PÚBLICO -----------------------------------------------

export const catalogApi = {
  async getProducts(params: { category_id?: string; search?: string } = {}) {
    return productsApi.findAll({ ...params, in_stock: true });
  },
};

// ---------- SISTEMA ---------------------------------------------------------

export const systemApi = {
  async health(): Promise<ApiResponse<{ status: string }>> {
    return ok({ status: 'ok' });
  },
  async info(): Promise<ApiResponse<{ backend: string }>> {
    return ok({ backend: 'lovable-cloud' });
  },
};

// ---------- PEDIDOS (→ sales + sale_items) ---------------------------------

function shortId() {
  return Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
}

async function ensureClient(name: string, phone?: string, document?: string): Promise<string | null> {
  if (!name) return null;
  if (document) {
    const { data: existing } = await supabase.from('clients').select('id').eq('document', document).maybeSingle();
    if (existing) return existing.id;
  }
  const { data, error } = await supabase.from('clients').insert({
    full_name: name, phone: phone ?? null, document: document ?? null,
  }).select('id').single();
  if (error) return null;
  return data.id;
}

async function loadSaleAsOrder(saleId: string): Promise<Order> {
  const { data: sale } = await supabase
    .from('sales')
    .select('*, sale_items(*), clients(full_name, phone, document)')
    .eq('id', saleId)
    .single();
  const s: any = sale;
  const items: OrderItem[] = (s.sale_items || []).map((it: any) => ({
    id: it.id,
    product_id: it.product_id,
    product: { id: it.product_id, name: it.product_name } as Product,
    quantity: Number(it.quantity),
    unit_price: Number(it.unit_price),
    discount: Number(it.discount),
    subtotal: Number(it.total),
    item_type: 'sale',
  }));
  return {
    id: s.id,
    order_number: s.id.slice(0, 8).toUpperCase(),
    customer_id: s.client_id ?? undefined,
    customer_name: s.clients?.full_name ?? '',
    customer_phone: s.clients?.phone ?? undefined,
    customer_document: s.clients?.document ?? undefined,
    order_type: 'sale',
    status: s.status === 'completed' ? 'completed' : s.status === 'cancelled' ? 'cancelled' : 'confirmed',
    items,
    subtotal: Number(s.subtotal),
    total_discount: Number(s.discount),
    total: Number(s.total),
    total_sales: Number(s.total),
    total_rentals: 0,
    observations: s.notes ?? undefined,
    created_at: s.created_at,
    updated_at: s.updated_at,
    created_by: s.cashier_id ?? '',
  };
}

export const ordersApi = {
  async create(input: any): Promise<ApiResponse<Order>> {
    if (input.order_type === 'rental' && (input.items || []).every((item: any) => item.item_type === 'rental')) {
      return ok(await createRentalOrder(input));
    }
    if (input.order_type !== 'sale' || (input.items || []).some((item: any) => item.item_type === 'rental')) {
      return fail('Pedidos mistos ainda não são suportados; finalize o aluguel separadamente.', 501);
    }
    // A Closet Festa opera locações; o fluxo legado de vendas ainda não é transacional.
    return fail('Vendas estão desabilitadas neste PDV. Utilize o fluxo de aluguel.', 501);
  },
  async findAll(params: {
    status?: string; order_type?: string; customer_name?: string;
    date_from?: string; date_to?: string; limit?: number; offset?: number;
  } = {}): Promise<ApiResponse<Order[]>> {
    // A Closet Festa trabalha exclusivamente com locação: contratos
    // são gravados em rental_contracts, não na tabela legada sales.
    // A consulta de sales podia fazer a aba Pedidos falhar inteira mesmo
    // quando os contratos de aluguel já estavam salvos corretamente.
    if (params.order_type === 'sale' || params.order_type === 'hybrid') {
      return ok([], { total: 0 });
    }
    const rentals = await listRentalOrders({
      status: params.status,
      customer_name: params.customer_name,
      date_from: params.date_from,
      date_to: params.date_to,
      limit: params.limit,
      offset: params.offset,
    });
    return ok(rentals.rows, { total: rentals.total });
  },

  async findById(id: string): Promise<ApiResponse<Order>> {
    const rental = await findRentalOrder(id);
    return ok(rental ?? await loadSaleAsOrder(id));
  },

  async updateStatus(id: string, status: string): Promise<ApiResponse<{ id: string }>> {
    if (await findRentalOrder(id)) {
      return fail('Alteração do contrato de aluguel requer fluxo auditado. Operação não realizada.', 501);
    }
    const { error } = await supabase.from('sales').update({ status }).eq('id', id);
    if (error) fail(error.message);
    return ok({ id });
  },

  async pickupItem(orderId: string, itemId: string): Promise<ApiResponse<{ id: string }>> {
    const contract = await findRentalOrder(orderId);
    if (!contract || !contract.items.some(item => item.id === itemId)) {
      return fail('Traje não pertence ao contrato de aluguel informado.', 404);
    }
    return ok({ id: await confirmRentalPickup(itemId) });
  },

  async returnItem(orderId: string, itemId: string, returnData: { observations?: string }): Promise<ApiResponse<{ id: string }>> {
    const contract = await findRentalOrder(orderId);
    if (!contract || !contract.items.some(item => item.id === itemId)) {
      return fail('Traje não pertence ao contrato de aluguel informado.', 404);
    }
    return ok({ id: await confirmRentalReturn(itemId, returnData.observations) });
  },

  async generateContract(_id: string): Promise<ApiResponse<{ url: string | null }>> {
    return fail('Geração de contrato ainda não configurada. Nenhum PDF foi emitido.', 501);
  },
  async generateReceipt(_id: string): Promise<ApiResponse<{ url: string | null }>> {
    return fail('Geração de recibo ainda não configurada. Nenhum documento foi emitido.', 501);
  },
};

// ---------- PAGAMENTOS ------------------------------------------------------

export const paymentsApi = {
  async process(input: {
    order_id: string; amount: number;
    payment_method: 'cash' | 'card' | 'pix' | 'transfer';
    payment_details?: any;
  }): Promise<ApiResponse<Payment>> {
    const rental = await findRentalOrder(input.order_id);
    if (rental) {
      const requestId = input.payment_details?.request_id;
      if (!requestId) return fail('Chave de idempotência obrigatória para pagamento complementar.', 400);
      const method = input.payment_method === 'card'
        ? (input.payment_details?.card_type === 'debit' ? 'debit' : 'credit')
        : input.payment_method;
      const id = await recordRentalPayment({
        contractId: rental.id,
        requestId,
        method,
        amount: Number(input.amount),
        installments: Number(input.payment_details?.installments ?? 1),
      });
      return ok({
        id, order_id: rental.id, amount: Number(input.amount),
        payment_method: input.payment_method, status: 'completed',
        created_at: new Date().toISOString(),
      });
    }
    const { data, error } = await supabase.from('sale_payments').insert({
      sale_id: input.order_id,
      method: input.payment_method,
      amount: Number(input.amount),
      reference: input.payment_details ? JSON.stringify(input.payment_details) : null,
    }).select().single();
    if (error) fail(error.message);
    return ok({
      id: data.id, order_id: input.order_id,
      amount: Number(data.amount),
      payment_method: input.payment_method,
      status: 'completed',
      created_at: data.created_at,
    });
  },

  async findByOrder(orderId: string): Promise<ApiResponse<Payment[]>> {
    const { data, error } = await supabase.from('sale_payments').select('*').eq('sale_id', orderId).order('created_at');
    if (error) fail(error.message);
    return ok((data || []).map((p: any) => ({
      id: p.id, order_id: p.sale_id,
      amount: Number(p.amount),
      payment_method: p.method,
      status: 'completed',
      created_at: p.created_at,
    })));
  },
};

// ---------- ALERTAS / MULTAS / RESERVAS (stubs até termos as tabelas) ------

export const alertsApi = {
  async findAll(_params: any = {}): Promise<ApiResponse<RentalAlert[]>> { return ok([], { total: 0 }); },
  async markAsRead(_id: string): Promise<ApiResponse<{ id: string }>> { return fail('Confirmação de leitura de alerta ainda não implementada.', 501); },
};

export const lateFeeApi = {
  async findAllConfigs(): Promise<ApiResponse<LateFeeConfig[]>> { return ok([], { total: 0 }); },
  async createConfig(_c: any): Promise<ApiResponse<LateFeeConfig>> { return fail('Multas ainda não configuradas', 501) as any; },
  async updateConfig(_id: string, _c: any): Promise<ApiResponse<LateFeeConfig>> { return fail('Multas ainda não configuradas', 501) as any; },
  async calculateFee(orderItemId: string, _r?: string): Promise<ApiResponse<LateFeeCalculation | null>> { return ok(null, { message: `Sem multa configurada para ${orderItemId}` }); },
  async applyFee(_orderItemId: string, _f: any): Promise<ApiResponse<{ id: string }>> { return fail('Cobrança de multa ainda não implementada. Nenhuma cobrança foi aplicada.', 501); },
  async waiveFee(_orderItemId: string, _reason: string): Promise<ApiResponse<{ id: string }>> { return fail('Isenção de multa ainda não implementada. Nenhuma isenção foi registrada.', 501); },
  async getFeeHistory(_p: any = {}): Promise<ApiResponse<LateFeeCalculation[]>> { return ok([], { total: 0 }); },
};

export const reservationsApi = {
  async create(_r: any): Promise<ApiResponse<Reservation>> { return fail('Reservas ainda não configuradas', 501) as any; },
  async findAll(_p: any = {}): Promise<ApiResponse<Reservation[]>> { return ok([], { total: 0 }); },
  async findById(_id: string): Promise<ApiResponse<Reservation | null>> { return ok(null); },
  async updateStatus(_id: string, _s: string, _n?: string): Promise<ApiResponse<{ id: string }>> { return fail('Atualização de reserva ainda não implementada.', 501); },
  async confirm(_id: string, _c?: any): Promise<ApiResponse<{ id: string }>> { return fail('Confirmação de reserva ainda não implementada.', 501); },
  async cancel(_id: string, _r: string): Promise<ApiResponse<{ id: string }>> { return fail('Cancelamento de reserva ainda não implementado.', 501); },
  async convertToOrder(_id: string): Promise<ApiResponse<{ id: string }>> { return fail('Conversão de reserva em contrato ainda não implementada.', 501); },
  async checkAvailability(_product_id: string, _date_from: string, _date_to: string): Promise<ApiResponse<AvailabilityCheck>> {
    return fail('Disponibilidade ainda não está integrada aos contratos. Não é seguro confirmar esta reserva.', 501);
  },
  async getAvailableSlots(_date: string, _duration_hours = 4): Promise<ApiResponse<TimeSlot[]>> { return ok([]); },
  async getCalendar(_p: any): Promise<ApiResponse<Reservation[]>> { return ok([]); },
};

// ---------- RELATÓRIOS ------------------------------------------------------

export const reportsApi = {
  async salesDashboard(params: { date_from?: string; date_to?: string } = {}): Promise<ApiResponse<any>> {
    let q = supabase.from('sales').select('total, created_at, status');
    if (params.date_from) q = q.gte('created_at', params.date_from);
    if (params.date_to) q = q.lte('created_at', params.date_to);
    const { data, error } = await q;
    if (error) fail(error.message);
    const rows = data || [];
    const total = rows.reduce((acc, r: any) => acc + Number(r.total || 0), 0);
    return ok({ total_sales: total, count: rows.length, series: rows });
  },
  async rentalsReport(_p: any = {}): Promise<ApiResponse<any>> { return ok({ total: 0, items: [] }); },
  async topProducts(params: { type?: string; date_from?: string; date_to?: string; limit?: number } = {}): Promise<ApiResponse<any[]>> {
    const { data, error } = await supabase.from('sale_items').select('product_id, product_name, quantity, total');
    if (error) fail(error.message);
    const map = new Map<string, { product_id: string; product_name: string; quantity: number; total: number }>();
    (data || []).forEach((it: any) => {
      const cur = map.get(it.product_id) || { product_id: it.product_id, product_name: it.product_name, quantity: 0, total: 0 };
      cur.quantity += Number(it.quantity); cur.total += Number(it.total);
      map.set(it.product_id, cur);
    });
    const arr = Array.from(map.values()).sort((a, b) => b.quantity - a.quantity).slice(0, params.limit ?? 10);
    return ok(arr);
  },
};
