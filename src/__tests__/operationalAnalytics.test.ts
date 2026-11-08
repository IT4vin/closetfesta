import { describe, it, expect } from "vitest";
import { addDays, localDay, operationCounts, operationRows, periodResults, payableBalance, receivableBalance, periodStart } from "@/lib/operationalAnalytics";
import type { LiveClosetData, LiveFinanceData } from "@/hooks/useLiveClosetData";

const day="2026-11-07";
const data:LiveClosetData={
  products:[{id:"p1",sku:"V-01",name:"Vestido teste",price:200,category_id:null,
    stock_quantity:1,active:true,deleted_at:null}],
  clients:[{id:"c1",full_name:"Cliente de teste"}],
  units:[{id:"u1",product_id:"p1",unit_number:1,status:"available"}],
  contracts:[{id:"r1",contract_number:1,client_id:"c1",created_by:"staff1",status:"confirmed",
    total:200,created_at:"2026-11-07T13:00:00Z"}],
  appointments:[{id:"a1",client_id:"c1",title:"Prova",description:null,status:"scheduled",
    start_at:"2026-11-08T14:00:00-03:00",end_at:"2026-11-08T15:00:00-03:00"}],
  items:[{id:"i1",contract_id:"r1",product_id:"p1",unit_id:"u1",unit_price:200,discount:0,
    status:"confirmed",try_on_date:"2026-11-08",pickup_date:"2026-11-09",
    event_date:"2026-11-10",return_date:"2026-11-11",actual_return_at:null}],
};
const finance:LiveFinanceData={
  payments:[{id:"pay",contract_id:"r1",amount:100,method:"pix",status:"operator_recorded",
    recorded_at:"2026-11-07T15:00:00Z"}],
  transactions:[{id:"tx",type:"expense",category:"manual",description:"Conta",amount:50,
    paid_at:null,due_date:"2026-11-10",status:"pending",created_at:"2026-11-07T15:00:00Z"}],
  registers:[],movements:[],
};
describe("painel operacional e relatórios sem valores fantasma",()=>{
  it("usa data local correta e semana começando na segunda",()=>{
    expect(localDay("2026-11-07T01:00:00Z")).toBe("2026-11-06");
    expect(periodStart("2026-11-07","week")).toBe("2026-11-02");
    expect(periodStart("2026-11-07","month")).toBe("2026-11-01");
    expect(addDays("2026-11-07",10)).toBe("2026-11-17");
  });
  it("não duplica prova registrada na agenda e no contrato",()=>{
    const rows=operationRows(data);
    expect(rows.filter(x=>x.kind==="prova")).toHaveLength(1);
    expect(operationCounts(rows,"2026-11-08","2026-11-17")).toEqual([
      {kind:"prova",count:1},{kind:"retirada",count:1},{kind:"devolucao",count:1},
    ]);
    expect(operationCounts(rows,"0000-01-01","2026-11-06").every(x=>x.count===0)).toBe(true);
  });
  it("contabiliza pedidos e pagamentos sem misturar as datas",()=>{
    expect(periodResults(data,finance,"day",day)).toEqual({
      totalOrders:200,received:100,orderCount:1,
    });
    expect(receivableBalance(data,finance)).toBe(100);
    expect(payableBalance(finance)).toBe(50);
  });
  it("abate crédito de conta a receber sem contá-lo como recebimento novo",()=>{
    const withCredit={...finance,creditApplications:[{
      source_contract_id:"r1",delta:-40,kind:"redemption",
    }]};
    expect(receivableBalance(data,withCredit)).toBe(60);
    expect(periodResults(data,withCredit,"day",day).received).toBe(100);
  });
  it("não contabiliza contrato cancelado ou pagamento estornado",()=>{
    const changed={...data,contracts:data.contracts.map(c=>({...c,status:"cancelled"}))};
    const reversed={...finance,payments:finance.payments.map(p=>({...p,status:"reversed"}))};
    expect(periodResults(changed,reversed,"day",day)).toEqual({totalOrders:0,received:0,orderCount:0});
    expect(receivableBalance(changed,reversed)).toBe(0);
  });
});
