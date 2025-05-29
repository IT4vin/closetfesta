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
  const { storeInfo, loading, error } = useAppContext();
  
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-marsala border-t-transparent"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Erro ao carregar catálogo</h2>
              <p className="text-red-600">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
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
