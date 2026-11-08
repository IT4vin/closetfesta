// @vitest-environment jsdom
import React from "react";
import {describe,it,expect,vi,afterEach} from "vitest";
import {render,screen,fireEvent,cleanup} from "@testing-library/react";
import type {Product} from "@/lib/api";
vi.mock("@/integrations/supabase/client",()=>({supabase:{rpc:vi.fn()}}));
vi.mock("@/stores/authStore",()=>({
  useAuth:()=>({user:{id:"operator-1",full_name:"Consultora da loja",role:{id:"staff"}}}),
}));
vi.mock("@/components/pdv/PDVProductGallery",()=>({
  default:()=> <div data-testid="catalogo-avancado">Catálogo real</div>,
  PDVProductPhoto:()=> <div data-testid="foto-traje"/>,
  rentalPrice:(p:Product)=>Number(p.rental_price??p.price??0),
  isAvailableForRental:(p:Product)=>p.status==="available"&&p.quantity>0,
}));
import PDVWorkspace, {type PDVWorkspaceProps} from "@/components/pdv/PDVWorkspace";

const product={
  id:"11111111-1111-4111-8111-111111111111",
  name:"Vestido Marsala",sku:"VES-001",barcode:"7891234567890",
  description:"Vestido para festa",quantity:2,price:240,rental_price:200,
  category_id:"cat",images:[],sizes:["M"],status:"available",
  color:"marsala",featured:false,deleted:false,created_at:"",updated_at:"",
} as Product;
function options():PDVWorkspaceProps {
  return {
    products:[product],loading:false,error:null,cart:[],
    dates:{tryOnDate:"",pickupDate:"",eventDate:"",returnDate:""},
    visitTimes:{tryOnTime:"",pickupTime:""},onVisitTimesChange:vi.fn(),
    customer:null,searchValue:"",setSearchValue:vi.fn(),observations:"",
    setObservations:vi.fn(),globalDiscount:0,setGlobalDiscount:vi.fn(),
    globalDiscountType:"percentage",setGlobalDiscountType:vi.fn(),total:0,
    totalDiscount:0,processing:false,
    availability:{},availabilityBusy:false,availabilityError:"",
    overrides:{},onReviewConflict:vi.fn(),
    onDatesChange:vi.fn(),onAdd:vi.fn(),
    onQuantityChange:vi.fn(),onItemDiscount:vi.fn(),onRemove:vi.fn(),
    onCustomer:vi.fn(),onRefresh:vi.fn(),onContinue:vi.fn(),
    onSaveDraft:vi.fn(async()=>{}),onLoadDraft:vi.fn(async()=>{}),
    onClear:vi.fn(),onOrders:vi.fn(),draftBusy:false,hasDraft:false,
  };
}
afterEach(()=>cleanup());
describe("PDV profissional respeitando o tema do sistema",()=>{
  it("mantém o layout do atendimento sem renderizar outro menu",()=>{
    render(<PDVWorkspace {...options()}/>);
    expect(screen.getByRole("heading",{name:"Nova locação"})).toBeTruthy();
    expect(screen.getByRole("heading",{name:"Itens da locação"})).toBeTruthy();
    expect(screen.getByText("Resumo da locação")).toBeTruthy();
    expect(screen.getByText("Consultora da loja")).toBeTruthy();
    expect(screen.getByPlaceholderText("Pesquise por descrição, código (SKU) ou GTIN")).toBeTruthy();
    expect(screen.getByRole("button",{name:/Salvar para depois/i})).toBeTruthy();
    expect(screen.queryByText("Vendedores")).toBeNull();
  });
  it("busca por GTIN e respeita o limite de exemplares",()=>{
    const props=options();props.searchValue="7891234567890";
    render(<PDVWorkspace {...props}/>);
    const input=screen.getByPlaceholderText("Pesquise por descrição, código (SKU) ou GTIN");
    fireEvent.focus(input);
    fireEvent.keyDown(input,{key:"Enter",code:"Enter"});
    expect(props.onAdd).toHaveBeenCalledWith(product,1);
  });
  it("oferece atalhos de cliente e rascunho com ações reais",()=>{
    const props=options();render(<PDVWorkspace {...props}/>);
    fireEvent.keyDown(window,{key:"F8"});
    expect(props.onCustomer).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(window,{key:"F10"});
    expect(props.onSaveDraft).toHaveBeenCalledTimes(1);
  });
});
