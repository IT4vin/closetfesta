// @vitest-environment jsdom
import React from "react";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import {QueryClient,QueryClientProvider} from "@tanstack/react-query";
const {loadSettings,getCredit}=vi.hoisted(()=>({
  loadSettings:vi.fn(async()=>({})),
  getCredit:vi.fn(),
}));
vi.mock("@/lib/closetSettings",()=>({loadClosetSettings:loadSettings}));
vi.mock("@/lib/houseCredits",()=>({
  getCreditStatement:getCredit,
  moneyCredit:(x:number)=>"R$ "+Number(x).toFixed(2),
}));
vi.mock("@/hooks/use-toast",()=>({useToast:()=>({toast:vi.fn()})}));
import PDVPaymentModal from "@/components/pdv/PDVPaymentModal";
const customer={id:"11111111-1111-4111-8111-111111111111",
 name:"Cliente com crédito",document:"00000000000"};
function setup(total:number,balance:number){
 const onPaymentComplete=vi.fn(async()=>{});
 getCredit.mockResolvedValue({
  client_id:customer.id,client_name:customer.name,balance,
  total_entries:1,entries:[],
 });
 const client=new QueryClient({defaultOptions:{queries:{retry:false,refetchOnWindowFocus:false}}});
 render(<QueryClientProvider client={client}>
  <PDVPaymentModal isOpen onClose={vi.fn()} total={total}
   onPaymentComplete={onPaymentComplete} customer={customer}/>
 </QueryClientProvider>);
 return onPaymentComplete;
}
beforeEach(()=>{loadSettings.mockClear();getCredit.mockReset();});
afterEach(()=>cleanup());
describe("crédito da loja aparece na finalização do PDV",()=>{
 it("oferece o saldo do cliente e permite pagar tudo só com crédito",async()=>{
  const finish=setup(299.90,299.90);
  expect(await screen.findByText("Saldo disponível:")).toBeTruthy();
  expect(screen.getAllByText("R$ 299.90").length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("button",{name:"Usar todo crédito disponível"}));
  expect(screen.getByText(/Sinal coberto pelo crédito na loja/)).toBeTruthy();
  fireEvent.click(screen.getByRole("checkbox",{name:/Confirmo que o cliente autorizou/}));
  fireEvent.click(screen.getByRole("button",{name:/Finalizar locação e registrar pagamento/}));
  await waitFor(()=>expect(finish).toHaveBeenCalledWith(
    expect.objectContaining({store_credit_amount:299.90,payments:[]})
  ));
 });
 it("combina crédito da loja e pagamento Pix para atingir o sinal",async()=>{
  const finish=setup(300,100);
  await screen.findByText("Saldo disponível:");
  fireEvent.click(screen.getByRole("button",{name:"Usar todo crédito disponível"}));
  fireEvent.click(screen.getByRole("checkbox",{name:/Confirmo que conferi os recebimentos/}));
  fireEvent.click(screen.getByRole("button",{name:/Finalizar locação e registrar pagamento/}));
  await waitFor(()=>expect(finish).toHaveBeenCalledWith(
    expect.objectContaining({
      store_credit_amount:100,
      payments:[expect.objectContaining({method:"pix",value:50})],
    })
  ));
 });
});
