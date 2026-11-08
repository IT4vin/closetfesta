import {beforeEach,describe,expect,it,vi} from "vitest";
const {rpc}=vi.hoisted(()=>({rpc:vi.fn()}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{rpc}}));
import {
  getCreditStatement,getCreditUsage,transferHouseCredit,redeemHouseCredit,
  positiveMoney,
} from "@/lib/houseCredits";
const from="11111111-1111-4111-8111-111111111111";
const to="22222222-2222-4222-8222-222222222222";
const contract="33333333-3333-4333-8333-333333333333";
const operation="44444444-4444-4444-8444-444444444444";
describe("Créditos na casa",()=>{
  beforeEach(()=>rpc.mockReset());
  it("consulta saldo e extrato real em páginas",async()=>{
    rpc.mockResolvedValueOnce({data:{
      client_id:from,client_name:"Cliente Teste",balance:249.90,
      total_entries:35,entries:[{delta:249.90,kind:"cancellation_credit",
        source_contract_id:contract,note:"Pedido cancelado"}],
    },error:null});
    const res=await getCreditStatement(from,1);
    expect(res.balance).toBe(249.90);
    expect(res.entries[0].kind).toBe("cancellation_credit");
    expect(rpc).toHaveBeenCalledWith("credit_client_statement",{
      p_client:from,p_limit:30,p_offset:30,
    });
  });
  it("transfere com autorização confirmada e destinatário diferente",async()=>{
    rpc.mockResolvedValueOnce({data:operation,error:null});
    await transferHouseCredit({from,to,amount:100.50,reason:"Solicitação",
      authorizationReference:"Autorização presencial assinada",operationId:operation});
    expect(rpc).toHaveBeenCalledWith("credit_transfer_authorized",{
      p_from:from,p_to:to,p_amount:100.50,p_reason:"Solicitação",
      p_authorization_reference:"Autorização presencial assinada",
      p_confirmed:true,p_operation:operation,
    });
  });
  it("não aceita transferência sem comprovação de autorização ou ao mesmo titular",async()=>{
    await expect(transferHouseCredit({from,to:from,amount:100,
      reason:"Teste",authorizationReference:"Presencial e assinada",operationId:operation}))
      .rejects.toThrow("autorização");
    await expect(transferHouseCredit({from,to,amount:100,
      reason:"Teste",authorizationReference:"curto",operationId:operation}))
      .rejects.toThrow("autorização");
    expect(rpc).not.toHaveBeenCalled();
  });
  it("aplica crédito sem registrar pagamento em dinheiro",async()=>{
    rpc.mockResolvedValueOnce({data:{
      id:"entry1",amount:70.50,remaining:130,already_exists:false,
    },error:null});
    const res=await redeemHouseCredit({
      contractId:contract,amount:70.50,reason:"Crédito anterior",
      operationId:operation,
    });
    expect(res.remaining).toBe(130);
    expect(rpc).toHaveBeenCalledWith("credit_redeem_for_contract",{
      p_contract:contract,p_amount:70.50,
      p_reason:"Crédito anterior",p_operation:operation,
    });
  });
  it("contas do pedido incluem crédito sem confundir com recebimento",async()=>{
    rpc.mockResolvedValueOnce({data:{
      contract_id:contract,client_id:from,status:"confirmed",
      total:300,cash_paid:100,credit_applied:100,remaining:100,
    },error:null});
    const res=await getCreditUsage(contract);
    expect(res.remaining).toBe(100);
    expect(res.credit_applied).toBe(100);
  });
  it("valida centavos sem erro de precisão decimal e não presume sucesso",async()=>{
    expect(positiveMoney(100.10)).toBe(true);
    expect(positiveMoney(100.001)).toBe(false);
    rpc.mockResolvedValueOnce({data:null,error:{message:"Saldo insuficiente"}});
    await expect(getCreditStatement(from)).rejects.toThrow("Saldo insuficiente");
  });
});
