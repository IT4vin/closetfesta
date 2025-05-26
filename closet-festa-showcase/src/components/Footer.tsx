
import { useAppContext } from "@/context/AppContext";

const Footer = () => {
  const { storeInfo } = useAppContext();
  
  return (
    <footer className="bg-gray-50 py-8 mt-12 border-t border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-bold text-marsala">{storeInfo.name}</h2>
            <p className="text-sm text-gray-500 mt-1">Vestidos para todas as ocasiões especiais</p>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} {storeInfo.name}. Todos os direitos reservados.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Desenvolvido por Lovable
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
