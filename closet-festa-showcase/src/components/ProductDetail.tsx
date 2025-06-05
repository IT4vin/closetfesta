import { Product } from "@/types";
import { Instagram, MessageCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { useState } from "react";

interface ProductDetailProps {
  product: Product;
}

const ProductDetail = ({ product }: ProductDetailProps) => {
  const { isAdmin } = useAppContext();
  
  const formatPrice = (price: number | null) => {
    if (price === null) return "Não disponível";
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Gerar URL da imagem do backend Node.js ou usar placeholder
  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return '/placeholder.svg';
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    return `${baseUrl}/uploads/${imagePath}`;
  };

  const mainImage = getImageUrl((product as any).image_path);
  
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-1/2">
        <div className="aspect-square overflow-hidden rounded-md mb-4">
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.svg';
            }}
          />
        </div>
      </div>
      
      <div className="w-full md:w-1/2 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
            
            <div className="flex flex-col gap-1">
              {product.tags && product.tags.map((tag) => (
                <span 
                  key={tag} 
                  className={`
                    px-2 py-0.5 rounded text-xs font-medium
                    ${tag === 'novo' ? 'badge-new' : 
                      tag === 'promoção' ? 'badge-promo' : 
                      'badge-popular'}
                  `}
                >
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </span>
              ))}
            </div>
          </div>
          
          <p className="text-gray-600 mt-2">{product.description}</p>
          
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Categoria</h3>
                <p className="mt-1 font-medium">{product.category}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Tamanhos</h3>
                <div className="mt-1 flex flex-wrap gap-1">
                  {product.sizes.map((size) => (
                    <span 
                      key={size} 
                      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium border-marsala text-marsala"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Preço para aluguel</h3>
                <p className="mt-1 text-xl font-bold text-marsala">{formatPrice(product.rentalPrice)}</p>
              </div>
              
              {product.salePrice !== null && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Preço para venda</h3>
                  <p className="mt-1 text-xl font-bold text-gray-900">{formatPrice(product.salePrice)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-8 space-y-4">
          <h3 className="text-sm font-medium text-gray-500">Entre em contato</h3>
          <div className="flex flex-wrap gap-2">
            {product.contactLinks?.whatsapp && (
              <Button asChild className="bg-green-500 hover:bg-green-600 gap-2">
                <a 
                  href={`https://wa.me/${product.contactLinks.whatsapp}?text=Olá! Tenho interesse no produto ${product.name}. Poderia me dar mais informações?`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={18} />
                  <span>WhatsApp</span>
                </a>
              </Button>
            )}
            
            {product.contactLinks?.instagram && (
              <Button asChild className="bg-[#E1306C] hover:bg-[#C13584] gap-2">
                <a 
                  href={`https://instagram.com/${product.contactLinks.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram size={18} />
                  <span>Instagram</span>
                </a>
              </Button>
            )}
            
            {product.contactLinks?.shopee && (
              <Button asChild className="bg-orange-500 hover:bg-orange-600 gap-2">
                <a 
                  href={`https://shopee.com.br/${product.contactLinks.shopee}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ShoppingBag size={18} />
                  <span>Shopee</span>
                </a>
              </Button>
            )}
            
            {/* Links padrão se não há links específicos do produto */}
            {(!product.contactLinks?.whatsapp && !product.contactLinks?.instagram) && (
              <>
                <Button asChild className="bg-green-500 hover:bg-green-600 gap-2">
                  <a 
                    href={`https://wa.me/5511999999999?text=Olá! Tenho interesse no produto ${product.name}. Poderia me dar mais informações?`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle size={18} />
                    <span>WhatsApp</span>
                  </a>
                </Button>
                
                <Button asChild className="bg-[#E1306C] hover:bg-[#C13584] gap-2">
                  <a 
                    href="https://instagram.com/closetfesta"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Instagram size={18} />
                    <span>Instagram</span>
                  </a>
                </Button>
              </>
            )}
          </div>
          
          {isAdmin && (
            <div className="pt-4 border-t border-gray-200">
              <Button variant="outline" className="w-full">
                Editar produto
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
