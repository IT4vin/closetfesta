import type { OrderDetail } from "@/lib/rentalOrderDetails";
import { supabase } from "@/integrations/supabase/client";
import type { ClosetSettingValues } from "@/lib/closetSettings";
import { paymentTotals, readableAddress } from "@/lib/rentalOrderDetails";

export function escapeContractHtml(input:unknown):string {
  return String(input??"").replace(/[&<>"']/g, c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  } as Record<string,string>)[c]??c);
}
const money=(n:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n);
const date=(s?:string|null)=>{
  if(!s)return "Não agendada";
  const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m?m[3]+"/"+m[2]+"/"+m[1]:"Não informado";
};
export interface ContractPrintOptions { company?: ClosetSettingValues; documents?: ClosetSettingValues }
export function rentalContractHtml(detail:OrderDetail,options:ContractPrintOptions={}):string {
  const {order,customer}=detail;
  const payments=detail.payments?paymentTotals(Number(order.total),detail.payments):null;
  const E=escapeContractHtml;
  const companyName=String(options.company?.trading_name||"Closet Festa");
  const legalName=String(options.company?.legal_name||"");
  const cnpj=String(options.company?.cnpj||"");
  const address=[options.company?.street,options.company?.number,options.company?.complement,
    options.company?.neighborhood,options.company?.city,options.company?.state].filter(Boolean).join(", ")||
    "Estrada do Mendanha, 555, West Shopping, 2º piso, Campo Grande, Rio de Janeiro/RJ";
  const title=String(options.documents?.contract_title||"MINUTA DE CONTRATO DE LOCAÇÃO DE TRAJES");
  const footer=String(options.documents?.contract_footer||"");
  const rows=order.items.filter(i=>detail.itemProgress.find(p=>p.id===i.id)?.status!=="cancelled")
    .map((item,index)=>[
      "<tr><td>",String(index+1),". ",E(item.product?.name??"Traje"),
      "<small>Código: ",E(item.product?.sku??"não informado"),"</small></td>",
      "<td>Prova: ",E(date(item.try_on_date)),"<small>Retirada: ",E(date(item.pickup_date)),
      "<br>Evento: ",E(date(item.event_date)),"<br>Devolução: ",E(date(item.return_date)),"</small></td>",
      "<td>",E(money(Number(item.unit_price))),"</td><td>",E(money(Number(item.discount))),"</td></tr>"
    ].join("")).join("");
  const today=new Date().toLocaleDateString("pt-BR",{timeZone:"America/Sao_Paulo"});
  const parts=[
    "<!doctype html><html lang='pt-BR'><head><meta charset='UTF-8'><title>Contrato ",
    E(order.order_number)," · ",E(companyName),"</title>",
    "<style>*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#252024;font-size:12px;line-height:1.45;max-width:850px;margin:auto;padding:24px}",
    "h1{font-size:23px;color:#793045;margin-bottom:4px}h2{font-size:14px;border-bottom:1px solid #ddd;margin:18px 0 8px;padding-bottom:6px}",
    ".head{border-bottom:3px solid #793045;margin-bottom:15px;padding-bottom:14px}.hint{color:#555}",
    ".notice{background:#fff6e7;border:1px solid #e5d6c0;padding:11px;margin:12px 0}",
    ".grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}p{margin:6px 0}",
    "table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;text-align:left;padding:8px;vertical-align:top}",
    "th{background:#f6f0f2}small{display:block;color:#666;margin-top:4px}.sign{display:grid;grid-template-columns:1fr 1fr;gap:55px;margin-top:55px}",
    ".sign div{text-align:center;border-top:1px solid #222;padding-top:7px}",
    "li{margin:7px 0}button{padding:11px 18px;background:#793045;color:#fff;border:0;border-radius:6px;cursor:pointer}",
    "@media print{.no-print{display:none}body{max-width:none;padding:0}@page{size:A4;margin:15mm}}</style></head><body>",
    "<div class='no-print'><button onclick='window.print()'>Imprimir / salvar em PDF</button></div>",
    "<header class='head'><h1>",E(companyName),"</h1><p class='hint'>",E(address),"</p>",
    "<h2>",E(title),"</h2><p>Pedido nº ",E(order.order_number),
    " · Data de emissão: ",E(today),"</p></header>",
    "<div class='notice'>Minuta gerada a partir dos dados atuais da locação. Antes da assinatura, conferir os dados fiscais da locadora, regras comerciais e condições negociadas. Não substitui contrato previamente assinado.</div>",
    "<section><h2>1. Identificação das partes</h2><div class='grid'><div><strong>LOCADORA</strong>",
    "<p>Nome fantasia: ",E(companyName),"</p><p>Razão social/CNPJ: ",
    E(legalName&&cnpj?legalName+" — "+cnpj:legalName||cnpj||"__________________________"),"</p>",
    "<p>Endereço: ",E(address),"</p>",
    "</div><div><strong>LOCATÁRIO(A)</strong><p>Nome: ",E(customer.full_name),"</p>",
    "<p>CPF/CNPJ: ",E(customer.document??"Não informado"),"</p>",
    "<p>Telefone: ",E(customer.phone??"Não informado"),"</p>",
    "<p>E-mail: ",E(customer.email??"Não informado"),"</p>",
    "<p>Endereço: ",E(readableAddress(customer.address)??"Não informado"),"</p></div></div></section>",
    "<section><h2>2. Trajes e datas contratadas</h2><table><thead><tr><th>Traje</th><th>Datas</th><th>Preço</th><th>Desconto</th></tr></thead><tbody>",
    rows,"</tbody></table></section>",
    "<section><h2>3. Valores da locação</h2><p>Subtotal: ",E(money(Number(order.subtotal))),"</p>",
    "<p>Descontos: ",E(money(Number(order.total_discount))),"</p>",
    "<p><strong>Total contratado: ",E(money(Number(order.total))),"</strong></p>",
    "<p>Pagamentos, saldos e estornos são consultados separadamente no histórico financeiro e recibos da locação.</p>",
    "<p class='hint'>Registros internos de pagamento não substituem comprovantes bancários.</p></section>",
    "<section><h2>4. Condições para assinatura e conferência</h2><ol>",
    "<li>O(a) locatário(a) conferirá os trajes, acessórios e ajustes no ato da retirada, observando as datas acertadas.</li>",
    "<li>Os trajes e acessórios devem ser conservados e devolvidos na data contratada.</li>",
    "<li>Eventuais multas, danos, perdas, sinais e regras de cancelamento seguem as condições contratuais aprovadas e assinadas pelas partes e a legislação aplicável. Esta minuta não estabelece percentuais de multas.</li>",
    "<li>Trocas de produtos, datas, preços ou descontos posteriores devem constar na versão atualizada e ser comunicadas às partes.</li>",
    "</ol></section>",
    "<section><h2>5. Observações</h2><p>",E(order.observations?.trim()||"Sem observações."),"</p></section>",
    "<p>Rio de Janeiro, ",E(today),"</p>",
    footer?"<section><h2>Informações adicionais</h2><p>"+E(footer)+"</p></section>":"",
    "<div class='sign'><div>LOCADORA — ",E(companyName),"</div><div>LOCATÁRIO(A) — ",
    E(customer.full_name),"</div></div></body></html>"
  ];
  return parts.join("");
}
/**
 * A impressão abre a janela no clique, mas só exibe o documento após
 * o Supabase confirmar que a versão foi arquivada. Reimpressões preservam
 * os dados e o texto exatos da emissão anterior.
 */
export async function printRentalContract(
  detail:OrderDetail, options:{newRevision?:boolean}={},
):Promise<void> {
  const tab=window.open("","_blank");
  if(!tab)throw new Error("A impressão foi bloqueada. Autorize pop-ups para este sistema.");
  const show=(html:string)=>{
    tab.document.open();tab.document.write(html);tab.document.close();tab.focus();
  };
  show("<html lang='pt-BR'><body><p>Consultando versão do contrato no Supabase...</p></body></html>");
  try {
    const db=supabase as any;
    const {data:versions,error:fetchError}=await db.from("rental_document_snapshots")
      .select("revision,payload").eq("contract_id",detail.order.id)
      .order("revision",{ascending:false}).limit(1);
    if(fetchError)throw new Error("Não foi possível consultar o histórico dos contratos: "+fetchError.message);
    const latest=versions?.[0];
    let saved=latest?.payload;
    if(!saved || options.newRevision===true){
      const {data:session,error:authError}=await supabase.auth.getUser();
      if(authError||!session.user)throw new Error("Sessão expirada. Entre novamente.");
      // O banco reconstrói o documento com preços, cliente e cláusulas oficiais.
      // Não arquivar objetos de pagamento, observações internas nem dados fornecidos pelo navegador.
      const payload={};
      const {data:inserted,error:writeError}=await db.from("rental_document_snapshots")
        .insert({contract_id:detail.order.id,revision:(latest?.revision??0)+1,
          issued_by:session.user.id,payload})
        .select("payload").single();
      if(writeError||!inserted)throw new Error("Não foi possível arquivar esta versão: "+(writeError?.message??"gravação não confirmada"));
      saved=inserted.payload;
    }
    if(!saved?.detail?.order||!saved?.detail?.customer)throw new Error("Versão de documento incompleta.");
    show(rentalContractHtml(saved.detail,{company:saved.company,documents:saved.documents}));
  }catch(cause){
    const error=cause instanceof Error?cause.message:"Falha desconhecida.";
    show("<html lang='pt-BR'><body><h2>Documento não emitido</h2><p>"+
      escapeContractHtml(error)+"</p><p>Não foi criado um novo contrato imprimível.</p></body></html>");
    throw cause;
  }
}
