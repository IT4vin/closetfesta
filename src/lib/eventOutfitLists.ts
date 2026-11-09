import { supabase } from '@/integrations/supabase/client';
import { productsApi, type Product } from '@/lib/api';

// As tabelas novas já foram aplicadas ao Supabase; tipagens geradas serão atualizadas
// na próxima sincronização do schema.
const db = supabase as any;

export type OutfitGroup = {
  id: string;
  list_id: string;
  role: string;
  target_count: number;
  garment_color: string | null;
  accessory_color: string | null;
  garment_notes: string | null;
  accessory_notes: string | null;
  position: number;
};

export type OutfitList = {
  id: string;
  title: string;
  organizer_name: string;
  partner_name: string | null;
  event_kind: string;
  event_date: string;
  venue: string | null;
  phone: string | null;
  notes: string | null;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at: string;
};

export type OutfitRuleProduct = {
  id: string;
  group_id: string;
  product_id: string;
  item_kind: 'traje' | 'acessorio';
  required: boolean;
  notes: string | null;
  position: number;
  products?: {
    id: string;
    name: string;
    sku: string | null;
    price: number;
    metadata?: Record<string, any>;
    product_images?: Array<{ url: string; position: number; is_primary: boolean }>;
  };
};

export type OutfitParticipant = {
  id: string;
  list_id: string;
  group_id: string;
  client_id: string;
  contract_id: string | null;
  status: 'pending' | 'contacted' | 'fitting' | 'contracted' | 'completed' | 'cancelled';
  notes: string | null;
  spec_snapshot?: Record<string, any> | null;
  clients?: {
    id: string;
    full_name: string;
    document: string | null;
    phone: string | null;
    email: string | null;
    address: Record<string, string> | null;
  };
  rental_contracts?: {
    id: string;
    contract_number: number;
    status: string;
    total: number;
  } | null;
};

export type OutfitDetail = {
  listing: OutfitList;
  groups: OutfitGroup[];
  rules: OutfitRuleProduct[];
  participants: OutfitParticipant[];
};

export type GroupInput = Pick<OutfitGroup,
  'role' | 'target_count' | 'garment_color' | 'accessory_color' | 'garment_notes' | 'accessory_notes' | 'position'>;

function check<T>(data: T, error: any): T {
  if (error) throw new Error(error.message || 'Não foi possível salvar a listagem.');
  return data;
}

export const outfitListApi = {
  async getAll(): Promise<OutfitList[]> {
    const { data, error } = await db.from('event_outfit_lists')
      .select('*').order('event_date', { ascending: true }).limit(500);
    return check(data ?? [], error) as OutfitList[];
  },

  async create(input: {
    title: string;
    organizer_name: string;
    partner_name: string;
    event_kind: string;
    event_date: string;
    venue: string;
    phone: string;
    notes: string;
    groups: GroupInput[];
  }): Promise<string> {
    const { data, error } = await db.rpc('event_outfit_create_list', { p_data: input });
    return check(data, error) as string;
  },

  async getDetail(id: string): Promise<OutfitDetail> {
    const [a, b, c] = await Promise.all([
      db.from('event_outfit_lists').select('*').eq('id', id).single(),
      db.from('event_outfit_groups').select('*').eq('list_id', id).order('position'),
      db.from('event_outfit_participants')
        .select('*, clients(id,full_name,document,phone,email,address), rental_contracts(id,contract_number,status,total)')
        .eq('list_id', id).order('created_at')
    ]);
    const listing = check(a.data, a.error) as OutfitList;
    const groups = check(b.data ?? [], b.error) as OutfitGroup[];
    const participants = check(c.data ?? [], c.error) as OutfitParticipant[];

    let rules: OutfitRuleProduct[] = [];
    if (groups.length) {
      const r = await db.from('event_outfit_group_products')
        .select('*, products(id,name,sku,price,metadata,product_images(url,position,is_primary))')
        .in('group_id', groups.map(g => g.id)).order('position');
      rules = check(r.data ?? [], r.error) as OutfitRuleProduct[];
    }
    return { listing, groups, participants, rules };
  },

  async updateListing(id: string, patch: Partial<OutfitList>) {
    const { error } = await db.from('event_outfit_lists')
      .update(patch).eq('id', id);
    check(null, error);
  },

  async saveGroup(group: GroupInput & { id?: string; list_id: string }) {
    if (group.id) {
      const { error } = await db.from('event_outfit_groups')
        .update({ role: group.role, target_count: group.target_count,
          garment_color: group.garment_color, accessory_color: group.accessory_color,
          garment_notes: group.garment_notes, accessory_notes: group.accessory_notes })
        .eq('id', group.id).eq('list_id', group.list_id);
      check(null, error);
    } else {
      const { error } = await db.from('event_outfit_groups').insert(group);
      check(null, error);
    }
  },

  async addRule(input: {
    group_id: string;
    product_id: string;
    item_kind: 'traje' | 'acessorio';
    required: boolean;
    notes?: string;
  }) {
    const { error } = await db.from('event_outfit_group_products').insert({
      ...input, notes: input.notes || null,
    });
    check(null, error);
  },

  async removeRule(ruleId: string) {
    const { error } = await db.from('event_outfit_group_products').delete().eq('id', ruleId);
    check(null, error);
  },

  async addParticipant(groupId: string, details: Record<string, any>) {
    const { data, error } = await db.rpc('event_outfit_add_participant', {
      p_group_id: groupId,
      p_client: details,
    });
    return check(data, error) as { id: string; client_id: string; existing_client: boolean };
  },

  async updateParticipant(id: string, status: OutfitParticipant['status'], notes: string) {
    const { error } = await db.from('event_outfit_participants')
      .update({ status, notes }).eq('id', id);
    check(null, error);
  },

  async findContractsForClient(clientId: string) {
    const { data, error } = await db.from('rental_contracts')
      .select('id,contract_number,status,total,created_at,rental_items(product_id,event_date,status)')
      .eq('client_id', clientId)
      .neq('status', 'cancelled').order('created_at', { ascending: false }).limit(40);
    return check(data ?? [], error) as Array<{
      id: string; contract_number: number; status: string; total: number;
      rental_items: Array<{product_id:string;event_date:string;status:string}>;
    }>;
  },

  async createContract(participantId: string, request: Record<string, any>) {
    const { data, error } = await db.rpc('event_outfit_create_contract', {
      p_participant_id: participantId, p_request: request,
    });
    return check(data, error) as { id: string; number: number; total: number; already_exists: boolean };
  },

  async linkContract(participantId: string, contractId: string) {
    const { data, error } = await db.rpc('event_outfit_link_contract', {
      p_participant_id: participantId, p_contract_id: contractId,
    });
    return check(data, error);
  },

  async getCatalogProducts(): Promise<Product[]> {
    const response = await productsApi.findAll();
    return response.data.filter(product => !product.deleted);
  },
};
