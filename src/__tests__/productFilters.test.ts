import { describe, expect, it } from "vitest";
import type { Product } from "@/lib/api";
import {
  applyProductFilters, EMPTY_PRODUCT_FILTERS, getProductFilterOptions,
  hasProductFilters, normalizeProductFilterValue,
  type ProductFilters,
} from "@/lib/productFilters";

const products: Product[] = [
  {
    id: "01", name: "Vestido longo de festa", description: "Formatura com brilho",
    sku: "V001", barcode: "123", type: "Vestido", category: { name: "Vestidos", description: "" },
    color: "Marsala", sizes: ["40", "42"], size: "40", price: 300, rental_price: 299.9,
    status: "available", quantity: 1,
  } as Product,
  {
    id: "02", name: "Vestido Serenity", description: "", sku: "V002", type: "Vestido",
    color: "Serenity", sizes: [], price: 250, status: "available", quantity: 1,
  } as Product,
  {
    id: "03", name: "Terno Royal", description: "", sku: "T003", type: "Terno",
    color: "Azul Marinho", sizes: ["50"], price: 400, status: "rented", quantity: 1,
  } as Product,
  {
    id: "04", name: "Acessório dourado", description: "", sku: "A004",
    category: { name: "Acessórios", description: "" },
    color: "", sizes: [], price: 190, status: "maintenance", quantity: 1,
  } as Product,
];

const withFilters = (patch: Partial<ProductFilters>): ProductFilters => ({
  ...EMPTY_PRODUCT_FILTERS,
  ...patch,
  priceRange: { ...EMPTY_PRODUCT_FILTERS.priceRange, ...patch.priceRange },
});
const ids = (filtered: Product[]) => filtered.map(product => product.id);

describe("filtros funcionais da aba Produtos", () => {
  it("filtra realmente as categorias e usa categoria vinculada como fallback", () => {
    expect(ids(applyProductFilters(products, withFilters({ type: "Vestido" }), ""))).toEqual(["01", "02"]);
    expect(ids(applyProductFilters(products, withFilters({ type: "Terno" }), ""))).toEqual(["03"]);
    expect(ids(applyProductFilters(products, withFilters({ type: "Acessórios" }), ""))).toEqual(["04"]);
  });

  it("filtra cor sem misturar variações e ignora acentos/maiúsculas", () => {
    expect(ids(applyProductFilters(products, withFilters({ color: "MARSALA" }), ""))).toEqual(["01"]);
    expect(ids(applyProductFilters(products, withFilters({ color: "SERENITY" }), ""))).toEqual(["02"]);
    expect(ids(applyProductFilters(products, withFilters({ color: "azul marinho" }), ""))).toEqual(["03"]);
    expect(normalizeProductFilterValue(" Fúcsia ")).toBe("fucsia");
  });

  it("combina categoria, cor e faixa de aluguel simultaneamente", () => {
    const filters = withFilters({
      type: "Vestido", color: "marsala", priceRange: { min: "200,00", max: "299,90" },
    });
    expect(ids(applyProductFilters(products, filters, ""))).toEqual(["01"]);
    expect(ids(applyProductFilters(products, { ...filters, priceRange: { min: "300", max: "" } }, ""))).toEqual([]);
  });

  it("filtra tamanho e status, inclusive cadastros sem tamanho ou cor", () => {
    expect(ids(applyProductFilters(products, withFilters({ size: "42" }), ""))).toEqual(["01"]);
    expect(ids(applyProductFilters(products, withFilters({ size: "50", status: "rented" }), ""))).toEqual(["03"]);
    expect(ids(applyProductFilters(products, withFilters({ size: "__missing__" }), ""))).toEqual(["02", "04"]);
    expect(ids(applyProductFilters(products, withFilters({ color: "__missing__" }), ""))).toEqual(["04"]);
  });

  it("busca por nome, código, categoria, cor e tamanho sem falhar com descrição vazia", () => {
    expect(ids(applyProductFilters(products, withFilters({}), "V002"))).toEqual(["02"]);
    expect(ids(applyProductFilters(products, withFilters({}), "formatura"))).toEqual(["01"]);
    expect(ids(applyProductFilters(products, withFilters({}), "acessorios"))).toEqual(["04"]);
    expect(ids(applyProductFilters(products, withFilters({}), "serenity"))).toEqual(["02"]);
  });

  it("gera opções apenas a partir do que existe no catálogo e identifica filtros ativos", () => {
    expect(getProductFilterOptions(products)).toEqual({
      categories: ["Acessórios", "Terno", "Vestido"],
      colors: ["Azul Marinho", "Marsala", "Serenity"],
      sizes: ["40", "42", "50"],
    });
    expect(hasProductFilters(withFilters({}), "")).toBe(false);
    expect(hasProductFilters(withFilters({ color: "Marsala" }), "")).toBe(true);
    expect(hasProductFilters(withFilters({}), "vestido")).toBe(true);
  });
});
