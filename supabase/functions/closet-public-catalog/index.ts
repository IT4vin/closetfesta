// Closet Festa: vitrine pública, exclusivamente leitura.
// Banco, preços e imagens vêm do mesmo projeto do sistema administrativo.
// Nunca envie service_role ao navegador. Nenhum dado de cliente/contrato/custo sai daqui.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const CONTENT_TYPE = "application/json; charset=utf-8";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
  "Vary": "Origin",
};
const response = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: {
      ...cors,
      "Content-Type": CONTENT_TYPE,
      "Cache-Control": status === 200 ? "public, max-age=15, s-maxage=15" : "no-store",
    },
  });

const text = (v: unknown, fallback = "") =>
  typeof v === "string" ? v.trim().slice(0, 500) : fallback;
const words = (v: unknown, max = 30) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string")
    .map(x => x.trim().slice(0, 80)).filter(Boolean).slice(0, max) : [];
const slugPart = (v: unknown) =>
  text(v).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const categorySlug = (v: unknown) => {
  const c = slugPart(v);
  if (c.startsWith("vestid")) return "vestidos";
  if (c.startsWith("terno")) return "ternos";
  if (c.startsWith("acessor")) return "acessorios";
  if (c.startsWith("calcad")) return "calcados";
  if (c.startsWith("trajes-infantis")) return "infantil";
  return c || "outros";
};
type ImageRow = {
  url: string | null; storage_path: string | null;
  position: number | null; is_primary: boolean | null;
};
type ProductRow = {
  id: string; sku: string | null; name: string; description: string | null;
  price: number | string; metadata: Record<string, unknown> | null;
  created_at: string; updated_at: string;
  product_categories: { name: string } | null;
  product_images: ImageRow[] | null;
};

// Id numérico estável (carrinho/favoritos do site já usam number).
// Preserva o ID histórico dos SKUs numéricos (ex.: 010001 => 10001).
function numericId(sku: string, uuid: string, used: Set<number>) {
  const n = /^\d+$/.test(sku) ? Number(sku) : NaN;
  if (Number.isSafeInteger(n) && n > 0 && !used.has(n)) {
    used.add(n);
    return n;
  }
  let hash = Number.parseInt(uuid.replace(/-/g, "").slice(0, 13), 16);
  while (used.has(hash)) hash++;
  used.add(hash);
  return hash;
}
function validImageUrl(url: unknown) {
  if (typeof url !== "string" || url.length > 2200) return "";
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? url : "";
  } catch { return ""; }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, {status: 204, headers: cors});
  if (req.method !== "GET") return response({error: "Método não permitido."}, 405);
  if (!SUPABASE_URL || !SERVICE_KEY) return response({error: "Catálogo temporariamente indisponível."}, 503);

  try {
    const db = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: {persistSession: false, autoRefreshToken: false},
    });
    const records: ProductRow[] = [];
    const batch = 250;
    for (let offset = 0; offset < 10000; offset += batch) {
      const {data, error} = await db.from("products")
        .select("id,sku,name,description,price,metadata,created_at,updated_at,product_categories(name),product_images(url,storage_path,position,is_primary)")
        .eq("active", true)
        .eq("show_in_catalog", true)
        .is("deleted_at", null)
        .order("created_at", {ascending: false})
        .order("id", {ascending: true})
        .range(offset, offset + batch - 1);
      if (error) throw error;
      records.push(...((data ?? []) as unknown as ProductRow[]));
      if ((data?.length ?? 0) < batch) break;
    }

    // Assina imagens privadas para o site público. A assinatura expira e será
    // renovada automaticamente em novas consultas; o bucket permanece privado.
    const paths = [...new Set(records.flatMap(p =>
      (p.product_images ?? []).map(img => img.storage_path).filter((p):p is string => !!p),
    ))];
    const signed = new Map<string,string>();
    const chunks: string[][] = [];
    for (let i = 0; i < paths.length; i += 150) chunks.push(paths.slice(i, i+150));
    await Promise.all(chunks.map(async chunk => {
      const {data, error} = await db.storage.from("product-images")
        .createSignedUrls(chunk, 7 * 24 * 60 * 60);
      if (error || !data) return; // URL existente apenas como contingência
      for (let i = 0; i < data.length; i++) {
        const image = data[i] as {signedUrl?:string;path?:string;error?:string};
        const safe = validImageUrl(image.signedUrl);
        const path = image.path || chunk[i];
        if (path && safe && !image.error) signed.set(path, safe);
      }
    }));

    const usedIds = new Set<number>();
    const catalog = records.map(row => {
      const meta = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
      const category = categorySlug(row.product_categories?.name);
      const cor = text(meta.color, "Outros") || "Outros";
      const sku = text(row.sku) || row.id;
      const photos = [...(row.product_images ?? [])].sort((a,b) =>
        Number(b.is_primary===true)-Number(a.is_primary===true) ||
        Number(a.position??0)-Number(b.position??0),
      );
      const imagens = photos.map(photo =>
        (photo.storage_path && signed.get(photo.storage_path)) || validImageUrl(photo.url),
      ).filter(Boolean);
      const colors = words(meta.colors);
      const sizes = words(meta.sizes);
      const tipos = [...new Set([
        category,
        text(meta.type),
        ...words(meta.tipos),
        ...words(meta.tags),
      ].filter(Boolean))];

      const price = Number(meta.rental_price ?? row.price);
      return {
        id: numericId(sku,row.id,usedIds),
        supabaseId: row.id,
        codigo: sku,
        nome: text(row.name),
        preco: Number.isFinite(price) && price >= 0 ? price : 0,
        imagem: imagens[0] ?? "",
        imagens,
        cor,
        categoriaTipo: category,
        slug: text(meta.public_slug) || (category + "-" + slugPart(cor) + "-" + slugPart(sku)),
        coresDisponiveis: colors.length ? colors : [cor],
        tamanhos: sizes,
        descricao: text(row.description),
        tipos,
        atualizadoEm: row.updated_at,
        criadoEm: row.created_at,
      };
    });

    // Uso facultativo para testes de disponibilidade; catálogo normal lê todos.
    const url = new URL(req.url);
    const testLimit = Number(url.searchParams.get("limit"));
    const products = url.searchParams.has("limit") && Number.isInteger(testLimit) &&
      testLimit > 0 && testLimit <= 10 ? catalog.slice(0,testLimit) : catalog;
    return response({source:"closetfesta-administrativo",version:2,total:catalog.length,products});
  } catch (_error) {
    // Nunca devolver SQL, tokens, chaves de serviço ou detalhes internos.
    return response({error: "Não foi possível consultar o catálogo agora."}, 503);
  }
});
