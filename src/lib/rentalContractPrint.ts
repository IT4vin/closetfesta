import type { OrderDetail } from "@/lib/rentalOrderDetails";
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
export function rentalContractHtml(detail:OrderDetail):string {
  const {order,customer}=detail;
  const payments=detail.payments?paymentTotals(Number(order.total),detail.payments):null;
  const E=escapeContractHtml;
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
    E(order.order_number)," · Closet Festa</title>",
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
    "<header class='head'><h1>CLOSET FESTA</h1><p class='hint'>West Shopping · Estrada do Mendanha, 555, 2º piso · Campo Grande — RJ</p>",
    "<h2>MINUTA DE CONTRATO DE LOCAÇÃO DE TRAJES</h2><p>Pedido nº ",E(order.order_number),
    " · Data de emissão: ",E(today),"</p></header>",
    "<div class='notice'>Minuta gerada a partir dos dados atuais da locação. Antes da assinatura, conferir os dados fiscais da locadora, regras comerciais e condições negociadas. Não substitui contrato previamente assinado.</div>",
    "<section><h2>1. Identificação das partes</h2><div class='grid'><div><strong>LOCADORA</strong>",
    "<p>Nome fantasia: Closet Festa</p><p>Razão social/CNPJ: __________________________</p>",
    "<p>Endereço: Estrada do Mendanha, 555, West Shopping, 2º piso, Campo Grande, Rio de Janeiro/RJ</p>",
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
    payments?"<p>Recebido no sistema: "+E(money(payments.received))+"</p><p>Saldo registrado: "+E(money(payments.remaining))+"</p>":"<p>Recebimentos: não disponíveis neste perfil.</p>",
    "<p class='hint'>Registros internos de pagamento não substituem comprovantes bancários.</p></section>",
    "<section><h2>4. Condições para assinatura e conferência</h2><ol>",
    "<li>O(a) locatário(a) conferirá os trajes, acessórios e ajustes no ato da retirada, observando as datas acertadas.</li>",
    "<li>Os trajes e acessórios devem ser conservados e devolvidos na data contratada.</li>",
    "<li>Eventuais multas, danos, perdas, sinais e regras de cancelamento seguem as condições contratuais aprovadas e assinadas pelas partes e a legislação aplicável. Esta minuta não estabelece percentuais de multas.</li>",
    "<li>Trocas de produtos, datas, preços ou descontos posteriores devem constar na versão atualizada e ser comunicadas às partes.</li>",
    "</ol></section>",
    "<section><h2>5. Observações</h2><p>",E(order.observations?.trim()||"Sem observações."),"</p></section>",
    "<p>Rio de Janeiro, ",E(today),"</p>",
    "<div class='sign'><div>LOCADORA — Closet Festa</div><div>LOCATÁRIO(A) — ",
    E(customer.full_name),"</div></div></body></html>"
  ];
  return parts.join("");
}
export function printRentalContract(detail:OrderDetail):void {
  const tab=window.open("","_blank");
  if(!tab)throw new Error("A impressão foi bloqueada. Autorize janelas pop-up para este sistema.");
  tab.document.open();
  tab.document.write(rentalContractHtml(detail));
  tab.document.close();
  tab.focus();
}
