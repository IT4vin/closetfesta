
import { useAppContext } from "@/context/AppContext";

const StoreDescription = () => {
  const { storeInfo } = useAppContext();
  
  return (
    <div className="bg-gradient-to-r from-marsala/10 to-marsala/5 rounded-lg p-6 mb-8">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-xl font-playfair font-bold text-marsala mb-2">
          Bem-vinda ao {storeInfo.name}
        </h2>
        <p className="text-gray-700">{storeInfo.description}</p>
      </div>
    </div>
  );
};

export default StoreDescription;
