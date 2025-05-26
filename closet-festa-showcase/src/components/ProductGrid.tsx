
import { useAppContext } from "@/context/AppContext";
import ProductCard from "./ProductCard";

const ProductGrid = () => {
  const { filteredProducts } = useAppContext();
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
      {filteredProducts.length > 0 ? (
        filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))
      ) : (
        <div className="col-span-full py-12 text-center">
          <p className="text-gray-500">Nenhum produto encontrado com os filtros selecionados</p>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
