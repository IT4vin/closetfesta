import type { Product } from "@/lib/api";

/** Filtros usados pela tela de produtos. Nenhuma alteração é feita no banco. */
export interface ProductFilters {
  type: string;
  status: string;
  size: string;
  color: string;
  priceRange: {
    min: string;
    max: string;
  };
}

export const EMPTY_PRODUCT_FILTERS: ProductFilters = {
  type: "",
  status: "",
  size: "",
  color: "",
  priceRange: { min: "", max: "" },
};

export const normalizeProductFilterValue = (value: unknown): string =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");

/** Usa o tipo cadastrado no PDV; a categoria vinculada é usada como fallback. */
export function productCategoryName(product: Product): string {
  return String(product.type || product.category?.name || "").trim();
}

function uniqueOptions(values: readonly (string | null | undefined)[]): string[] {
  const unique = new Map<string, string>();
  for (const value of values) {
    const display = String(value ?? "").trim();
    const key = normalizeProductFilterValue(display);
    if (key && !unique.has(key)) unique.set(key, display);
  }
  return Array.from(unique.values())
    .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" }));
}

export function getProductFilterOptions(products: readonly Product[]) {
  return {
    categories: uniqueOptions(products.map(productCategoryName)),
    colors: uniqueOptions(products.map(product => product.color)),
    sizes: uniqueOptions(products.flatMap(product => product.sizes || (product.size ? [product.size] : []))),
  };
}

export function hasProductFilters(filters: ProductFilters, searchTerm = ""): boolean {
  return Boolean(
    normalizeProductFilterValue(searchTerm) ||
    filters.type || filters.status || filters.size || filters.color ||
    filters.priceRange.min.trim() || filters.priceRange.max.trim(),
  );
}

function parsePrice(value: string): number | null {
  const normalized = value.trim().replace(/R\$|\s/gi, "");
  if (!normalized) return null;
  const decimal = normalized.includes(",")
    ? normalized.replace(/\./g, "").replace(",", ".")
    : normalized;
  const numeric = Number(decimal);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
}

/** Combina categoria, status, tamanho, cor, preço e busca textual. */
export function applyProductFilters(
  products: readonly Product[],
  filters: ProductFilters,
  searchTerm: string,
): Product[] {
  const query = normalizeProductFilterValue(searchTerm);
  const category = normalizeProductFilterValue(filters.type);
  const status = normalizeProductFilterValue(filters.status);
  const size = normalizeProductFilterValue(filters.size);
  const color = normalizeProductFilterValue(filters.color);
  const minPrice = parsePrice(filters.priceRange.min);
  const maxPrice = parsePrice(filters.priceRange.max);

  return products.filter(product => {
    if (category && normalizeProductFilterValue(productCategoryName(product)) !== category) return false;
    if (status && normalizeProductFilterValue(product.status) !== status) return false;
    const sizes = product.sizes?.length ? product.sizes : (product.size ? [product.size] : []);
    if (size && !sizes.some(item => normalizeProductFilterValue(item) === size)) return false;
    if (color && normalizeProductFilterValue(product.color) !== color) return false;

    const price = Number(product.rental_price ?? product.rentalPrice ?? product.price);
    if (minPrice !== null && !(price >= minPrice)) return false;
    if (maxPrice !== null && !(price <= maxPrice)) return false;

    if (query) {
      const searchable = [
        product.name, product.description, product.sku, product.barcode, product.id,
        productCategoryName(product), product.category?.name, product.color, ...sizes,
      ].some(item => normalizeProductFilterValue(item).includes(query));
      if (!searchable) return false;
    }
    return true;
  });
}
