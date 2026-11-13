import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Eye, EyeOff, ImageOff, Loader2, RefreshCw, Search, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { categoriesApi, productsApi, type Category, type Product } from "@/lib/api";

const PAGE_SIZE = 24;
type Visibility = "all" | "visible" | "hidden";
const PUBLIC_CATALOG_URL = "https://www.closetfesta.com.br/catalogo";
const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function ProductVisibilityCard({ product, editable, pending, onChange }: {
  product: Product;
  editable: boolean;
  pending: boolean;
  onChange: (product: Product, value: boolean) => void;
}) {
  const visible = product.show_in_catalog !== false;
  const published = visible && product.active !== false;
  const image = product.images?.[0]?.url || product.image;
  const switchId = "public-product-" + product.id;
  return (
    <Card className="overflow-hidden border-neutral-200 transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {image ? (
          <img src={image} alt={product.name} loading="lazy" className="h-full w-full object-contain"
            onError={event => { event.currentTarget.style.visibility = "hidden"; }} />
        ) : <div className="flex h-full items-center justify-center text-neutral-400"><ImageOff className="h-9 w-9" /></div>}
        <Badge className={"absolute right-3 top-3 gap-1 border-0 text-white " + (published ? "bg-emerald-700" : "bg-neutral-800")}>
          {published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {published ? "Público" : visible ? "Produto inativo" : "Oculto"}
        </Badge>
      </div>
      <CardContent className="space-y-3 p-4">
        <div className="min-h-[76px]">
          <h3 className="line-clamp-2 text-base font-semibold text-neutral-900">{product.name}</h3>
          <p className="mt-1 text-xs text-neutral-500">
            Código: {product.sku || "Sem código"}
            {product.category?.name ? " · " + product.category.name : ""}
          </p>
          <p className="mt-2 text-sm font-semibold text-marsala">{money(Number(product.rental_price ?? product.price))}</p>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div className="min-w-0 flex-1">
            <label htmlFor={switchId} className="block cursor-pointer text-sm font-medium text-neutral-800">
              Mostrar no catálogo público
            </label>
            <p className="mt-1 text-xs text-neutral-500">
              {pending ? "Salvando..." : visible ? "Liberado para o site" : "Oculto para clientes"}
            </p>
          </div>
          {pending && <Loader2 className="h-4 w-4 animate-spin text-marsala" aria-label="Salvando" />}
          <Switch id={switchId} checked={visible} disabled={!editable || pending}
            aria-label={"Mostrar " + product.name + " no catálogo público"}
            onCheckedChange={next => onChange(product, next)} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Catalog() {
  const { user } = useAuth();
  const canManage = user?.role?.id === "admin" || user?.role?.id === "manager";
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ total: 0, visible: 0, hidden: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    void categoriesApi.findAll().then(result => {
      if (active) setCategories(result.data);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void Promise.all([
      productsApi.findAll({
        category_id: categoryId === "all" ? undefined : categoryId,
        catalog_visibility: visibility,
        search: search || undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
      productsApi.getCatalogCounts(),
    ]).then(([response, totals]) => {
      if (!active) return;
      setProducts(response.data);
      setTotal(response.total ?? response.data.length);
      setSummary(totals);
    }).catch(cause => {
      if (active) setError(cause instanceof Error ? cause.message : "Erro ao carregar catálogo.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [categoryId, visibility, search, page, refresh]);

  const updateVisibility = async (product: Product, next: boolean) => {
    if (!canManage || pendingId) return;
    setPendingId(product.id);
    setError("");
    setNotice("");
    try {
      const result = await productsApi.setCatalogVisibility(product.id, next);
      if (!result.success || result.data.show_in_catalog !== next) {
        throw new Error("O Supabase não confirmou a atualização.");
      }
      setProducts(current => current.map(p => p.id === product.id ? { ...p, show_in_catalog: next } : p));
      setNotice(next
        ? "Produto liberado para exibição no site: " + product.name
        : "Produto oculto do site, mas mantido no estoque e nos contratos: " + product.name);
      setRefresh(old => old + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar a visibilidade.");
    } finally {
      setPendingId(null);
    }
  };

  const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="page-transition mx-auto w-full max-w-7xl space-y-5 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-marsala md:text-3xl">Catálogo público</h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            Escolha os produtos que aparecem no site Closet Festa. Ocultar não remove a peça do estoque, do PDV nem dos pedidos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setRefresh(old => old + 1)}
            disabled={loading} className="gap-2">
            <RefreshCw className={"h-4 w-4 " + (loading ? "animate-spin" : "")} /> Atualizar
          </Button>
          <Button type="button" asChild className="gap-2 bg-marsala hover:bg-marsala/90">
            <a href={PUBLIC_CATALOG_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" /> Ver catálogo público
            </a>
          </Button>
        </div>
      </div>
      {!canManage && (
        <div role="status" className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          Apenas Administradores e Gerentes podem publicar ou ocultar produtos. Seu acesso é de consulta.
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: "Produtos", count: summary.total },
          { label: "Liberados", count: summary.visible },
          { label: "Ocultos", count: summary.hidden },
        ].map(item => (
          <div key={item.label} className="rounded-xl border bg-white px-3 py-4 shadow-sm sm:px-5">
            <p className="text-xs text-neutral-500 sm:text-sm">{item.label}</p>
            <p className="mt-2 text-xl font-semibold text-marsala sm:text-3xl">{item.count}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 rounded-xl border bg-white p-3 shadow-sm sm:grid-cols-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
          <Input value={searchInput} aria-label="Buscar produto no catálogo"
            onChange={event => setSearchInput(event.target.value)}
            placeholder="Buscar por nome..." className="pl-9" />
        </div>
        <Select value={categoryId} onValueChange={value => { setCategoryId(value); setPage(1); }}>
          <SelectTrigger aria-label="Filtrar categoria"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={visibility} onValueChange={value => { setVisibility(value as Visibility); setPage(1); }}>
          <SelectTrigger aria-label="Filtrar visibilidade"><SelectValue placeholder="Visibilidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os produtos</SelectItem>
            <SelectItem value="visible">Liberados para o site</SelectItem>
            <SelectItem value="hidden">Ocultos do site</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
      <div className="flex items-center justify-between text-sm text-neutral-600">
        <span>{loading ? "Carregando..." : total + " produto(s) encontrados"}</span>
        <span>Página {page} de {maxPage}</span>
      </div>

      {loading ? (
        <div className="flex min-h-[220px] items-center justify-center gap-2 text-sm text-neutral-600">
          <Loader2 className="h-5 w-5 animate-spin text-marsala" /> Carregando produtos...
        </div>
      ) : products.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map(product => (
            <ProductVisibilityCard key={product.id} product={product} editable={canManage}
              pending={pendingId === product.id} onChange={(item, value) => { void updateVisibility(item, value); }} />
          ))}
        </div>
      ) : !error ? (
        <div className="rounded-xl border bg-white px-4 py-14 text-center text-sm text-neutral-600">
          Nenhum produto encontrado com esses filtros.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button variant="outline" disabled={loading || page <= 1}
          onClick={() => setPage(current => Math.max(1, current - 1))}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
        </Button>
        <span className="text-sm text-neutral-600">Página {page} de {maxPage}</span>
        <Button variant="outline" disabled={loading || page >= maxPage}
          onClick={() => setPage(current => Math.min(maxPage, current + 1))}>
          Próxima <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      <p className="text-center text-xs text-neutral-500">
        Ao atualizar o site público, as alterações aparecem após a atualização do cache da vitrine.
      </p>
    </div>
  );
}
