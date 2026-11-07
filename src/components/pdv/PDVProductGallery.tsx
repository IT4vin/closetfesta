import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ImageOff, Plus, RotateCcw, PackageSearch, Filter, Shirt, Check } from "lucide-react";
import type { Product } from "@/hooks/useProducts";

const money = (value: number) => new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL",
}).format(value);

export const rentalPrice = (product: Product): number =>
  Number(product.rental_price ?? product.rentalPrice ?? product.price ?? 0);

export const isAvailableForRental = (product: Product): boolean =>
  product.status === "available" && product.quantity > 0;

/** Usa fotos realmente cadastradas no Supabase; mostra placeholder quando indisponíveis. */
export function PDVProductPhoto({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = product.image || product.images?.find(image => Boolean(image.url))?.url;
  useEffect(() => setFailed(false), [url]);

  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-stone-100 ${className}`}>
      {url && !failed ? (
        <img
          src={url}
          alt={`Foto do traje ${product.name}`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 px-3 text-center text-stone-400">
          <ImageOff aria-hidden="true" className="h-8 w-8" />
          <span className="text-[11px] font-medium leading-tight">
            {url ? "Foto indisponível" : "Sem foto cadastrada"}
          </span>
        </div>
      )}
    </div>
  );
}

interface PDVProductGalleryProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  cartQuantities: Record<string, number>;
  onAdd: (product: Product) => void;
  onRefresh: () => void;
}

export default function PDVProductGallery({
  products,
  loading,
  error,
  cartQuantities,
  onAdd,
  onRefresh,
}: PDVProductGalleryProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [onlyAvailable, setOnlyAvailable] = useState(true);

  const categories = useMemo(() => {
    const unique = new Map<string, string>();
    for (const product of products) {
      const id = product.category_id || "uncategorized";
      if (!unique.has(id)) unique.set(id, product.category?.name || "Sem categoria");
    }
    return Array.from(unique, ([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [products]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return products.filter(product => {
      if (onlyAvailable && !isAvailableForRental(product)) return false;
      if (category !== "all" && (product.category_id || "uncategorized") !== category) return false;
      if (!term) return true;
      return [product.name, product.sku, product.color, product.type, product.description]
        .some(value => value?.toLocaleLowerCase("pt-BR").includes(term));
    });
  }, [products, search, category, onlyAvailable]);

  const available = products.filter(isAvailableForRental).length;

  return (
    <section className="space-y-4" aria-label="Catálogo visual de trajes">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-stone-900">
            <Shirt aria-hidden="true" className="h-5 w-5 text-rose-800" />
            Escolha os trajes
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Fotos e informações dos produtos cadastrados na loja.
          </p>
        </div>
        <Badge variant="outline" className="border-stone-200 bg-stone-50 px-3 py-1.5 text-stone-600">
          {available} disponíveis / {products.length} cadastrados
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
        <div className="relative">
          <Search aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="h-11 rounded-xl border-stone-200 bg-white pl-10"
            placeholder="Buscar por nome, código, cor ou modelo..."
            aria-label="Buscar trajes"
          />
        </div>
        <div className="relative">
          <Filter aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <select
            aria-label="Filtrar categoria"
            value={category}
            onChange={event => setCategory(event.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-stone-200 bg-white pl-10 pr-3 text-sm"
          >
            <option value="all">Todas as categorias</option>
            {categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={event => setOnlyAvailable(event.target.checked)}
            className="h-4 w-4 accent-rose-800"
          />
          Mostrar apenas trajes disponíveis
        </label>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
        </span>
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <span>Não foi possível consultar os produtos: {error}</span>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RotateCcw className="mr-2 h-4 w-4" /> Tentar novamente
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-4" aria-label="Carregando trajes">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-stone-100">
              <div className="aspect-[4/5] bg-stone-100" />
              <div className="space-y-2 p-3">
                <div className="h-4 rounded bg-stone-100" />
                <div className="h-4 w-2/3 rounded bg-stone-100" />
              </div>
            </div>
          ))}
        </div>
      ) : !error && filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-6 py-14 text-center">
          <PackageSearch aria-hidden="true" className="h-10 w-10 text-stone-400" />
          <strong className="text-stone-700">Nenhum traje encontrado</strong>
          <p className="max-w-sm text-sm text-muted-foreground">
            {products.length === 0
              ? "Cadastre os primeiros trajes com fotos na área de Produtos para que apareçam aqui."
              : "Tente outra busca, categoria ou desmarque o filtro de disponibilidade."}
          </p>
          {(search || category !== "all" || onlyAvailable) && products.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => {
              setSearch(""); setCategory("all"); setOnlyAvailable(false);
            }}>Limpar filtros</Button>
          )}
        </div>
      ) : (
        <div className="grid max-h-[880px] grid-cols-2 gap-3 overflow-y-auto pr-1 md:grid-cols-3 2xl:grid-cols-4">
          {filtered.map(product => {
            const availableForRental = isAvailableForRental(product);
            const inCart = cartQuantities[product.id] ?? 0;
            const price = rentalPrice(product);
            return (
              <article
                key={product.id}
                className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md"
              >
                <div className="relative">
                  <PDVProductPhoto product={product} className="aspect-[4/5] w-full" />
                  <div className="absolute left-2 top-2">
                    <Badge className={availableForRental
                      ? "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                      : "border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-100"}>
                      {availableForRental ? "Disponível" : "Indisponível"}
                    </Badge>
                  </div>
                  {inCart > 0 && (
                    <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-rose-900 px-2 py-1 text-[11px] font-semibold text-white">
                      <Check className="h-3 w-3" /> {inCart} no pedido
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-1.5 p-3">
                  <p className="truncate text-[11px] font-medium uppercase tracking-wide text-stone-400">
                    {product.category?.name || "Traje"} {product.color ? `• ${product.color}` : ""}
                  </p>
                  <h4 className="min-h-[2.5rem] line-clamp-2 text-sm font-semibold leading-5 text-stone-900" title={product.name}>
                    {product.name}
                  </h4>
                  <p className="truncate text-xs text-stone-500" title={product.sku || product.id}>
                    Cód. {product.sku || product.id.slice(0, 8)}
                    {product.sizes?.length ? ` · ${product.sizes.join(", ")}` : ""}
                  </p>
                  <div className="mt-auto space-y-2 pt-2">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Aluguel</p>
                      <p className="text-lg font-bold tabular-nums tracking-tight text-rose-900">
                        {money(price)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      disabled={!availableForRental || inCart >= product.quantity}
                      onClick={() => onAdd(product)}
                      className="h-10 w-full rounded-xl bg-rose-900 text-white hover:bg-rose-800"
                      aria-label={`Adicionar ${product.name} ao pedido de aluguel`}
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      {!availableForRental ? "Indisponível" : inCart >= product.quantity ? "Limite atingido" : "Adicionar traje"}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
