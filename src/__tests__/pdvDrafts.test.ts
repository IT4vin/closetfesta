import {beforeEach,describe,expect,it,vi} from "vitest";
const {getUser,from,rows,behavior}=vi.hoisted(()=>{
  const rows:{payload:any|null}={payload:null};
  const behavior:{error:any|null}={error:null};
  const getUser=vi.fn(async()=>({data:{user:{id:"22222222-2222-4222-8222-222222222222"}},error:null}));
  const from=vi.fn((_table:string)=>{
    const chain:any={
      upsert:vi.fn((row:any)=>{rows.payload=row.payload;return chain;}),
      delete:vi.fn(()=>{rows.payload=null;return chain;}),
      select:vi.fn(()=>chain),
      eq:vi.fn(()=>chain),
      maybeSingle:vi.fn(async()=>({data:rows.payload?{payload:rows.payload,updated_at:"2026-11-07T20:00:00Z"}:null,error:behavior.error})),
      single:vi.fn(async()=>({data:behavior.error?null:{id:"draft-1"},error:behavior.error})),
      then:(resolve:any,reject:any)=>Promise.resolve({error:behavior.error}).then(resolve,reject),
    };
    return chain;
  });
  return {getUser,from,rows,behavior};
});
vi.mock("@/integrations/supabase/client",()=>({supabase:{auth:{getUser},from}}));
import {validDraftPayload,savePDVDraft,loadPDVDraft,deletePDVDraft,type PDVDraftPayload} from "@/lib/pdvDrafts";
const example:PDVDraftPayload={
  version:1,
  items:[{product_id:"11111111-1111-4111-8111-111111111111",quantity:1,discount:0}],
  customer_id:null,
  dates:{tryOnDate:"2026-12-01",pickupDate:"2026-12-03",eventDate:"2026-12-04",returnDate:"2026-12-05"},
  observations:"Cliente prefere bainha simples",
  global_discount:0,global_discount_type:"percentage",
};
describe("Rascunhos do PDV no Supabase",()=>{
  beforeEach(()=>{from.mockClear();rows.payload=null;behavior.error=null;getUser.mockClear();});
  it("valida quantidade, identificador e datas antes de persistir",()=>{
    expect(validDraftPayload(example)).toBe(true);
    expect(validDraftPayload({...example,items:[{...example.items[0],quantity:0}]})).toBe(false);
    expect(validDraftPayload({...example,items:[{...example.items[0],product_id:"fake"}]})).toBe(false);
    expect(validDraftPayload({...example,dates:{...example.dates,pickupDate:"amanha"}})).toBe(false);
  });
  it("salva e recupera o rascunho real do operador autenticado",async()=>{
    await savePDVDraft(example);
    expect(from).toHaveBeenCalledWith("pdv_drafts");
    expect(getUser).toHaveBeenCalled();
    await expect(loadPDVDraft()).resolves.toMatchObject({payload:example});
  });
  it("não confirma sucesso quando a gravação no banco falha",async()=>{
    behavior.error={message:"Permission denied"};
    await expect(savePDVDraft(example)).rejects.toThrow("Permission denied");
  });
  it("recusa dados de uma versão de rascunho incompatível",async()=>{
    rows.payload={...example,version:99};
    await expect(loadPDVDraft()).rejects.toThrow("incompatível");
  });
  it("descarta o rascunho com consulta direcionada ao operador",async()=>{
    await savePDVDraft(example);
    await deletePDVDraft();
    await expect(loadPDVDraft()).resolves.toBeNull();
  });
});
