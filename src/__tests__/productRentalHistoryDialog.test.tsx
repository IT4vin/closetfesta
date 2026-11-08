// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));

import ProductRentalHistoryDialog from "@/components/products/ProductRentalHistoryDialog";
import ProductCard from "@/components/products/ProductCard";
import ProductTable from "@/components/products/ProductTable";

const product = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Vestido Longo Marsala",
  sku: "010001",
  image: "",status:"available",type:"Festa",size:"M",color:"marsala",
  rentalPrice:960,quantity:1,created_at:"2026-11-08",
};

const cancelled = {
  id:"item-1",contract_id:"22222222-2222-4222-8222-222222222222",
  contract_number:5,contract_status:"cancelled",customer_name:"Juliana Macedo",
  unit_number:1,try_on_date:"2026-11-23",pickup_date:"2026-11-27",
  event_date:"2026-11-29",return_date:"2026-11-30",
  actual_return_at:null,picked_up_at:null,status:"cancelled",
  unit_price:960,discount:0,conflict_override:false,
};
const makeData = (offset:number) => ({
  product_id:product.id,total_count:26,contract_count:26,cancelled_count:1,
  total_historical_value:2720,total_valid_value:1760,total_out_value:0,
  items:[{...cancelled,id:"item-"+offset}]
});
function renderHistory(){
  const client=new QueryClient({defaultOptions:{queries:{retry:false,refetchOnWindowFocus:false}}});
  return render(<QueryClientProvider client={client}>
    <MemoryRouter><ProductRentalHistoryDialog product={product} onClose={vi.fn()} /></MemoryRouter>
  </QueryClientProvider>);
}
beforeEach(()=>rpc.mockReset());
afterEach(()=>cleanup());
describe("histórico do produto via relógio",()=>{
  it("apresenta cliente, pedido, período, valor e cancelamento na janela",async()=>{
    rpc.mockResolvedValue({data:makeData(0),error:null});
    renderHistory();
    expect(await screen.findByText("Juliana Macedo")).toBeTruthy();
    expect(screen.getByText("Histórico do produto 010001")).toBeTruthy();
    expect(screen.getByText("ALU-000005")).toBeTruthy();
    expect(screen.getAllByText(/27\/11\/2026/).length).toBeGreaterThan(0);
    expect(screen.getByText("Cancelado")).toBeTruthy();
    expect(screen.getByText("Exibindo 1–25 de 26")).toBeTruthy();
  });
  it("permite continuar navegando pelo histórico completo",async()=>{
    rpc.mockImplementation(async (_name:string,args:{p_offset:number})=>({
      data:makeData(args.p_offset),error:null
    }));
    renderHistory();
    expect(await screen.findByText("Juliana Macedo")).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:/Próxima/}));
    await waitFor(()=>expect(rpc).toHaveBeenCalledWith("rental_product_full_history",{
      p_product_id:product.id,p_limit:25,p_offset:25
    }));
    expect(await screen.findByText("Exibindo 26–26 de 26")).toBeTruthy();
  });
  it("inclui relógio clicável nas visualizações de cartão e lista",()=>{
    const onHistory=vi.fn();
    const {unmount}=render(<MemoryRouter>
      <ProductCard product={product} onEdit={vi.fn()} onHistory={onHistory}/>
    </MemoryRouter>);
    fireEvent.click(screen.getByRole("button",{name:/Histórico de locações de Vestido Longo Marsala/}));
    expect(onHistory).toHaveBeenCalledTimes(1);
    unmount();
    render(<MemoryRouter>
      <ProductTable products={[product]} onEdit={vi.fn()} onHistory={onHistory}/>
    </MemoryRouter>);
    fireEvent.click(screen.getByRole("button",{name:/Histórico de locações de Vestido Longo Marsala/}));
    expect(onHistory).toHaveBeenCalledTimes(2);
  });
});
