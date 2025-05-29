import { useState } from "react";
import { Product } from "@/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ProductDetail from "./ProductDetail";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Gerar URL da imagem do Supabase storage ou usar placeholder
  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return '/placeholder.svg';
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${imagePath}`;
  };

  const mainImage = getImageUrl((product as any).image_path);
  
  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1">
        <div className="relative aspect-square overflow-hidden">
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.svg';
            }}
          />
          
          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              {product.tags.includes("novo") && (
                <span className="badge-new px-2 py-1">Novo</span>
              )}
              {product.tags.includes("promoção") && (
                <span className="badge-promo px-2 py-1">Promoção</span>
              )}
              {product.tags.includes("mais alugado") && (
                <span className="badge-popular px-2 py-1">Mais Alugado</span>
              )}
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-1">{product.name}</h3>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
          
          <div className="flex flex-col gap-1 mb-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Aluguel</span>
              <span className="font-bold text-marsala">{formatPrice(product.rentalPrice)}</span>
            </div>
            
            {product.salePrice && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Venda</span>
                <span className="font-bold text-gray-700">{formatPrice(product.salePrice)}</span>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500 mb-3">
            Categoria: {product.category}
          </div>
          
          <Button 
            onClick={() => setIsDetailOpen(true)}
            className="w-full bg-marsala hover:bg-marsala-dark"
          >
            Ver detalhes
          </Button>
        </div>
      </div>
      
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-3xl">
          <ProductDetail product={product} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductCard;
