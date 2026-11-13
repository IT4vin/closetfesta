// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Catalog from "@/components/catalog/Catalog";

const mocks = vi.hoisted(() => ({
  published: true,
  role: "admin",
  setVisibility: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { role: { id: mocks.role } } }),
}));

vi.mock("@/lib/api", () => ({
  categoriesApi: {
    findAll: vi.fn().mockResolvedValue({ success: true, data: [] }),
  },
  productsApi: {
    findAll: vi.fn(async () => ({
      success: true,
      data: [{
        id: "eb3c509c-e75b-48ad-a0e4-605e6519b482",
        name: "Vestido Marsala",
        sku: "V001",
        description: "",
        price: 190,
        rental_price: 190,
        quantity: 1,
        active: true,
        show_in_catalog: mocks.published,
        images: [],
      }],
      total: 1,
    })),
    getCatalogCounts: vi.fn(async () => ({
      total: 1,
      visible: mocks.published ? 1 : 0,
      hidden: mocks.published ? 0 : 1,
    })),
    setCatalogVisibility: mocks.setVisibility,
  },
}));

afterEach(() => cleanup());
beforeEach(() => {
  mocks.published = true;
  mocks.role = "admin";
  mocks.setVisibility.mockReset();
  mocks.setVisibility.mockImplementation(async (id: string, value: boolean) => {
    mocks.published = value;
    return { success: true, data: { id, show_in_catalog: value } };
  });
});

describe("visibilidade de produtos no catálogo público", () => {
  it("administrador pode ocultar um traje sem excluir seu cadastro", async () => {
    render(<Catalog />);
    expect(await screen.findByText("Vestido Marsala")).toBeTruthy();
    const control = screen.getByRole("switch", {
      name: "Mostrar Vestido Marsala no catálogo público",
    });
    expect(control.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(control);
    await waitFor(() => expect(mocks.setVisibility).toHaveBeenCalledWith(
      "eb3c509c-e75b-48ad-a0e4-605e6519b482", false,
    ));
    await waitFor(() => expect(control.getAttribute("aria-checked")).toBe("false"));
    expect(screen.getByText(/mantido no estoque e nos contratos/i)).toBeTruthy();
  });

  it("não permite ao funcionário comum alterar a publicação", async () => {
    mocks.role = "staff";
    render(<Catalog />);
    const control = await screen.findByRole("switch", {
      name: "Mostrar Vestido Marsala no catálogo público",
    });
    expect(control.hasAttribute("disabled")).toBe(true);
    fireEvent.click(control);
    expect(mocks.setVisibility).not.toHaveBeenCalled();
  });
});
