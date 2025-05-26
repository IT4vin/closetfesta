
import { useAppContext } from "@/context/AppContext";
import ProductCard from "./ProductCard";

const Featured = () => {
  const { products } = useAppContext();
  
  // Get featured products or first 4 products if no featured ones
  const featuredProducts = products.filter(product => product.featured).slice(0, 4);
  
  if (featuredProducts.length === 0) {
    return null;
  }
  
  return (
    <section className="py-6">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6 text-center">Destaques</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Featured;
