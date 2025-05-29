import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ShoppingCart, 
  Calendar, 
  User, 
  Package, 
  CreditCard,
  CheckCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface TestOrderWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const TestOrderWizard: React.FC<TestOrderWizardProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "🎯 Bem-vindo ao PDV Híbrido!",
      description: "Vou te ajudar a criar um pedido de teste completo",
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <Sparkles className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
            <p className="text-gray-600">
              Vamos criar um pedido híbrido com itens de <strong>venda</strong> e <strong>aluguel</strong> 
              para demonstrar todas as funcionalidades do sistema!
            </p>
          </div>
          
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">📦 Produtos Disponíveis para Teste:</h4>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Vestido de Festa Azul</strong> - R$ 299,90 (venda) / R$ 89,90 (aluguel)</li>
                <li>• <strong>Terno Clássico Preto</strong> - R$ 599,90 (venda) / R$ 149,90 (aluguel)</li>
                <li>• <strong>Smoking Premium</strong> - R$ 799,90 (venda) / R$ 199,90 (aluguel)</li>
                <li>• <strong>Gravata Italiana</strong> - R$ 89,90 (venda) / R$ 19,90 (aluguel)</li>
                <li>• <strong>Sapato Social Premium</strong> - R$ 249,90 (venda) / R$ 49,90 (aluguel)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      title: "📅 Passo 1: Configurar Datas",
      description: "Configure as datas para os itens de aluguel",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-blue-500" />
            <span className="font-semibold">Datas do Aluguel</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-3">
                <div className="text-sm">
                  <strong>📅 Prova:</strong><br />
                  <Badge variant="outline">Hoje + 1 dia</Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3">
                <div className="text-sm">
                  <strong>📦 Retirada:</strong><br />
                  <Badge variant="outline">Hoje + 2 dias</Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3">
                <div className="text-sm">
                  <strong>🎊 Evento:</strong><br />
                  <Badge variant="outline">Hoje + 5 dias</Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3">
                <div className="text-sm">
                  <strong>🔄 Devolução:</strong><br />
                  <Badge variant="outline">Hoje + 6 dias</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 <strong>Dica:</strong> Configure estas datas no painel esquerdo antes de adicionar produtos de aluguel.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "🛍️ Passo 2: Adicionar Produtos",
      description: "Adicione produtos ao carrinho usando diferentes métodos",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-green-500" />
            <span className="font-semibold">Como Adicionar Produtos</span>
          </div>
          
          <div className="space-y-3">
            <Card>
              <CardContent className="p-3">
                <h4 className="font-semibold text-sm mb-2">🔍 Método 1: Código de Barras</h4>
                <p className="text-sm text-gray-600">
                  Digite um código: <Badge variant="secondary">123456789</Badge> ou <Badge variant="secondary">987654321</Badge>
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3">
                <h4 className="font-semibold text-sm mb-2">🔍 Método 2: Busca por Nome</h4>
                <p className="text-sm text-gray-600">
                  Busque por: <Badge variant="secondary">vestido</Badge> ou <Badge variant="secondary">terno</Badge>
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3">
                <h4 className="font-semibold text-sm mb-2">🎯 Método 3: Botões Venda/Aluguel</h4>
                <p className="text-sm text-gray-600">
                  Clique em <Badge>🛍️ Venda</Badge> ou <Badge>🎯 Aluguel</Badge> para cada produto
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      title: "👤 Passo 3: Adicionar Cliente",
      description: "Cadastre um cliente para o pedido",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-purple-500" />
            <span className="font-semibold">Dados do Cliente</span>
          </div>
          
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Exemplo de Cliente Teste:</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Nome:</strong> Maria Silva Santos</div>
                <div><strong>CPF:</strong> 123.456.789-00</div>
                <div><strong>Telefone:</strong> (11) 99999-9999</div>
              </div>
            </CardContent>
          </Card>
          
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-700">
              ⚠️ <strong>Importante:</strong> O cliente é obrigatório para finalizar o pedido!
            </p>
          </div>
        </div>
      )
    },
    {
      title: "💰 Passo 4: Finalizar Pedido",
      description: "Complete o pedido com pagamento",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-green-500" />
            <span className="font-semibold">Finalização</span>
          </div>
          
          <div className="space-y-3">
            <Card>
              <CardContent className="p-3">
                <h4 className="font-semibold text-sm mb-2">💳 Formas de Pagamento</h4>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">💵 Dinheiro</Badge>
                  <Badge variant="outline">💳 Cartão</Badge>
                  <Badge variant="outline">📱 PIX</Badge>
                  <Badge variant="outline">🏦 Transferência</Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3">
                <h4 className="font-semibold text-sm mb-2">📄 Documentos Gerados</h4>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Recibo:</strong> Para todos os pedidos</li>
                  <li>• <strong>Contrato:</strong> Para pedidos com aluguel</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      title: "🎉 Pedido Criado com Sucesso!",
      description: "Seu pedido de teste foi configurado",
      content: (
        <div className="space-y-4 text-center">
          <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Parabéns!</h3>
            <p className="text-gray-600">
              Agora você pode acompanhar o pedido nas outras abas:
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Badge variant="outline">📋 Pedidos</Badge>
            <Badge variant="outline">📊 Dashboard</Badge>
            <Badge variant="outline">📅 Agenda</Badge>
            <Badge variant="outline">📈 Relatórios</Badge>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-700">
              ✅ O sistema híbrido está funcionando perfeitamente!
            </p>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {steps[currentStep].title}
          </DialogTitle>
          <DialogDescription>
            {steps[currentStep].description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm text-gray-500">
                {currentStep + 1} de {steps.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Step Content */}
          <div className="min-h-[300px]">
            {steps[currentStep].content}
          </div>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Anterior
          </Button>
          
          <Button onClick={nextStep} className="flex items-center gap-2">
            {currentStep === steps.length - 1 ? (
              "Finalizar"
            ) : (
              <>
                Próximo
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TestOrderWizard; 