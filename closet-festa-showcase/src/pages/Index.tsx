
import { useAppContext } from "@/context/AppContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Featured from "@/components/Featured";
import CategoryFilter from "@/components/CategoryFilter";
import PriceFilter from "@/components/PriceFilter";
import ProductGrid from "@/components/ProductGrid";
import SocialBar from "@/components/SocialBar";
import StoreDescription from "@/components/StoreDescription";

const Index = () => {
  const { storeInfo } = useAppContext();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <StoreDescription />
          
          <Featured />
          
          <section className="py-6">
            <h2 className="text-2xl font-bold mb-6">Catálogo</h2>
            
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
              <CategoryFilter />
              <PriceFilter />
            </div>
            
            <div className="mt-8">
              <ProductGrid />
            </div>
          </section>
        </div>
      </main>
      
      <SocialBar />
      <Footer />
    </div>
  );
};

export default Index;
