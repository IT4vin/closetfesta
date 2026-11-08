import {beforeEach,describe,expect,it,vi} from "vitest";
const {from}=vi.hoisted(()=>({from:vi.fn()}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{from}}));
import {blankClientRegistration,clientInsertPayload,createRegisteredClient,
  validateClientRegistration} from "@/lib/clientRegistration";
describe("cadastro completo compartilhado de cliente",()=>{
  beforeEach(()=>from.mockReset());
  it("mantém endereço, origem, telefone alternativo e medidas no payload",()=>{
    const form={...blankClientRegistration(),full_name:"Ana Oliveira",phone:"(21) 99999-9999",
      secondary_phone:"(21) 3333-4444",document:"123.456.789-09",birth_date:"2000-05-10",
      acquisition_source:"Instagram",cep:"23000-000",street:"Estrada do Mendanha",
      number:"555",city:"Rio de Janeiro",state:"rj",bust:"90",waist:"72",height:"1,65",
    };
    const payload=clientInsertPayload({...form,height:"165"});
    expect(payload).toMatchObject({
      full_name:"Ana Oliveira",phone:"21999999999",secondary_phone:"2133334444",
      document:"12345678909",birth_date:"2000-05-10",acquisition_source:"Instagram",
      address:{cep:"23000000",street:"Estrada do Mendanha",number:"555",
        city:"Rio de Janeiro",state:"RJ"},
      measurements:{bust:90,waist:72,height:165},
    });
    expect(validateClientRegistration({...form,height:"165"})).toBeNull();
  });
  it("rejeita telefone, nascimento, documento e medidas inválidas",()=>{
    const basic={...blankClientRegistration(),full_name:"Ana Oliveira"};
    expect(validateClientRegistration({...basic,document:"123"})).toMatch(/CPF/);
    expect(validateClientRegistration({...basic,phone:"123"})).toMatch(/telefone/);
    expect(validateClientRegistration({...basic,birth_date:"2050-01-01"})).toMatch(/nascimento/);
    expect(validateClientRegistration({...basic,bust:"500"})).toMatch(/Medida/);
    expect(validateClientRegistration({...basic,cep:"123"})).toMatch(/CEP/);
  });
  it("salva no Supabase sem descartar campos",async()=>{
    const selectInsert=vi.fn(()=>({single:vi.fn(async()=>({
      data:{id:"id1",full_name:"Ana Oliveira",document:null,phone:null},
      error:null,
    }))}));
    const insert=vi.fn(()=>({select:selectInsert}));
    from.mockReturnValue({insert});
    const result=await createRegisteredClient({...blankClientRegistration(),full_name:"Ana Oliveira",
      secondary_phone:"2133334444",height:"165"});
    expect(result.name).toBe("Ana Oliveira");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      secondary_phone:"2133334444",measurements:{height:165},
    }));
  });
  it("não cria CPF/CNPJ duplicado",async()=>{
    const maybeSelect=vi.fn(async()=>({data:[{id:"exists",document:"12345678909"}],error:null}));
    from.mockReturnValue({select:()=>({eq:()=>({limit:maybeSelect})})});
    await expect(createRegisteredClient({...blankClientRegistration(),
      full_name:"Ana Oliveira",document:"12345678909"})).rejects.toThrow("Já existe");
  });
});