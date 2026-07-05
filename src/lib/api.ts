// ============================================================================
// Adaptador Supabase — substitui o antigo backend Node.js (localhost:3001).
// Mantém as mesmas assinaturas (*Api.method) usadas por hooks e componentes,
// mas grava/lê diretamente do Lovable Cloud (Supabase).
// ============================================================================

import { supabase } from '@/integrations/supabase/client';

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
    name: row.name,
    description: row.description ?? '',
    price: Number(row.price ?? 0),
    rental_price: meta.rental_price != null ? Number(meta.rental_price) : Number(row.price ?? 0),
    quantity: Number(row.stock_quantity ?? 0),
    category_id: row.category_id ?? '',
    sizes: Array.isArray(meta.sizes) ? meta.sizes : (typeof meta.sizes === 'string' ? meta.sizes.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
    featured: Boolean(meta.featured),
    deleted: row.deleted_at != null,
    status: (meta.status as Product['status']) || 'available',
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

    if (input.sizes !== undefined || input.featured !== undefined || input.rental_price !== undefined || input.status !== undefined) {
      const { data: existing } = await supabase.from('products').select('metadata').eq('id', id).maybeSingle();
      const metadata: Record<string, any> = { ...(existing?.metadata as any || {}) };
      if (input.sizes !== undefined) metadata.sizes = Array.isArray(input.sizes) ? input.sizes : String(input.sizes).split(',').map((s: string) => s.trim()).filter(Boolean);
      if (input.featured !== undefined) metadata.featured = !!input.featured;
      if (input.rental_price !== undefined) metadata.rental_price = Number(input.rental_price);
      if (input.status !== undefined) metadata.status = input.status;
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
      const { error } = await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) fail(error.message);
    }
    return ok({ id });
  },

  async uploadImages(productId: string, files: File[]): Promise<ApiResponse<ProductImage[]>> {
    const uploaded: ProductImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = `${productId}/${Date.now()}-${i}-${file.name}`.replace(/\s+/g, '_');
      const { error: upErr } = await supabase.storage.from('product-images').upload(path, file, { upsert: false });
      if (upErr) fail(upErr.message);
      // Bucket privado: gerar signed URL de longa duração (1 ano).
      const { data: signed } = await supabase.storage.from('product-images').createSignedUrl(path, 60 * 60 * 24 * 365);
      const url = signed?.signedUrl ?? '';
      const { data, error } = await supabase.from('product_images').insert({
        product_id: productId,
        url,
        storage_path: path,
        position: i,
        is_primary: i === 0,
      }).select().single();
      if (error) fail(error.message);
      uploaded.push({
        id: data.id, file_name: file.name, file_path: path,
        display_order: i, url, thumbnail_url: url,
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
    const { data: userData } = await supabase.auth.getUser();
    const cashierId = userData.user?.id ?? null;

    const clientId = await ensureClient(input.customer_name, input.customer_phone, input.customer_document);

    const { data: sale, error: saleErr } = await supabase.from('sales').insert({
      client_id: clientId,
      cashier_id: cashierId,
      subtotal: Number(input.subtotal ?? 0),
      discount: Number(input.total_discount ?? 0),
      total: Number(input.total ?? 0),
      status: 'completed',
      notes: input.observations ?? null,
    }).select().single();
    if (saleErr) fail(saleErr.message);

    const itemsPayload = (input.items || []).map((it: any) => ({
      sale_id: sale.id,
      product_id: it.product_id,
      product_name: it.product_name ?? it.name ?? '',
      quantity: Number(it.quantity),
      unit_price: Number(it.unit_price),
      discount: Number(it.discount ?? 0),
      total: Number(it.unit_price) * Number(it.quantity) - Number(it.discount ?? 0),
    }));

    if (itemsPayload.length) {
      // preencher product_name se ausente
      const missingNames = itemsPayload.filter(i => !i.product_name).map(i => i.product_id);
      if (missingNames.length) {
        const { data: prods } = await supabase.from('products').select('id, name').in('id', missingNames);
        const nameMap = new Map((prods || []).map((p: any) => [p.id, p.name]));
        itemsPayload.forEach(i => { if (!i.product_name) i.product_name = nameMap.get(i.product_id) || 'Produto'; });
      }
      const { error: itErr } = await supabase.from('sale_items').insert(itemsPayload);
      if (itErr) fail(itErr.message);
    }

    // Registrar transação financeira
    await supabase.from('financial_transactions').insert({
      type: 'income',
      category: 'sale',
      description: `Venda #${sale.id.slice(0, 8)}`,
      amount: Number(sale.total),
      status: 'paid',
      paid_at: new Date().toISOString(),
      reference_id: sale.id,
      reference_type: 'sale',
      created_by: cashierId,
    });

    return ok(await loadSaleAsOrder(sale.id));
  },

  async findAll(params: {
    status?: string; order_type?: string; customer_name?: string;
    date_from?: string; date_to?: string; limit?: number; offset?: number;
  } = {}): Promise<ApiResponse<Order[]>> {
    let q = supabase.from('sales').select('id', { count: 'exact' }).order('created_at', { ascending: false });
    if (params.status) q = q.eq('status', params.status);
    if (params.date_from) q = q.gte('created_at', params.date_from);
    if (params.date_to) q = q.lte('created_at', params.date_to);
    if (params.limit) q = q.limit(params.limit);
    if (params.offset != null && params.limit) q = q.range(params.offset, params.offset + params.limit - 1);
    const { data, error, count } = await q;
    if (error) fail(error.message);
    const orders = await Promise.all((data || []).map((r: any) => loadSaleAsOrder(r.id)));
    return ok(orders, { total: count ?? orders.length });
  },

  async findById(id: string): Promise<ApiResponse<Order>> {
    return ok(await loadSaleAsOrder(id));
  },

  async updateStatus(id: string, status: string): Promise<ApiResponse<{ id: string }>> {
    const { error } = await supabase.from('sales').update({ status }).eq('id', id);
    if (error) fail(error.message);
    return ok({ id });
  },

  async returnItem(_orderId: string, itemId: string, _returnData: any): Promise<ApiResponse<{ id: string }>> {
    return ok({ id: itemId });
  },

  async generateContract(id: string): Promise<ApiResponse<{ url: string | null }>> {
    return ok({ url: null }, { message: `Contrato #${id.slice(0, 8)} — geração PDF ainda não configurada.` });
  },
  async generateReceipt(id: string): Promise<ApiResponse<{ url: string | null }>> {
    return ok({ url: null }, { message: `Recibo #${id.slice(0, 8)} — geração PDF ainda não configurada.` });
  },
};

// ---------- PAGAMENTOS ------------------------------------------------------

export const paymentsApi = {
  async process(input: {
    order_id: string; amount: number;
    payment_method: 'cash' | 'card' | 'pix' | 'transfer';
    payment_details?: any;
  }): Promise<ApiResponse<Payment>> {
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
  async markAsRead(id: string): Promise<ApiResponse<{ id: string }>> { return ok({ id }); },
};

export const lateFeeApi = {
  async findAllConfigs(): Promise<ApiResponse<LateFeeConfig[]>> { return ok([], { total: 0 }); },
  async createConfig(_c: any): Promise<ApiResponse<LateFeeConfig>> { return fail('Multas ainda não configuradas', 501) as any; },
  async updateConfig(_id: string, _c: any): Promise<ApiResponse<LateFeeConfig>> { return fail('Multas ainda não configuradas', 501) as any; },
  async calculateFee(orderItemId: string, _r?: string): Promise<ApiResponse<LateFeeCalculation | null>> { return ok(null, { message: `Sem multa configurada para ${orderItemId}` }); },
  async applyFee(orderItemId: string, _f: any): Promise<ApiResponse<{ id: string }>> { return ok({ id: orderItemId }); },
  async waiveFee(orderItemId: string, _reason: string): Promise<ApiResponse<{ id: string }>> { return ok({ id: orderItemId }); },
  async getFeeHistory(_p: any = {}): Promise<ApiResponse<LateFeeCalculation[]>> { return ok([], { total: 0 }); },
};

export const reservationsApi = {
  async create(_r: any): Promise<ApiResponse<Reservation>> { return fail('Reservas ainda não configuradas', 501) as any; },
  async findAll(_p: any = {}): Promise<ApiResponse<Reservation[]>> { return ok([], { total: 0 }); },
  async findById(_id: string): Promise<ApiResponse<Reservation | null>> { return ok(null); },
  async updateStatus(id: string, _s: string, _n?: string): Promise<ApiResponse<{ id: string }>> { return ok({ id }); },
  async confirm(id: string, _c?: any): Promise<ApiResponse<{ id: string }>> { return ok({ id }); },
  async cancel(id: string, _r: string): Promise<ApiResponse<{ id: string }>> { return ok({ id }); },
  async convertToOrder(id: string): Promise<ApiResponse<{ id: string }>> { return ok({ id }); },
  async checkAvailability(product_id: string, date_from: string, date_to: string): Promise<ApiResponse<AvailabilityCheck>> {
    return ok({ product_id, date_from, date_to, is_available: true, conflicting_reservations: [] });
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
