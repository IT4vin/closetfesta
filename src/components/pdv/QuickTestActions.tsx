import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Calendar, 
  Zap, 
  Package,
  User,
  CreditCard,
  FileText
} from "lucide-react";

interface QuickTestActionsProps {
  onAddToCart?: (productId: string, type: 'sale' | 'rental') => void;
}

const QuickTestActions: React.FC<QuickTestActionsProps> = ({ onAddToCart }) => {
  const testProducts = [
    {
      id: 'TEST-001',
      sku: '123456789',
      name: 'Vestido Festa Azul',
      salePrice: 299.90,
      rentalPrice: 89.90,
      emoji: '👗'
    },
    {
      id: 'TEST-002', 
      sku: '987654321',
      name: 'Terno Clássico',
      salePrice: 599.90,
      rentalPrice: 149.90,
      emoji: '🤵'
    },
    {
      id: 'TEST-003',
      sku: '456789123',
      name: 'Smoking Premium',
      salePrice: 799.90,
      rentalPrice: 199.90,
      emoji: '🎩'
    }
  ];

  const quickActions = [
    {
      title: "🚀 Ação Rápida 1",
      description: "Pedido Híbrido Completo",
      action: () => {
        // Simular adição rápida de produtos
        console.log("Adicionando pedido híbrido...");
      },
      color: "bg-blue-500"
    },
    {
      title: "⚡ Ação Rápida 2", 
      description: "Só Vendas",
      action: () => {
        console.log("Adicionando só vendas...");
      },
      color: "bg-green-500"
    },
    {
      title: "🎯 Ação Rápida 3",
      description: "Só Aluguéis",
      action: () => {
        console.log("Adicionando só aluguéis...");
      },
      color: "bg-purple-500"
    }
  ];

  return (
    <div className="space-y-4">
      {/* Test Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            Produtos de Teste
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {testProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{product.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm">{product.name}</p>
                    <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        Venda: R$ {product.salePrice.toFixed(2)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Aluguel: R$ {product.rentalPrice.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onAddToCart?.(product.id, 'sale')}
                    className="text-xs"
                  >
                    🛍️
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onAddToCart?.(product.id, 'rental')}
                    className="text-xs"
                  >
                    🎯
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start"
                onClick={action.action}
              >
                <div className="text-left">
                  <div className="font-semibold">{action.title}</div>
                  <div className="text-xs text-gray-500">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Instruções de Teste
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>Configure as datas de aluguel</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>Adicione produtos usando códigos ou busca</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>Cadastre um cliente de teste</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <span>Finalize com pagamento</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-700">
              💡 <strong>Dica:</strong> Use os códigos <code>123456789</code> ou <code>987654321</code> 
              no campo de código de barras para adicionar produtos rapidamente!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickTestActions; 