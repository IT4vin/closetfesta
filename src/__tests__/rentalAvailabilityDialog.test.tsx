// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import RentalAvailabilityDialog from "@/components/pdv/RentalAvailabilityDialog";
import type { ProductCartAvailability } from "@/lib/cartAvailability";
import type { CartItem, OrderDates } from "@/components/pdv/PDVSale";

const dates: OrderDates = {
 tryOnDate: "2026-12-02", pickupDate: "2026-12-05",
 eventDate: "2026-12-06", returnDate: "2026-12-07",
};
const item = {
 id: "11111111-1111-4111-8111-111111111111", name: "Vestido Marsala",
 sku: "VES-001", quantity: 1, price: 300, discount: 0,
 itemType: "rental", subtotal: 300,
} as CartItem;
const historyRow = {
 id: "record-1",contract_id:"22222222-2222-4222-8222-222222222222",
 contract_number:1234,contract_status:"confirmed",unit_number:1,
 try_on_date:"2026-12-01",pickup_date:"2026-12-05",
 event_date:"2026-12-06",return_date:"2026-12-08",
 actual_return_at:null,status:"confirmed",override:false,
};
const availability: ProductCartAvailability = {
 product_id:item.id,pickup_date:dates.pickupDate,return_date:dates.returnDate,
 requested_quantity:1,free_units:0,physical_available_units:1,
 available:false,history:[historyRow],conflicts:[historyRow],
};

function draw(manager:boolean,changed:(id:string,reason:string)=>void,removed:(id:string)=>void){
 return render(<MemoryRouter><RentalAvailabilityDialog
   item={item} dates={dates} availability={availability}
   open={true} canOverride={manager} onClose={()=>{}}
   onRemove={removed} onOverride={changed}
 /></MemoryRouter>);
}
afterEach(()=>cleanup());
describe("aviso antecipado de datas no carrinho",()=>{
 it("mostra histórico completo e duas ações com visual marsala",()=>{
   draw(true,vi.fn(),vi.fn());
   expect(screen.getByText(/Produto indisponível para as datas escolhidas/)).toBeTruthy();
   expect(screen.getByText(/Histórico completo de locações \(1\)/)).toBeTruthy();
   expect(screen.getAllByText(/Contrato nº 1234/).length).toBeGreaterThan(0);
   expect(screen.getByRole("button",{name:/Remover produto/i})).toBeTruthy();
   expect(screen.getByRole("button",{name:/Desbloquear produto e continuar mesmo assim/i})).toBeTruthy();
 });
 it("restringe o desbloqueio a gerente ou administrador",()=>{
   draw(false,vi.fn(),vi.fn());
   expect((screen.getByRole("button",{name:/Desbloquear produto/i}) as HTMLButtonElement).disabled).toBe(true);
   expect(screen.getByText(/Somente gerente ou administrador/)).toBeTruthy();
 });
 it("exige justificativa para desbloquear e permite remover o produto",()=>{
   const approve=vi.fn(),remove=vi.fn();
   draw(true,approve,remove);
   const unlock=screen.getByRole("button",{name:/Desbloquear produto/i}) as HTMLButtonElement;
   expect(unlock.disabled).toBe(true);
   fireEvent.change(screen.getByLabelText(/Justificativa da gerência/),{
     target:{value:"Confirmado com gerência; será separado exemplar adequado."}
   });
   expect(unlock.disabled).toBe(false);
   fireEvent.click(unlock);
   expect(approve).toHaveBeenCalledWith(item.id,"Confirmado com gerência; será separado exemplar adequado.");
   fireEvent.click(screen.getByRole("button",{name:/Remover produto/i}));
   expect(remove).toHaveBeenCalledWith(item.id);
 });
});
