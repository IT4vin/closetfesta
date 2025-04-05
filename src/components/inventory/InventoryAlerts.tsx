
import React from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { 
  AlertTriangle, 
  CalendarClock, 
  Package, 
  History,
  ArrowDownIcon,
  ArrowDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

const InventoryAlerts = () => {
  const { toast } = useToast();

  // Dados de exemplo (seriam substituídos por dados reais do backend)
  const lowStockItems = [
    { id: 1, name: "Vestido de Noiva Sereia", sku: "VN-001", current: 2, minimum: 5 },
    { id: 2, name: "Terno Slim Azul Marinho", sku: "TS-042", current: 1, minimum: 3 },
    { id: 3, name: "Vestido de Dama de Honra Rosa", sku: "VD-023", current: 2, minimum: 4 },
    { id: 4, name: "Acessório Tiara de Cristal", sku: "AC-107", current: 3, minimum: 5 },
  ];
  
  const pendingReturns = [
    { id: 101, product: "Vestido de Noiva Princesa", client: "Maria Silva", dueDate: "2025-04-02", daysLate: 3 },
    { id: 102, product: "Smoking Premium", client: "João Santos", dueDate: "2025-04-03", daysLate: 2 },
    { id: 103, product: "Terno Slim Cinza", client: "Pedro Oliveira", dueDate: "2025-04-01", daysLate: 4 },
  ];
  
  const itemsToMaintain = [
    { id: 201, name: "Vestido de Festa Azul", sku: "VF-056", lastMaintenance: "2025-01-15", frequency: "90 dias" },
    { id: 202, name: "Terno Slim Preto", sku: "TS-012", lastMaintenance: "2025-02-01", frequency: "90 dias" },
  ];
  
  const handleRestockNotification = (item) => {
    toast({
      title: "Notificação enviada!",
      description: `Solicitação de reposição para ${item.name} foi enviada ao departamento responsável.`,
      duration: 3000,
    });
  };
  
  const handleReturnAlert = (item) => {
    toast({
      title: "Cliente notificado!",
      description: `${item.client} foi notificado sobre o atraso de ${item.daysLate} dias na devolução.`,
      duration: 3000,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Alerta de Estoque Baixo */}
      <Card className="shadow-sm border-l-4 border-l-amber-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center">
              <AlertTriangle size={18} className="text-amber-500 mr-2" />
              Produtos com Estoque Baixo
            </CardTitle>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-300">
              {lowStockItems.length} itens
            </Badge>
          </div>
          <CardDescription>
            Produtos abaixo do nível mínimo de estoque
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="space-y-4">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>SKU: {item.sku}</span>
                    <span className="mx-2">•</span>
                    <span className="flex items-center text-red-500">
                      <ArrowDown size={14} className="mr-1" />
                      {item.current}/{item.minimum} unidades
                    </span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => handleRestockNotification(item)}
                >
                  Solicitar Reposição
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" className="w-full">
            Ver Todos
          </Button>
        </CardFooter>
      </Card>
      
      {/* Aluguéis com Atraso na Devolução */}
      <Card className="shadow-sm border-l-4 border-l-red-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center">
              <CalendarClock size={18} className="text-red-500 mr-2" />
              Devoluções Pendentes
            </CardTitle>
            <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-300">
              {pendingReturns.length} itens
            </Badge>
          </div>
          <CardDescription>
            Produtos alugados com devolução em atraso
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="space-y-4">
            {pendingReturns.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">{item.product}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>Cliente: {item.client}</span>
                    <span className="mx-2">•</span>
                    <span className="text-red-500">
                      {item.daysLate} dias em atraso
                    </span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => handleReturnAlert(item)}
                >
                  Notificar Cliente
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" className="w-full">
            Ver Todos
          </Button>
        </CardFooter>
      </Card>
      
      {/* Itens que Precisam de Manutenção */}
      <Card className="shadow-sm border-l-4 border-l-blue-500 lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center">
              <History size={18} className="text-blue-500 mr-2" />
              Itens que Necessitam Manutenção
            </CardTitle>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-300">
              {itemsToMaintain.length} itens
            </Badge>
          </div>
          <CardDescription>
            Produtos que estão próximos ou já passaram do prazo de manutenção
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {itemsToMaintain.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>SKU: {item.sku}</span>
                    <span className="mx-2">•</span>
                    <span>Última manutenção: {new Date(item.lastMaintenance).toLocaleDateString('pt-BR')}</span>
                    <span className="mx-2">•</span>
                    <span>Periodicidade: {item.frequency}</span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                >
                  Agendar Manutenção
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryAlerts;
