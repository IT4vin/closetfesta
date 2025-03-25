
import React from "react";
import ProductCard from "./ProductCard";
import ProductTable from "./ProductTable";
import EmptyProducts from "./EmptyProducts";

interface ProductsDisplayProps {
  products: any[];
  viewMode: "grid" | "list";
  onEdit: (product: any) => void;
}

const ProductsDisplay: React.FC<ProductsDisplayProps> = ({ 
  products, 
  viewMode, 
  onEdit 
}) => {
  if (products.length === 0) {
    return <EmptyProducts />;
  }

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onEdit={() => onEdit(product)} 
          />
        ))}
      </div>
    );
  }

  return (
    <ProductTable 
      products={products}
      onEdit={onEdit}
    />
  );
};

export default ProductsDisplay;
