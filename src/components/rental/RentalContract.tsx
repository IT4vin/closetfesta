import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, FileText, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RentalFormValues } from "@/components/forms/lancamento/RentalForm";
import "./rentalContractPrint.css";

interface RentalContractProps {
  rentalData: RentalFormValues;
  companyInfo: {
    name: string;
    cnpj: string;
    address: string;
    phone: string;
    email: string;
  };
  clientInfo: {
    name: string;
    cpf: string;
    rg?: string;
    address: string;
    phone: string;
    email: string;
  };
  productDetails: {
    name: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    marketValue: number;
    condition: string;
  };
  onClose: () => void;
}

const RentalContract: React.FC<RentalContractProps> = ({
  rentalData,
  companyInfo,
  clientInfo,
  productDetails,
  onClose,
}) => {
  const startDate = format(rentalData.startDate, "dd/MM/yyyy", { locale: ptBR });
  const endDate = format(rentalData.endDate, "dd/MM/yyyy", { locale: ptBR });
  const currentDate = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleDownload = () => {
    // In a real implementation, this would generate a PDF file
    // For now, we'll just show a toast message
    alert("Função de download será implementada em breve.");
  };
  
  return (
    <div className="rental-contract">
      <div className="print:hidden flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <FileText className="mr-2" />
          Contrato de Aluguel
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
      
      <div className="contract-content border rounded-lg p-8 bg-white print:bg-white print:border-none">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">CONTRATO DE ALUGUEL</h1>
          <p className="text-neutral-500">Nº {Math.floor(Math.random() * 10000).toString().padStart(4, '0')}/{new Date().getFullYear()}</p>
        </div>
        
        {/* 1. DADOS DAS PARTES */}
        <section className="mb-8">
          <h2 className="text-xl font-bold border-b border-neutral-200 pb-2 mb-4">1. DADOS DAS PARTES</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold mb-2">LOCADOR (EMPRESA):</h3>
              <p><strong>Razão Social:</strong> {companyInfo.name}</p>
              <p><strong>CNPJ:</strong> {companyInfo.cnpj}</p>
              <p><strong>Endereço:</strong> {companyInfo.address}</p>
              <p><strong>Telefone:</strong> {companyInfo.phone}</p>
              <p><strong>E-mail:</strong> {companyInfo.email}</p>
            </div>
            
            <div>
              <h3 className="font-bold mb-2">LOCATÁRIO (CLIENTE):</h3>
              <p><strong>Nome:</strong> {clientInfo.name}</p>
              <p><strong>CPF:</strong> {clientInfo.cpf}</p>
              {clientInfo.rg && <p><strong>RG:</strong> {clientInfo.rg}</p>}
              <p><strong>Endereço:</strong> {clientInfo.address}</p>
              <p><strong>Telefone:</strong> {clientInfo.phone}</p>
              <p><strong>E-mail:</strong> {clientInfo.email}</p>
            </div>
          </div>
        </section>
        
        {/* 2. PRODUTOS ALUGADOS */}
        <section className="mb-8">
          <h2 className="text-xl font-bold border-b border-neutral-200 pb-2 mb-4">2. PRODUTOS ALUGADOS</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="border p-2 text-left">Item</th>
                  <th className="border p-2 text-left">Marca/Modelo</th>
                  <th className="border p-2 text-left">Nº de Série</th>
                  <th className="border p-2 text-left">Valor de Mercado</th>
                  <th className="border p-2 text-left">Valor do Aluguel</th>
                  <th className="border p-2 text-left">Condição</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2">{productDetails.name}</td>
                  <td className="border p-2">{productDetails.brand} {productDetails.model}</td>
                  <td className="border p-2">{productDetails.serialNumber || "N/A"}</td>
                  <td className="border p-2">R$ {productDetails.marketValue.toFixed(2)}</td>
                  <td className="border p-2">R$ {rentalData.rentalValue.toFixed(2)}</td>
                  <td className="border p-2">{productDetails.condition}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-4">
            <h4 className="font-bold mb-2">Condições de Uso:</h4>
            <p>O LOCATÁRIO compromete-se a utilizar o(s) produto(s) alugado(s) de acordo com sua finalidade específica, zelando por sua conservação e assumindo a responsabilidade por quaisquer danos causados durante o período de locação.</p>
          </div>
        </section>
        
        {/* 3. TERMO DE RETIRADA */}
        <section className="mb-8">
          <h2 className="text-xl font-bold border-b border-neutral-200 pb-2 mb-4">3. TERMO DE RETIRADA</h2>
          
          <div className="mb-4">
            <p><strong>Data de Retirada:</strong> {startDate}</p>
            <p><strong>Local de Retirada:</strong> Sede da empresa locadora</p>
          </div>
          
          <div className="mb-4">
            <p>O LOCATÁRIO declara ter recebido o(s) produto(s) em perfeitas condições de uso, conforme verificado no momento da retirada.</p>
          </div>
          
          <div className="mt-6">
            <p className="text-center">____________________________________________________</p>
            <p className="text-center">Assinatura do Locatário</p>
          </div>
        </section>
        
        {/* 4. PRAZO E DEVOLUÇÃO */}
        <section className="mb-8">
          <h2 className="text-xl font-bold border-b border-neutral-200 pb-2 mb-4">4. PRAZO E DEVOLUÇÃO</h2>
          
          <div className="mb-4">
            <p><strong>Data de Devolução:</strong> {endDate}</p>
            <p><strong>Local de Devolução:</strong> Sede da empresa locadora</p>
          </div>
          
          <div className="mb-4">
            <h4 className="font-bold mb-2">Multa por Atraso:</h4>
            <p>Em caso de atraso na devolução do(s) produto(s), será cobrada multa de 10% sobre o valor do aluguel por dia de atraso.</p>
          </div>
          
          <div className="mb-4">
            <h4 className="font-bold mb-2">Danos e Avarias:</h4>
            <p>Quaisquer danos ou avarias verificados no momento da devolução que não constem no estado inicial do produto serão de responsabilidade do LOCATÁRIO, que deverá arcar com os custos de reparo ou substituição.</p>
          </div>
        </section>
        
        {/* 5. PAGAMENTO */}
        <section className="mb-8">
          <h2 className="text-xl font-bold border-b border-neutral-200 pb-2 mb-4">5. PAGAMENTO</h2>
          
          <div>
            <p><strong>Valor Total do Aluguel:</strong> R$ {rentalData.rentalValue.toFixed(2)}</p>
            <p><strong>Forma de Pagamento:</strong> {
              rentalData.paymentMethod === "pix" ? "PIX" :
              rentalData.paymentMethod === "cartao" ? "Cartão de Crédito/Débito" :
              rentalData.paymentMethod === "boleto" ? "Boleto Bancário" : 
              rentalData.paymentMethod
            }</p>
            <p><strong>Condições de Pagamento:</strong> 50% no ato da retirada, 50% na devolução.</p>
          </div>
        </section>
        
        {/* 6. CLÁUSULAS GERAIS */}
        <section className="mb-8">
          <h2 className="text-xl font-bold border-b border-neutral-200 pb-2 mb-4">6. CLÁUSULAS GERAIS</h2>
          
          <div className="space-y-4">
            <p>6.1. O LOCATÁRIO não poderá transferir, emprestar ou sublocar o(s) produto(s) objeto deste contrato.</p>
            <p>6.2. Em caso de perda, roubo ou dano irreparável do(s) produto(s), o LOCATÁRIO deverá pagar o valor de mercado do(s) mesmo(s) conforme especificado neste contrato.</p>
            <p>6.3. O LOCADOR não se responsabiliza por danos causados a terceiros pelo uso inadequado do(s) produto(s) pelo LOCATÁRIO.</p>
            <p>6.4. Qualquer alteração nas condições deste contrato deverá ser formalizada por escrito e assinada por ambas as partes.</p>
            <p>6.5. O presente contrato constitui o acordo integral entre as partes, substituindo quaisquer acordos ou entendimentos prévios.</p>
          </div>
        </section>
        
        {/* 7. FORO */}
        <section className="mb-8">
          <h2 className="text-xl font-bold border-b border-neutral-200 pb-2 mb-4">7. FORO</h2>
          
          <p>As partes elegem o Foro da Comarca de São Paulo/SP para dirimir quaisquer dúvidas ou litígios decorrentes deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</p>
        </section>
        
        {/* Assinaturas */}
        <section className="mt-12">
          <p className="text-center mb-6">E, por estarem assim justas e contratadas, as partes assinam o presente contrato em duas vias de igual teor e forma.</p>
          
          <p className="text-center mb-8">São Paulo, {currentDate}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8">
            <div className="text-center">
              <p className="border-t border-black pt-2">LOCADOR</p>
              <p>{companyInfo.name}</p>
              <p>CNPJ: {companyInfo.cnpj}</p>
            </div>
            <div className="text-center">
              <p className="border-t border-black pt-2">LOCATÁRIO</p>
              <p>{clientInfo.name}</p>
              <p>CPF: {clientInfo.cpf}</p>
            </div>
          </div>
        </section>
        
        {/* Anexos */}
        <section className="mt-12 border-t border-neutral-200 pt-4">
          <h2 className="text-xl font-bold mb-4">ANEXOS</h2>
          
          <ul className="list-disc pl-5">
            <li>Cópia do RG e CPF do LOCATÁRIO</li>
            <li>Comprovante de residência do LOCATÁRIO</li>
            <li>Registro fotográfico do(s) produto(s) no momento da retirada</li>
            {rentalData.observations && <li>Observações adicionais</li>}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default RentalContract;
