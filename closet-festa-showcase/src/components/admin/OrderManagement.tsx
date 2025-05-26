
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Package, User, Phone, MapPin, Eye, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  products: {
    productId: string;
    productName: string;
    size: string;
    rentalDays?: number;
    type: 'rental' | 'sale';
    price: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'returned' | 'completed' | 'cancelled';
  orderDate: string;
  deliveryDate?: string;
  returnDate?: string;
  notes?: string;
}

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      customerName: 'Maria Silva',
      customerPhone: '(11) 99999-9999',
      customerEmail: 'maria@email.com',
      customerAddress: 'Rua das Flores, 123 - São Paulo, SP',
      products: [
        {
          productId: '1',
          productName: 'Vestido Marsala Elegante',
          size: 'M',
          rentalDays: 3,
          type: 'rental',
          price: 150
        }
      ],
      totalAmount: 150,
      status: 'confirmed',
      orderDate: '2024-01-20',
      deliveryDate: '2024-01-22',
      returnDate: '2024-01-25',
      notes: 'Cliente pediu entrega no período da manhã'
    },
    {
      id: '2',
      customerName: 'Ana Santos',
      customerPhone: '(11) 88888-8888',
      customerEmail: 'ana@email.com',
      customerAddress: 'Av. Paulista, 456 - São Paulo, SP',
      products: [
        {
          productId: '2',
          productName: 'Vestido Dourado',
          size: 'P',
          type: 'sale',
          price: 300
        }
      ],
      totalAmount: 300,
      status: 'pending',
      orderDate: '2024-01-21'
    }
  ]);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    returned: 'bg-purple-100 text-purple-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const statusLabels = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    delivered: 'Entregue',
    returned: 'Devolvido',
    completed: 'Concluído',
    cancelled: 'Cancelado'
  };

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    toast.success('Status do pedido atualizado');
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-marsala">Gerenciamento de Pedidos</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-marsala hover:bg-marsala-dark">
              <Plus className="w-4 h-4 mr-2" />
              Novo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Pedido</DialogTitle>
            </DialogHeader>
            <div className="text-center py-8">
              <p className="text-gray-500">Funcionalidade em desenvolvimento</p>
              <p className="text-sm text-gray-400 mt-2">
                Em breve você poderá criar pedidos diretamente pelo painel
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <Label>Filtrar por status:</Label>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
            <SelectItem value="returned">Devolvido</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-marsala">{orders.length}</div>
            <p className="text-sm text-gray-600">Total de Pedidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {orders.filter(o => o.status === 'pending').length}
            </div>
            <p className="text-sm text-gray-600">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === 'completed').length}
            </div>
            <p className="text-sm text-gray-600">Concluídos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-marsala">
              R$ {orders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
            </div>
            <p className="text-sm text-gray-600">Receita Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Pedidos */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(order.orderDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[order.status]}>
                    {statusLabels[order.status]}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-sm text-gray-600">{order.customerPhone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium">{order.products.length} produto(s)</p>
                    <p className="text-sm text-gray-600">R$ {order.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={order.status}
                    onValueChange={(value) => updateOrderStatus(order.id, value as Order['status'])}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="returned">Devolvido</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum pedido encontrado</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Detalhes do Pedido */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Informações do Cliente */}
              <div>
                <h3 className="font-semibold mb-3">Informações do Cliente</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome:</Label>
                    <p>{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <Label>Telefone:</Label>
                    <p>{selectedOrder.customerPhone}</p>
                  </div>
                  <div className="col-span-2">
                    <Label>Email:</Label>
                    <p>{selectedOrder.customerEmail}</p>
                  </div>
                  <div className="col-span-2">
                    <Label>Endereço:</Label>
                    <p>{selectedOrder.customerAddress}</p>
                  </div>
                </div>
              </div>

              {/* Produtos */}
              <div>
                <h3 className="font-semibold mb-3">Produtos</h3>
                <div className="space-y-2">
                  {selectedOrder.products.map((product, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{product.productName}</p>
                        <p className="text-sm text-gray-600">
                          Tamanho: {product.size} | 
                          {product.type === 'rental' 
                            ? ` Aluguel (${product.rentalDays} dias)` 
                            : ' Venda'
                          }
                        </p>
                      </div>
                      <p className="font-medium">R$ {product.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="text-right pt-2 border-t">
                  <p className="text-lg font-bold">Total: R$ {selectedOrder.totalAmount.toFixed(2)}</p>
                </div>
              </div>

              {/* Datas */}
              <div>
                <h3 className="font-semibold mb-3">Cronograma</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data do Pedido:</Label>
                    <p>{new Date(selectedOrder.orderDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                  {selectedOrder.deliveryDate && (
                    <div>
                      <Label>Data de Entrega:</Label>
                      <p>{new Date(selectedOrder.deliveryDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}
                  {selectedOrder.returnDate && (
                    <div>
                      <Label>Data de Devolução:</Label>
                      <p>{new Date(selectedOrder.returnDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Observações */}
              {selectedOrder.notes && (
                <div>
                  <Label>Observações:</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManagement;
