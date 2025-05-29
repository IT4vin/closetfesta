import React from 'react';
import { Eye, ShoppingCart, Heart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CatalogProduct } from './hooks/useProducts';
import { formatCurrency } from '@/utils/formatters';
import { Card, CardContent } from '@/components/ui/card';

interface ProductListProps {
  products: CatalogProduct[];
}

const ProductList: React.FC<ProductListProps> = ({ products }) => {
  const getImageUrl = (product: CatalogProduct) => {
    if (product.images && product.images.length > 0) {
      return product.images[0].url;
    }
    return '/placeholder-product.jpg';
  };

  const getDisplayPrice = (product: CatalogProduct) => {
    if (product.rental_price && product.rental_price > 0) {
      return {
        type: 'rental',
        price: product.rental_price,
        label: 'Aluguel'
      };
    }
    if (product.sale_price && product.sale_price > 0) {
      return {
        type: 'sale',
        price: product.sale_price,
        label: 'Venda'
      };
    }
    return {
      type: 'price',
      price: product.price,
      label: 'Preço'
    };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="space-y-4">
      {products.map((product) => {
        const displayPrice = getDisplayPrice(product);
        
        return (
          <Card key={product.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex gap-6">
                {/* Product Image */}
                <div className="w-48 h-48 flex-shrink-0 overflow-hidden rounded-lg">
                  <img
                    src={getImageUrl(product)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-product.jpg';
                    }}
                  />
                </div>
                
                {/* Product Details */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-xl mb-2">
                        {product.name}
                      </h3>
                      
                      {product.category_name && (
                        <span className="inline-block bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                          {product.category_name}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-500 uppercase tracking-wide">
                        {displayPrice.label}
                      </p>
                      <p className="font-bold text-2xl text-green-600">
                        {formatPrice(displayPrice.price)}
                      </p>
                    </div>
                  </div>
                  
                  {product.description && (
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {product.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {product.quantity > 0 && (
                        <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded">
                          Em estoque
                        </span>
                      )}
                      
                      {product.sizes && product.sizes.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-500 mr-2">Tamanhos:</span>
                          {product.sizes.map((size, index) => (
                            <span
                              key={index}
                              className="text-sm bg-gray-200 text-gray-700 px-2 py-1 rounded mr-1"
                            >
                              {size}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProductList; 