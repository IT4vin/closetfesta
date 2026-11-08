// @vitest-environment jsdom
import React from "react";
import { afterEach,beforeEach,describe,expect,it,vi } from "vitest";
import { cleanup,fireEvent,render,screen,waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient,QueryClientProvider } from "@tanstack/react-query";
const {rpc}=vi.hoisted(()=>({rpc:vi.fn()}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{rpc}}));
vi.mock("@/lib/permissions",()=>({default:{hasPermission:vi.fn(()=>true)}}));

import DashboardVisitConfirmationDialog from "@/components/dashboard/DashboardVisitConfirmationDialog";

const row={
 contract_id:"11111111-1111-4111-8111-111111111111",contract_number:8,
 client_name:"Cliente de Teste",kind:"prova",day:"2026-11-08",
 time:"14:30",items_total:2,confirmed:false,confirmed_at:null,
 confirmed_by:null,physical_complete:false,
};
const list=(changes={})=>({
 period:"today",kind:"prova",today:"2026-11-08",counts:{prova:{total:1,confirmed:0,pending:1}},
 rows:[{...row,...changes}],total:1,offset:0,limit:30,
});
function draw(kind:"prova"|"retirada"|"devolucao"="prova"){
 const client=new QueryClient({defaultOptions:{queries:{retry:false,refetchOnWindowFocus:false}}});
 return render(<QueryClientProvider client={client}>
  <MemoryRouter>
   <DashboardVisitConfirmationDialog selected={{kind,period:"today"}} onClose={vi.fn()}/>
  </MemoryRouter>
 </QueryClientProvider>);
}
beforeEach(()=>{rpc.mockReset();vi.spyOn(window,"confirm").mockReturnValue(true);});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
describe("confirmação dos compromissos na dashboard",()=>{
 it("abre lista real com cliente, pedido, dia e hora, e confirma presença com auditoria",async()=>{
  rpc.mockImplementation(async (name:string)=>{
   if(name==="closet_dashboard_visits")return {data:list(),error:null};
   if(name==="closet_confirm_visit_attendance")return {
     data:{confirmed:1,new_confirmations:1},error:null,
   };
   throw new Error("RPC desconhecida: "+name);
  });
  draw();
  expect(await screen.findByText("Cliente de Teste")).toBeTruthy();
  expect(screen.getByText("Pedido ALU-000008")).toBeTruthy();
  expect(screen.getByText("14:30")).toBeTruthy();
  expect(screen.getByText("2 traje(s) vinculado(s)")).toBeTruthy();
  fireEvent.click(screen.getByRole("checkbox",{name:"Selecionar pedido 8"}));
  fireEvent.click(screen.getByRole("button",{name:/Confirmar comparecimento \(1\)/}));
  await waitFor(()=>expect(rpc).toHaveBeenCalledWith("closet_confirm_visit_attendance",{
   p_contract_ids:[row.contract_id],p_kind:"prova",p_day:"2026-11-08",
  }));
 });
 it("não permite confirmar datas futuras",async()=>{
  rpc.mockResolvedValue({data:list({day:"2026-11-12"}),error:null});
  draw();
  expect(await screen.findByText("Cliente de Teste")).toBeTruthy();
  expect((screen.getByRole("checkbox",{name:"Selecionar pedido 8"}) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole("button",{name:/Confirmar comparecimento \(0\)/}) as HTMLButtonElement).disabled).toBe(true);
 });
 it("não confunde confirmação da retirada com a movimentação de estoque",async()=>{
  rpc.mockResolvedValue({data:{...list(),kind:"retirada",rows:[{...row,kind:"retirada"}]},error:null});
  draw("retirada");
  expect(await screen.findByText("Cliente de Teste")).toBeTruthy();
  expect(screen.getByText(/não registra a entrega/)).toBeTruthy();
 });
});
