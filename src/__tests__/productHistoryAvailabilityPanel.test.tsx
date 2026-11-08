// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const {rpc}=vi.hoisted(()=>({rpc:vi.fn()}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{rpc}}));

import ProductHistoryAvailabilityPanel from "@/components/products/ProductHistoryAvailabilityPanel";

const productId="11111111-1111-4111-8111-111111111111";
const sample=(available:boolean)=>({
  product_id:productId,pickup_date:"2026-11-27",return_date:"2026-11-30",
  requested_quantity:1,available,free_units:available?1:0,
  physical_available_units:1,
  conflicts:available?[]:[
    {id:"i5",contract_id:"22222222-2222-4222-8222-222222222222",contract_number:5,
      unit_number:1,pickup_date:"2026-11-27",return_date:"2026-11-30",status:"confirmed"},
    {id:"i8",contract_id:"88888888-8888-4888-8888-888888888888",contract_number:8,
      unit_number:1,pickup_date:"2026-11-27",return_date:"2026-11-30",status:"confirmed"},
  ],history:[],
});

function draw(){
  return render(<MemoryRouter><ProductHistoryAvailabilityPanel productId={productId}/></MemoryRouter>);
}

function chooseDates(){
  fireEvent.change(screen.getByLabelText("Data da prova (opcional)"),{target:{value:"2026-11-23"}});
  fireEvent.change(screen.getByLabelText("Retirada"),{target:{value:"2026-11-27"}});
  fireEvent.change(screen.getByLabelText("Evento"),{target:{value:"2026-11-29"}});
  fireEvent.change(screen.getByLabelText("Devolução"),{target:{value:"2026-11-30"}});
}
beforeEach(()=>rpc.mockReset());
afterEach(()=>cleanup());

describe("consulta de datas dentro do histórico de produto",()=>{
  it("consulta a mesma RPC do PDV e lista todos os contratos coincidentes",async()=>{
    rpc.mockResolvedValueOnce({data:sample(false),error:null});
    draw();
    chooseDates();
    fireEvent.click(screen.getByRole("button",{name:"Consultar disponibilidade"}));
    expect(await screen.findByText("Produto indisponível no período consultado")).toBeTruthy();
    expect(screen.getByText("Reservas coincidentes (2)")).toBeTruthy();
    expect(screen.getByText("Contrato ALU-000005")).toBeTruthy();
    expect(screen.getByText("Contrato ALU-000008")).toBeTruthy();
    expect(rpc).toHaveBeenCalledWith("rental_check_product_availability",{
      p_product_id:productId,p_pickup:"2026-11-27",p_return:"2026-11-30",p_quantity:1,
    });
  });

  it("informa quando há unidade livre e esclarece que a prova não reserva agenda",async()=>{
    rpc.mockResolvedValueOnce({data:sample(true),error:null});
    draw();
    expect(screen.getByText(/não confirma vaga na agenda de provas/)).toBeTruthy();
    chooseDates();
    fireEvent.click(screen.getByRole("button",{name:"Consultar disponibilidade"}));
    expect(await screen.findByText("Produto disponível no período consultado")).toBeTruthy();
    expect(screen.getByText(/1 exemplar\(es\) livre\(s\)/)).toBeTruthy();
  });

  it("não consulta com datas incoerentes",async()=>{
    draw();chooseDates();
    fireEvent.change(screen.getByLabelText("Devolução"),{target:{value:"2026-11-28"}});
    fireEvent.click(screen.getByRole("button",{name:"Consultar disponibilidade"}));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText(/Informe retirada, evento e devolução em ordem cronológica/)).toBeTruthy();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("invalida resposta antiga quando a data é alterada durante a consulta",async()=>{
    let finish!: (value:unknown)=>void;
    rpc.mockReturnValueOnce(new Promise(resolve=>{finish=resolve;}));
    draw();chooseDates();
    fireEvent.click(screen.getByRole("button",{name:"Consultar disponibilidade"}));
    expect(screen.getByText(/Conferindo o estoque/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Devolução"),{target:{value:"2026-12-01"}});
    finish({data:sample(false),error:null});
    await waitFor(()=>expect(screen.queryByText(/Conferindo o estoque/)).toBeNull());
    expect(screen.queryByText("Produto indisponível no período consultado")).toBeNull();
    expect(screen.queryByText("Reservas coincidentes (2)")).toBeNull();
  });

  it("exibe erro da RPC sem declarar o produto disponível",async()=>{
    rpc.mockResolvedValueOnce({data:null,error:{message:"Consulta indisponível"}});
    draw();chooseDates();
    fireEvent.click(screen.getByRole("button",{name:"Consultar disponibilidade"}));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText("Consulta indisponível")).toBeTruthy();
    expect(screen.queryByText("Produto disponível no período consultado")).toBeNull();
  });
});
