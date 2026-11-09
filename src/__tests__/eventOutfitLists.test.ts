import {beforeEach,describe,expect,it,vi} from "vitest";

const {rpc,from,productsFindAll}=vi.hoisted(()=>({
 rpc:vi.fn(),from:vi.fn(),productsFindAll:vi.fn(),
}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{rpc,from}}));
vi.mock("@/lib/api",()=>({productsApi:{findAll:productsFindAll}}));
import {outfitListApi} from "@/lib/eventOutfitLists";

const listId="11111111-1111-4111-8111-111111111111";
const groupId="22222222-2222-4222-8222-222222222222";
const participantId="33333333-3333-4333-8333-333333333333";
const contractId="44444444-4444-4444-8444-444444444444";
beforeEach(()=>{
 rpc.mockReset();from.mockReset();productsFindAll.mockReset();
});

describe("listagens integradas ao PDV real",()=>{
 it("cria evento com grupos via RPC sem alterar ou excluir pedidos existentes",async()=>{
   rpc.mockResolvedValue({data:listId,error:null});
   const input={
     title:"Casamento teste",organizer_name:"Ana Teste",partner_name:"João Teste",
     event_kind:"casamento",event_date:"2026-12-12",venue:"Espaço de festa",
     phone:"21999999999",notes:"",
     groups:[{role:"Madrinhas",target_count:5,garment_color:"Marsala",
       accessory_color:"Dourado",garment_notes:"Vestido longo",
       accessory_notes:"Bolsa dourada",position:0}],
   };
   expect(await outfitListApi.create(input)).toBe(listId);
   expect(rpc).toHaveBeenCalledWith("event_outfit_create_list",{p_data:input});
   expect(from).not.toHaveBeenCalled();
 });
 it("cadastra cliente individual pela função que reutiliza CPF existente",async()=>{
   const details={full_name:"Participante Exemplo",document:"12345678901",phone:"21999999999",
     address:{city:"Rio de Janeiro",state:"RJ"}};
   rpc.mockResolvedValue({data:{id:participantId,client_id:listId,existing_client:true},error:null});
   const result=await outfitListApi.addParticipant(groupId,details);
   expect(result.existing_client).toBe(true);
   expect(rpc).toHaveBeenCalledWith("event_outfit_add_participant",{
     p_group_id:groupId,p_client:details
   });
 });
 it("cria contrato numerado pelo fluxo oficial validado no banco e liga à listagem",async()=>{
   const request={request_id:contractId,items:[{
     product_id:groupId,item_type:"rental",unit_price:259.9,quantity:1,
     event_date:"2026-12-12",pickup_date:"2026-12-11",return_date:"2026-12-14"
   }],total:259.9,total_discount:0,payments:[]};
   rpc.mockResolvedValue({data:{id:contractId,number:4500,total:259.9,already_exists:false},error:null});
   const result=await outfitListApi.createContract(participantId,request);
   expect(result.number).toBe(4500);
   expect(rpc).toHaveBeenCalledWith("event_outfit_create_contract",{
     p_participant_id:participantId,p_request:request,
   });
   expect(from).not.toHaveBeenCalled();
 });
 it("consulta contratos existentes sem mexer nos dados dos pedidos",async()=>{
   rpc.mockResolvedValue({data:{linked:true},error:null});
   await outfitListApi.linkContract(participantId,contractId);
   expect(rpc).toHaveBeenCalledWith("event_outfit_link_contract",{
     p_participant_id:participantId,p_contract_id:contractId,
   });
 });
 it("carrega produtos atuais sem cadastrar quantidades ou produtos fictícios",async()=>{
   productsFindAll.mockResolvedValue({data:[
     {id:"1",deleted:false,name:"Vestido Marsala"},
     {id:"2",deleted:true,name:"Vestido excluído"}
   ]});
   const loaded=await outfitListApi.getCatalogProducts();
   expect(loaded.map(p=>p.id)).toEqual(["1"]);
   expect(productsFindAll).toHaveBeenCalledWith();
   expect(from).not.toHaveBeenCalled();
 });
 it("repassa erros de validação do Supabase e não assume contrato confirmado",async()=>{
   rpc.mockResolvedValue({data:null,error:{message:"Produto não aprovado para esse grupo"}});
   await expect(outfitListApi.createContract(participantId,{items:[]}))
     .rejects.toThrow("Produto não aprovado");
 });
});
