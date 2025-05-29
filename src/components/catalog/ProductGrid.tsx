import React from 'react';
import { CatalogProduct } from './hooks/useProducts';
import { Card, CardContent } from '@/components/ui/card';

interface ProductGridProps {
  products: CatalogProduct[];
}

const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => {
        const displayPrice = getDisplayPrice(product);
        
        return (
          <Card key={product.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
            <div className="aspect-square overflow-hidden rounded-t-lg">
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
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                {product.name}
              </h3>
              
              {product.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {product.description}
                </p>
              )}
              
              {product.category_name && (
                <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full mb-3">
                  {product.category_name}
                </span>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {displayPrice.label}
                  </p>
                  <p className="font-bold text-lg text-green-600">
                    {formatPrice(displayPrice.price)}
                  </p>
                </div>
                
                {product.quantity > 0 && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    Em estoque
                  </span>
                )}
              </div>
              
              {product.sizes && product.sizes.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Tamanhos:</p>
                  <div className="flex flex-wrap gap-1">
                    {product.sizes.map((size, index) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProductGrid; 