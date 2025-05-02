
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
import { 
  Search, 
  Percent, 
  Minus, 
  Plus, 
  CreditCard, 
  BanknoteIcon, 
  Wallet,
  UserPlus,
  User
} from "lucide-react";
import { useProducts, Product } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import PDVProductList from "./PDVProductList";
import PDVPaymentModal from "./PDVPaymentModal";
import PDVQuickCustomer from "./PDVQuickCustomer";

export interface CartItem extends Product {
  quantity: number;
  subtotal: number;
  discount: number;
}

const PDVSale = () => {
  const { toast } = useToast();
  const { productsList } = useProducts();
  const [barcode, setBarcode] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ name: string; document: string } | null>(null);
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Focus barcode input when component mounts
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Calculate total whenever cart changes
  useEffect(() => {
    let newTotal = 0;
    let newDiscount = 0;
    
    cart.forEach(item => {
      newTotal += item.subtotal;
      newDiscount += item.discount;
    });
    
    setTotal(newTotal);
    setTotalDiscount(newDiscount);
  }, [cart]);

  // Handle barcode scan or manual entry
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!barcode) return;
    
    // In a real app, you'd validate the barcode format
    const product = productsList.find(p => p.sku === barcode);
    
    if (product) {
      addProductToCart(product);
      setBarcode("");
    } else {
      toast({
        title: "Produto não encontrado",
        description: `Código ${barcode} não corresponde a nenhum produto.`,
        variant: "destructive",
      });
      setBarcode("");
    }
    
    // Refocus on barcode input
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  // Add product to cart
  const addProductToCart = (product: Product) => {
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingItemIndex !== -1) {
      // Product already in cart, update quantity
      const updatedCart = [...cart];
      const item = updatedCart[existingItemIndex];
      
      item.quantity += 1;
      item.subtotal = item.rentalPrice * item.quantity - item.discount;
      
      setCart(updatedCart);
    } else {
      // New product, add to cart
      const newItem: CartItem = {
        ...product,
        quantity: 1,
        discount: 0,
        subtotal: product.rentalPrice
      };
      
      setCart([...cart, newItem]);
    }
    
    toast({
      title: "Produto adicionado",
      description: `${product.name} foi adicionado ao carrinho.`,
    });
  };

  // Update item quantity in cart
  const updateItemQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cart.map(item => {
      if (item.id === itemId) {
        const updatedItem = {
          ...item,
          quantity: newQuantity,
          subtotal: item.rentalPrice * newQuantity - item.discount
        };
        return updatedItem;
      }
      return item;
    });
    
    setCart(updatedCart);
  };

  // Apply discount to item
  const applyDiscount = (itemId: number, discountValue: number) => {
    const updatedCart = cart.map(item => {
      if (item.id === itemId) {
        // Ensure discount doesn't exceed item value
        const maxDiscount = item.rentalPrice * item.quantity;
        const safeDiscount = Math.min(discountValue, maxDiscount);
        
        const updatedItem = {
          ...item,
          discount: safeDiscount,
          subtotal: item.rentalPrice * item.quantity - safeDiscount
        };
        return updatedItem;
      }
      return item;
    });
    
    setCart(updatedCart);
  };

  // Remove item from cart
  const removeItem = (itemId: number) => {
    const updatedCart = cart.filter(item => item.id !== itemId);
    setCart(updatedCart);
  };

  // Handle payment completion
  const handlePaymentComplete = (paymentDetails: any) => {
    // In a real app, you'd:
    // 1. Save the sale to database
    // 2. Update inventory
    // 3. Generate receipt
    // 4. Create financial records
    
    toast({
      title: "Venda finalizada",
      description: `Venda no valor de R$${total.toFixed(2)} concluída com sucesso!`,
    });
    
    // Reset cart
    setCart([]);
    setIsPaymentModalOpen(false);
  };

  // Clear entire cart
  const clearCart = () => {
    if (cart.length === 0) return;
    
    setCart([]);
    toast({
      title: "Carrinho limpo",
      description: "Todos os itens foram removidos do carrinho.",
    });
  };

  // Handle quick customer selection
  const handleCustomerSelect = (customer: { name: string; document: string }) => {
    setSelectedCustomer(customer);
    setIsCustomerModalOpen(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left side - Products search and list */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Button type="submit" variant="secondary">Adicionar</Button>
            </form>
            
            {/* Product search */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar produto por nome ou SKU"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Search size={18} className="text-gray-500" />
              </div>
            </div>
            
            {/* Product results */}
            <div className="h-[calc(100vh-420px)] overflow-y-auto border rounded-md p-2">
              {productsList
                .filter(p => 
                  searchTerm ? 
                    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) 
                  : true
                )
                .map(product => (
                  <div 
                    key={product.id}
                    onClick={() => addProductToCart(product)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer flex justify-between items-center mb-2"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">R$ {product.rentalPrice.toFixed(2)}</p>
                      <Badge 
                        variant={product.status === "available" ? "outline" : "destructive"}
                        className="text-xs"
                      >
                        {product.status === "available" ? "Disponível" : "Indisponível"}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Right side - Cart and payment */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>Carrinho de Compras</CardTitle>
              {selectedCustomer ? (
                <div className="flex items-center gap-1 mt-1 text-sm">
                  <User size={14} />
                  <span>{selectedCustomer.name}</span>
                  {selectedCustomer.document && (
                    <span className="text-gray-500">({selectedCustomer.document})</span>
                  )}
                </div>
              ) : (
                <span className="text-sm text-gray-500">Cliente não identificado</span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCustomerModalOpen(true)}
              >
                <UserPlus size={16} className="mr-2" />
                {selectedCustomer ? "Trocar Cliente" : "Cliente"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearCart}
                disabled={cart.length === 0}
              >
                <Minus size={16} className="mr-2" />
                Limpar
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Cart items list */}
            <div className="h-[calc(100vh-400px)] overflow-y-auto">
              <PDVProductList 
                cartItems={cart} 
                updateQuantity={updateItemQuantity} 
                applyDiscount={applyDiscount}
                removeItem={removeItem}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col">
            <Separator className="mb-4" />
            
            <div className="w-full space-y-2">
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
                <span>Total:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              
              <Button 
                className="w-full mt-4 py-6 text-lg bg-marsala hover:bg-marsala-700"
                disabled={cart.length === 0}
                onClick={() => setIsPaymentModalOpen(true)}
              >
                <CreditCard size={20} className="mr-2" />
                Finalizar Venda
              </Button>
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
