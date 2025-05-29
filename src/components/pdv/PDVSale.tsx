import React, { useState, useEffect, useRef } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Percent, 
  Minus, 
  Plus, 
  CreditCard, 
  BanknoteIcon, 
  Wallet,
  UserPlus,
  User,
  CalendarDays,
  ShoppingCart,
  Target,
  FileText,
  Printer,
  AlertCircle,
  Check,
  Clock
} from "lucide-react";
import { useProducts, Product } from "@/hooks/useProducts";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
import PDVProductList from "./PDVProductList";
import PDVPaymentModal from "./PDVPaymentModal";
import PDVQuickCustomer from "./PDVQuickCustomer";

export type OrderType = 'sale' | 'rental' | 'hybrid';
export type ItemType = 'sale' | 'rental';

export interface CartItem extends Product {
  quantity: number;
  subtotal: number;
  discount: number;
  itemType: ItemType; // Novo campo para diferenciar venda de aluguel
  // Campos específicos para aluguel
  tryOnDate?: string;
  pickupDate?: string;
  eventDate?: string;
  returnDate?: string;
}

export interface OrderDates {
  tryOnDate: string;
  pickupDate: string;
  eventDate: string;
  returnDate: string;
}

const PDVSale = () => {
  const { toast } = useToast();
  const { productsList } = useProducts();
  const { createOrder, generateContract, generateReceipt } = useOrders();
  
  const [barcode, setBarcode] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('hybrid');
  const [defaultItemType, setDefaultItemType] = useState<ItemType>('sale');
  const [orderDates, setOrderDates] = useState<OrderDates>({
    tryOnDate: '',
    pickupDate: '',
    eventDate: '',
    returnDate: ''
  });
  const [observations, setObservations] = useState('');
  const [total, setTotal] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalRentals, setTotalRentals] = useState(0);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ name: string; document: string; phone?: string } | null>(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Focus barcode input when component mounts
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Calculate totals whenever cart changes
  useEffect(() => {
    let newTotal = 0;
    let newDiscount = 0;
    let newTotalSales = 0;
    let newTotalRentals = 0;
    
    cart.forEach(item => {
      newTotal += item.subtotal;
      newDiscount += item.discount;
      
      if (item.itemType === 'sale') {
        newTotalSales += item.subtotal;
      } else {
        newTotalRentals += item.subtotal;
      }
    });

    // Apply global discount
    let finalTotal = newTotal;
    if (globalDiscount > 0) {
      if (globalDiscountType === 'percentage') {
        const discountAmount = (newTotal * globalDiscount) / 100;
        finalTotal = newTotal - discountAmount;
        newDiscount += discountAmount;
      } else {
        finalTotal = newTotal - globalDiscount;
        newDiscount += globalDiscount;
      }
    }
    
    setTotal(Math.max(0, finalTotal)); // Prevent negative totals
    setTotalDiscount(newDiscount);
    setTotalSales(newTotalSales);
    setTotalRentals(newTotalRentals);
  }, [cart, globalDiscount, globalDiscountType]);

  // Validate rental dates
  const validateRentalDates = (): boolean => {
    if (!hasRentalItems) return true;

    const { tryOnDate, pickupDate, eventDate, returnDate } = orderDates;
    
    if (!pickupDate || !eventDate || !returnDate) {
      toast({
        title: "Datas obrigatórias",
        description: "Para itens de aluguel, as datas de retirada, evento e devolução são obrigatórias.",
        variant: "destructive",
      });
      return false;
    }

    const pickup = new Date(pickupDate);
    const event = new Date(eventDate);
    const returnD = new Date(returnDate);
    const tryOn = tryOnDate ? new Date(tryOnDate) : null;

    if (tryOn && tryOn >= pickup) {
      toast({
        title: "Data inválida",
        description: "A data da prova deve ser anterior à retirada.",
        variant: "destructive",
      });
      return false;
    }

    if (pickup >= event) {
      toast({
        title: "Data inválida", 
        description: "A data de retirada deve ser anterior ao evento.",
        variant: "destructive",
      });
      return false;
    }

    if (event >= returnD) {
      toast({
        title: "Data inválida",
        description: "A data do evento deve ser anterior à devolução.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Handle barcode scan or manual entry
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!barcode) return;
    
    // Try to find by SKU first, then by ID
    const product = productsList.find(p => p.sku === barcode || p.id === barcode);
    
    if (product) {
      addProductToCart(product, defaultItemType);
      setBarcode("");
    } else {
      toast({
        title: "Produto não encontrado",
        description: `Código ${barcode} não corresponde a nenhum produto.`,
        variant: "destructive",
      });
      setBarcode("");
    }
    
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  // Add product to cart with specified type
  const addProductToCart = (product: Product, itemType: ItemType) => {
    // Check availability for rentals
    if (itemType === 'rental' && product.status !== 'available') {
      toast({
        title: "Produto indisponível",
        description: `${product.name} não está disponível para aluguel.`,
        variant: "destructive",
      });
      return;
    }

    const existingItemIndex = cart.findIndex(item => 
      item.id === product.id && item.itemType === itemType
    );
    
    if (existingItemIndex !== -1) {
      // Product already in cart, update quantity
      const updatedCart = [...cart];
      const item = updatedCart[existingItemIndex];
      
      item.quantity += 1;
      const unitPrice = itemType === 'rental' && product.rental_price ? product.rental_price : product.price;
      item.subtotal = unitPrice * item.quantity - item.discount;
      
      setCart(updatedCart);
    } else {
      // New product, add to cart
      const unitPrice = itemType === 'rental' && product.rental_price ? product.rental_price : product.price;
      const newItem: CartItem = {
        ...product,
        quantity: 1,
        discount: 0,
        subtotal: unitPrice,
        itemType,
        // Adicionar datas padrão se for aluguel
        ...(itemType === 'rental' && {
          tryOnDate: orderDates.tryOnDate,
          pickupDate: orderDates.pickupDate,
          eventDate: orderDates.eventDate,
          returnDate: orderDates.returnDate
        })
      };
      
      setCart([...cart, newItem]);
    }
    
    const typeLabel = itemType === 'sale' ? 'venda' : 'aluguel';
    const price = itemType === 'rental' && product.rental_price ? product.rental_price : product.price;
    toast({
      title: "Produto adicionado",
      description: `${product.name} foi adicionado como ${typeLabel} por R$ ${price.toFixed(2)}.`,
    });
  };

  // Update item quantity in cart
  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cart.map(item => {
      if (item.id === itemId) {
        const unitPrice = item.itemType === 'rental' && item.rental_price ? item.rental_price : item.price;
        const updatedItem = {
          ...item,
          quantity: newQuantity,
          subtotal: unitPrice * newQuantity - item.discount
        };
        return updatedItem;
      }
      return item;
    });
    
    setCart(updatedCart);
  };

  // Apply discount to item
  const applyDiscount = (itemId: string, discountValue: number) => {
    const updatedCart = cart.map(item => {
      if (item.id === itemId) {
        const unitPrice = item.itemType === 'rental' && item.rental_price ? item.rental_price : item.price;
        const maxDiscount = unitPrice * item.quantity;
        const safeDiscount = Math.min(discountValue, maxDiscount);
        
        const updatedItem = {
          ...item,
          discount: safeDiscount,
          subtotal: unitPrice * item.quantity - safeDiscount
        };
        return updatedItem;
      }
      return item;
    });
    
    setCart(updatedCart);
  };

  // Remove item from cart
  const removeItem = (itemId: string) => {
    const updatedCart = cart.filter(item => item.id !== itemId);
    setCart(updatedCart);
  };

  // Update item type (sale/rental)
  const updateItemType = (itemId: string, newType: ItemType) => {
    const updatedCart = cart.map(item => {
      if (item.id === itemId) {
        const unitPrice = newType === 'rental' && item.rental_price ? item.rental_price : item.price;
        const updatedItem = {
          ...item,
          itemType: newType,
          subtotal: unitPrice * item.quantity - item.discount,
          // Adicionar/remover datas baseado no tipo
          ...(newType === 'rental' ? {
            tryOnDate: orderDates.tryOnDate,
            pickupDate: orderDates.pickupDate,
            eventDate: orderDates.eventDate,
            returnDate: orderDates.returnDate
          } : {
            tryOnDate: undefined,
            pickupDate: undefined,
            eventDate: undefined,
            returnDate: undefined
          })
        };
        return updatedItem;
      }
      return item;
    });
    
    setCart(updatedCart);
  };

  // Handle payment completion
  const handlePaymentComplete = async (paymentDetails: any) => {
    if (!selectedCustomer) {
      toast({
        title: "Cliente obrigatório",
        description: "Selecione um cliente antes de finalizar o pedido.",
        variant: "destructive",
      });
      return;
    }

    if (!validateRentalDates()) {
      return;
    }

    setIsProcessingOrder(true);

    try {
      // Determine order type based on cart items
      let orderTypeValue: 'sale' | 'rental' | 'hybrid' = 'sale';
      if (hasRentalItems && hasSaleItems) {
        orderTypeValue = 'hybrid';
      } else if (hasRentalItems) {
        orderTypeValue = 'rental';
      }

      // Prepare order data with correct product information
      const orderData = {
        customer_name: selectedCustomer.name,
        customer_document: selectedCustomer.document,
        customer_phone: selectedCustomer.phone,
        order_type: orderTypeValue,
        items: cart.map(item => {
          // Find the original product to get the correct name and details
          const originalProduct = productsList.find(p => p.id === item.id || p.sku === item.sku);
          const productName = originalProduct ? originalProduct.name : item.name;
          
          return {
            product_id: item.id,
            product_name: productName, // Adicionar nome do produto
            product_sku: item.sku, // Adicionar SKU
            quantity: item.quantity,
            unit_price: item.itemType === 'rental' && item.rental_price ? item.rental_price : item.price,
            discount: item.discount,
            item_type: item.itemType,
            try_on_date: item.tryOnDate,
            pickup_date: item.pickupDate,
            event_date: item.eventDate,
            return_date: item.returnDate
          };
        }),
        subtotal: totalSales + totalRentals + totalDiscount,
        total_discount: totalDiscount,
        total: total,
        total_sales: totalSales,
        total_rentals: totalRentals,
        observations: observations,
        payment_details: paymentDetails // Adicionar detalhes do pagamento
      };

      console.log('Criando pedido com dados:', orderData);

      const createdOrder = await createOrder(orderData);
      
      toast({
        title: "Pedido criado com sucesso!",
        description: `Pedido #${createdOrder.order_number} foi criado. Total: R$ ${total.toFixed(2)}`,
        action: (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // Aqui você pode navegar para a aba de pedidos
              const pedidosTab = document.querySelector('[value="pedidos"]') as HTMLElement;
              if (pedidosTab) {
                pedidosTab.click();
              }
            }}
          >
            Ver Pedidos
          </Button>
        ),
      });
      
      // Reset form
      setCart([]);
      setObservations('');
      setGlobalDiscount(0);
      setSelectedCustomer(null);
      setIsPaymentModalOpen(false);
      
      // Reset order dates
      setOrderDates({
        tryOnDate: '',
        pickupDate: '',
        eventDate: '',
        returnDate: ''
      });
      
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast({
        title: "Erro ao criar pedido",
        description: "Ocorreu um erro ao processar o pedido. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Generate contract for rental items
  const handleGenerateContract = async () => {
    if (!hasRentalItems) {
      toast({
        title: "Nenhum item de aluguel",
        description: "O contrato só pode ser gerado para pedidos com itens de aluguel.",
        variant: "destructive",
      });
      return;
    }

    try {
      // This would need an order ID, so this is more for demonstration
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "O contrato será gerado após a finalização do pedido.",
      });
    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
    }
  };

  // Clear entire cart
  const clearCart = () => {
    if (cart.length === 0) return;
    
    setCart([]);
    setGlobalDiscount(0);
    toast({
      title: "Carrinho limpo",
      description: "Todos os itens foram removidos do carrinho.",
    });
  };

  // Handle customer selection
  const handleCustomerSelect = (customer: { name: string; document: string; phone?: string }) => {
    setSelectedCustomer(customer);
    setIsCustomerModalOpen(false);
  };

  // Check if order has rental items
  const hasRentalItems = cart.some(item => item.itemType === 'rental');
  const hasSaleItems = cart.some(item => item.itemType === 'sale');

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
      {/* Left side - Products and configuration */}
      <div className="xl:col-span-1 order-2 xl:order-1 space-y-4">
        {/* Order Type Configuration */}
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target size={20} />
              Tipo de Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <RadioGroup 
              value={defaultItemType} 
              onValueChange={(value: ItemType) => setDefaultItemType(value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sale" id="sale" />
                <Label htmlFor="sale" className="flex items-center gap-2">
                  🛍️ Venda
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rental" id="rental" />
                <Label htmlFor="rental" className="flex items-center gap-2">
                  🎯 Aluguel
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Rental Dates (shown only if default is rental or has rental items) */}
        {(defaultItemType === 'rental' || hasRentalItems) && (
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays size={20} />
                Datas do Aluguel
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div>
                <Label htmlFor="tryOnDate" className="text-sm">Prova</Label>
                <Input
                  id="tryOnDate"
                  type="date"
                  value={orderDates.tryOnDate}
                  onChange={(e) => setOrderDates(prev => ({ ...prev, tryOnDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pickupDate" className="text-sm">Retirada</Label>
                <Input
                  id="pickupDate"
                  type="date"
                  value={orderDates.pickupDate}
                  onChange={(e) => setOrderDates(prev => ({ ...prev, pickupDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="eventDate" className="text-sm">Evento</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={orderDates.eventDate}
                  onChange={(e) => setOrderDates(prev => ({ ...prev, eventDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="returnDate" className="text-sm">Devolução</Label>
                <Input
                  id="returnDate"
                  type="date"
                  value={orderDates.returnDate}
                  onChange={(e) => setOrderDates(prev => ({ ...prev, returnDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Search */}
        <Card className="flex-1">
          <CardHeader className="p-4">
            <CardTitle className="text-lg md:text-xl">Produtos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {/* Barcode scanner */}
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="Código de barras"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Search size={18} className="text-gray-500" />
                </div>
              </div>
              <Button type="submit" variant="secondary" className="whitespace-nowrap">
                Add
              </Button>
            </form>
            
            {/* Product search */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar produto"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Search size={18} className="text-gray-500" />
              </div>
            </div>
            
            {/* Product results */}
            <div className="h-[calc(100vh-40rem)] sm:h-[calc(100vh-36rem)] xl:h-[calc(100vh-32rem)] overflow-y-auto border rounded-md p-2">
              {productsList
                .filter(p => 
                  searchTerm ? 
                    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    p.id?.toLowerCase().includes(searchTerm.toLowerCase()) 
                  : true
                )
                .map(product => (
                  <div 
                    key={product.id}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer mb-2"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.id}</p>
                        <p className="font-semibold text-sm mt-1">R$ {product.price.toFixed(2)}</p>
                      </div>
                      <Badge 
                        variant={product.quantity > 0 ? "outline" : "destructive"}
                        className="text-xs"
                      >
                        {product.quantity > 0 ? "Disponível" : "Indisponível"}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 text-xs"
                        onClick={() => addProductToCart(product, 'sale')}
                      >
                        🛍️ Venda
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 text-xs"
                        onClick={() => addProductToCart(product, 'rental')}
                      >
                        🎯 Aluguel
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Right side - Cart and payment */}
      <div className="xl:col-span-3 order-1 xl:order-2">
        <Card className="h-full">
          <CardHeader className="flex flex-row justify-between items-start gap-2 p-4">
            <div>
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <ShoppingCart size={20} />
                Pedido Híbrido
                {cart.length > 0 && (
                  <Badge variant="secondary">
                    {cart.length} {cart.length === 1 ? 'item' : 'itens'}
                  </Badge>
                )}
              </CardTitle>
              {selectedCustomer ? (
                <div className="flex items-center gap-1 mt-1 text-sm">
                  <User size={14} />
                  <span className="truncate">{selectedCustomer.name}</span>
                  {selectedCustomer.document && (
                    <span className="text-gray-500 hidden sm:inline">({selectedCustomer.document})</span>
                  )}
                </div>
              ) : (
                <span className="text-xs sm:text-sm text-gray-500">Cliente não identificado</span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCustomerModalOpen(true)}
                className="text-xs whitespace-nowrap"
              >
                <UserPlus size={14} className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">
                  {selectedCustomer ? "Trocar Cliente" : "Cliente"}
                </span>
                <span className="inline sm:hidden">Cliente</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearCart}
                disabled={cart.length === 0}
                className="text-xs whitespace-nowrap"
              >
                <Minus size={14} className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Limpar</span>
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-4">
            {/* Cart items list */}
            <div className="h-[calc(100vh-28rem)] sm:h-[calc(100vh-24rem)] overflow-y-auto mb-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <ShoppingCart size={48} className="mb-4" />
                  <p className="text-lg font-medium">Carrinho vazio</p>
                  <p className="text-sm">Adicione produtos para criar um pedido</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, index) => (
                    <div key={`${item.id}-${item.itemType}-${index}`} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">
                              {item.itemType === 'sale' ? '🛍️' : '🎯'}
                            </span>
                            <Badge variant={item.itemType === 'sale' ? 'default' : 'secondary'} className="text-xs">
                              {item.itemType === 'sale' ? 'Venda' : 'Aluguel'}
                            </Badge>
                          </div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.id}</p>
                          <p className="text-sm font-semibold mt-1">
                            R$ {item.price.toFixed(2)} × {item.quantity} = R$ {(item.price * item.quantity).toFixed(2)}
                          </p>
                          {item.discount > 0 && (
                            <p className="text-sm text-green-600">
                              Desconto: -R$ {item.discount.toFixed(2)}
                            </p>
                          )}
                          <p className="text-base font-bold text-marsala">
                            Subtotal: R$ {item.subtotal.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <div className="flex items-center gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={14} />
                            </Button>
                            <span className="px-2 text-sm font-medium">{item.quantity}</span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus size={14} />
                            </Button>
                          </div>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => removeItem(item.id)}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                      
                      {/* Item type toggle */}
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          variant={item.itemType === 'sale' ? 'default' : 'outline'}
                          onClick={() => updateItemType(item.id, 'sale')}
                          className="text-xs"
                        >
                          🛍️ Venda
                        </Button>
                        <Button 
                          size="sm" 
                          variant={item.itemType === 'rental' ? 'default' : 'outline'}
                          onClick={() => updateItemType(item.id, 'rental')}
                          className="text-xs"
                        >
                          🎯 Aluguel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Observations */}
            <div className="mb-4">
              <Label htmlFor="observations" className="text-sm font-medium mb-2 block">
                Observações
              </Label>
              <Textarea
                id="observations"
                placeholder="Observações internas sobre o pedido..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col p-4">
            <Separator className="mb-4" />
            
            <div className="w-full space-y-2">
              {/* Breakdown by type */}
              {hasSaleItems && (
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1">
                    🛍️ Total Vendas:
                  </span>
                  <span>R$ {totalSales.toFixed(2)}</span>
                </div>
              )}
              
              {hasRentalItems && (
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1">
                    🎯 Total Aluguéis:
                  </span>
                  <span>R$ {totalRentals.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>R$ {(total + totalDiscount).toFixed(2)}</span>
              </div>
              
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Descontos:</span>
                  <span>- R$ {totalDiscount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold text-lg pt-2">
                <span>Total Geral:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                <Button 
                  variant="outline"
                  disabled={cart.length === 0 || !hasRentalItems}
                  className="py-3"
                  onClick={handleGenerateContract}
                >
                  <FileText size={16} className="mr-2" />
                  Contrato
                </Button>
                <Button 
                  variant="outline"
                  disabled={cart.length === 0}
                  className="py-3"
                >
                  <Printer size={16} className="mr-2" />
                  Comprovante
                </Button>
              </div>

              {/* Global Discount */}
              {cart.length > 0 && (
                <div className="mt-4 p-3 border rounded-lg bg-gray-50 dark:bg-gray-900">
                  <Label className="text-sm font-medium mb-2 block">
                    Desconto Global
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroup 
                        value={globalDiscountType} 
                        onValueChange={(value: 'percentage' | 'amount') => setGlobalDiscountType(value)}
                        className="flex flex-row"
                      >
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="percentage" id="percentage" />
                          <Label htmlFor="percentage" className="text-xs">%</Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="amount" id="amount" />
                          <Label htmlFor="amount" className="text-xs">R$</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <Input
                      type="number"
                      placeholder={globalDiscountType === 'percentage' ? '0%' : 'R$ 0,00'}
                      value={globalDiscount}
                      onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                      className="flex-1"
                      min="0"
                      max={globalDiscountType === 'percentage' ? 100 : totalSales + totalRentals}
                    />
                  </div>
                </div>
              )}
              
              <Button 
                className="w-full mt-2 py-4 md:py-6 text-base md:text-lg bg-marsala hover:bg-marsala-700"
                disabled={cart.length === 0 || isProcessingOrder}
                onClick={() => setIsPaymentModalOpen(true)}
              >
                {isProcessingOrder ? (
                  <>
                    <Clock size={18} className="mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} className="mr-2" />
                    Finalizar Pedido
                  </>
                )}
              </Button>

              {/* Order Validation Messages */}
              {cart.length > 0 && (
                <div className="mt-3 space-y-2">
                  {!selectedCustomer && (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                      <AlertCircle size={16} />
                      <span>Cliente não selecionado</span>
                    </div>
                  )}
                  
                  {hasRentalItems && (!orderDates.pickupDate || !orderDates.eventDate || !orderDates.returnDate) && (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                      <AlertCircle size={16} />
                      <span>Datas do aluguel incompletas</span>
                    </div>
                  )}
                  
                  {selectedCustomer && hasRentalItems && orderDates.pickupDate && orderDates.eventDate && orderDates.returnDate && (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                      <Check size={16} />
                      <span>Pedido pronto para finalização</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Payment Modal */}
      <PDVPaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)}
        total={total}
        onPaymentComplete={handlePaymentComplete}
        customer={selectedCustomer}
      />
      
      {/* Quick Customer Modal */}
      <PDVQuickCustomer
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelectCustomer={handleCustomerSelect}
      />
    </div>
  );
};

export default PDVSale;
