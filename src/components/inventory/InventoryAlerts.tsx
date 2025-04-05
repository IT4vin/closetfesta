
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  AlertCircle, 
  Clock, 
  CalendarDays, 
  ArrowUpRight, 
  Check, 
  Bell, 
  BarChart
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useProducts } from "@/hooks/useProducts";

// Mock de dados para alertas
const mockAlerts = [
  {
    id: 1,
    type: "lowStock",
    productSku: "VEST-001",
    productName: "Vestido de Noiva Elegance",
    threshold: 2,
    current: 1,
    date: "2025-04-05T08:30:00"
  },
  {
    id: 2,
    type: "dueReturn",
    productSku: "TERN-001",
    productName: "Terno Preto Classic",
    client: "João Paulo",
    dueDate: "2025-04-10T18:00:00",
    date: "2025-04-05T09:15:00"
  },
  {
    id: 3,
    type: "maintenanceNeeded",
    productSku: "VEST-003",
    productName: "Vestido de Festa Dourado",
    reason: "Manchas no tecido",
    date: "2025-04-04T11:20:00"
  },
  {
    id: 4,
    type: "lowStock",
    productSku: "TERN-003",
    productName: "Terno Cinza Slim",
    threshold: 3,
    current: 1,
    date: "2025-04-04T14:45:00"
  },
  {
    id: 5,
    type: "lateReturn",
    productSku: "VEST-002",
    productName: "Vestido Madrinha Rose",
    client: "Maria Souza",
    dueDate: "2025-04-01T18:00:00",
    daysLate: 4,
    date: "2025-04-05T10:10:00"
  }
];

// Configurações de alerta (seria personalizado pelo usuário)
const alertSettings = {
  lowStockThreshold: 3,
  dueReturnDays: 2, // notificar 2 dias antes da data de devolução
  enableEmailNotifications: true,
  enableMaintenanceAlerts: true
};

const InventoryAlerts = () => {
  const { productsList } = useProducts();
  const [alerts] = useState(mockAlerts);
  const [showResolved, setShowResolved] = useState(false);
  
  // Estatísticas de alertas
  const alertStats = {
    total: alerts.length,
    lowStock: alerts.filter(a => a.type === "lowStock").length,
    dueReturn: alerts.filter(a => a.type === "dueReturn").length,
    lateReturn: alerts.filter(a => a.type === "lateReturn").length,
    maintenance: alerts.filter(a => a.type === "maintenanceNeeded").length
  };
  
  // Filtrar alertas
  const filteredAlerts = alerts;
  
  // Renderizar ícone por tipo de alerta
  const renderAlertIcon = (type: string) => {
    switch(type) {
      case "lowStock":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "dueReturn":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "lateReturn":
        return <CalendarDays className="h-5 w-5 text-red-500" />;
      case "maintenanceNeeded":
        return <ArrowUpRight className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-neutral-500" />;
    }
  };
  
  // Renderizar título do alerta
  const renderAlertTitle = (alert: any) => {
    switch(alert.type) {
      case "lowStock":
        return `Estoque Baixo: ${alert.productName}`;
      case "dueReturn":
        return `Devolução Próxima: ${alert.productName}`;
      case "lateReturn":
        return `Devolução Atrasada: ${alert.productName}`;
      case "maintenanceNeeded":
        return `Manutenção Necessária: ${alert.productName}`;
      default:
        return `Alerta: ${alert.productName}`;
    }
  };
  
  // Renderizar descrição do alerta
  const renderAlertDescription = (alert: any) => {
    switch(alert.type) {
      case "lowStock":
        return `Restam apenas ${alert.current} unidades (mínimo: ${alert.threshold})`;
      case "dueReturn":
        return `Cliente: ${alert.client} - Devolução prevista em ${new Date(alert.dueDate).toLocaleDateString()}`;
      case "lateReturn":
        return `Cliente: ${alert.client} - Atraso de ${alert.daysLate} dias na devolução`;
      case "maintenanceNeeded":
        return `Motivo: ${alert.reason}`;
      default:
        return "";
    }
  };
  
  // Renderizar badge do alerta
  const renderAlertBadge = (type: string) => {
    switch(type) {
      case "lowStock":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Estoque Baixo</Badge>;
      case "dueReturn":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Devolução Próxima</Badge>;
      case "lateReturn":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Devolução Atrasada</Badge>;
      case "maintenanceNeeded":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Manutenção</Badge>;
      default:
        return <Badge variant="outline">Geral</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Configurações de Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="font-medium">Alerta de estoque baixo</p>
                      <p className="text-sm text-neutral-500">
                        Notificar quando estoque for menor que:
                      </p>
                    </div>
                  </div>
                  <div className="font-medium text-lg">{alertSettings.lowStockThreshold} un</div>
                </div>
                
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Notificação de devolução</p>
                      <p className="text-sm text-neutral-500">
                        Avisar quantos dias antes da devolução:
                      </p>
                    </div>
                  </div>
                  <div className="font-medium text-lg">{alertSettings.dueReturnDays} dias</div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" size="sm">
                  Personalizar Alertas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Resumo de Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Total de alertas</span>
                <span className="font-medium">{alertStats.total}</span>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Estoque baixo</span>
                    <span>{alertStats.lowStock}</span>
                  </div>
                  <Progress value={(alertStats.lowStock / alertStats.total) * 100} className="h-1.5 bg-amber-100" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Devoluções próximas</span>
                    <span>{alertStats.dueReturn}</span>
                  </div>
                  <Progress value={(alertStats.dueReturn / alertStats.total) * 100} className="h-1.5 bg-blue-100" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Devoluções atrasadas</span>
                    <span>{alertStats.lateReturn}</span>
                  </div>
                  <Progress value={(alertStats.lateReturn / alertStats.total) * 100} className="h-1.5 bg-red-100" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Manutenções</span>
                    <span>{alertStats.maintenance}</span>
                  </div>
                  <Progress value={(alertStats.maintenance / alertStats.total) * 100} className="h-1.5 bg-purple-100" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Alertas Ativos</CardTitle>
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Marcar todos como vistos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.map(alert => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {renderAlertIcon(alert.type)}
                      {renderAlertBadge(alert.type)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{alert.productName}</div>
                      <div className="text-sm text-neutral-500">{alert.productSku}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {renderAlertDescription(alert)}
                  </TableCell>
                  <TableCell>
                    {new Date(alert.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Check className="h-4 w-4 mr-2" />
                      Resolver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryAlerts;
