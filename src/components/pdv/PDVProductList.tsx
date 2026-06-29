
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2, Percent } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CartItem } from "./PDVSale";

interface PDVProductListProps {
  cartItems: CartItem[];
  updateQuantity: (itemId: string | number, quantity: number) => void;
  applyDiscount: (itemId: string | number, discount: number) => void;
  removeItem: (itemId: string | number) => void;
}

const PDVProductList: React.FC<PDVProductListProps> = ({
  cartItems,
  updateQuantity,
  applyDiscount,
  removeItem,
}) => {
  const [discountItem, setDiscountItem] = useState<CartItem | null>(null);
  const [discountValue, setDiscountValue] = useState<string>("");
  const [discountType, setDiscountType] = useState<"value" | "percentage">("value");

  const handleApplyDiscount = () => {
    if (!discountItem) return;
    
    let finalDiscount = 0;
    const numericValue = parseFloat(discountValue);
    
    if (isNaN(numericValue) || numericValue < 0) {
      setDiscountValue("");
      return;
    }
    
    if (discountType === "percentage") {
      // Convert percentage to actual value
      const maxPercentage = 100;
      const safePercentage = Math.min(numericValue, maxPercentage);
      finalDiscount = (discountItem.rentalPrice * discountItem.quantity) * (safePercentage / 100);
    } else {
      // Use value directly
      const maxDiscount = discountItem.rentalPrice * discountItem.quantity;
      finalDiscount = Math.min(numericValue, maxDiscount);
    }
    
    applyDiscount(discountItem.id, finalDiscount);
    setDiscountItem(null);
    setDiscountValue("");
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-gray-500">
        <p className="mb-2">Carrinho vazio</p>
        <p className="text-sm">Adicione produtos usando o leitor de códigos ou a busca</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex flex-col border rounded-md p-3 shadow-sm"
          >
            <div className="flex justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-gray-500">{item.sku}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">R$ {item.rentalPrice.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Unitário</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-3">
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus size={14} />
                </Button>
                <span className="mx-3 font-medium min-w-[30px] text-center">
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus size={14} />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                {item.discount > 0 && (
                  <div className="text-green-600 dark:text-green-400 text-sm">
                    Desconto: R$ {item.discount.toFixed(2)}
                  </div>
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blue-600"
                  onClick={() => setDiscountItem(item)}
                >
                  <Percent size={16} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end mt-2">
              <p className="font-semibold">
                Subtotal: R$ {item.subtotal.toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Discount Dialog */}
      <Dialog open={!!discountItem} onOpenChange={(open) => !open && setDiscountItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Aplicar Desconto</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {discountItem && (
              <>
                <div className="mb-4">
                  <p className="font-medium">{discountItem.name}</p>
                  <p className="text-sm">
                    Preço unitário: R$ {discountItem.rentalPrice.toFixed(2)} x {discountItem.quantity} = 
                    R$ {(discountItem.rentalPrice * discountItem.quantity).toFixed(2)}
                  </p>
                </div>
                
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Valor do desconto"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex border rounded-md">
                    <Button
                      type="button"
                      variant={discountType === "value" ? "default" : "outline"}
                      className="rounded-r-none"
                      onClick={() => setDiscountType("value")}
                    >
                      R$
                    </Button>
                    <Button
                      type="button"
                      variant={discountType === "percentage" ? "default" : "outline"}
                      className="rounded-l-none"
                      onClick={() => setDiscountType("percentage")}
                    >
                      %
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscountItem(null)}>
              Cancelar
            </Button>
            <Button onClick={handleApplyDiscount}>
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PDVProductList;
