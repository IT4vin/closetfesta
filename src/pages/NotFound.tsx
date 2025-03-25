
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="premium-card p-8 max-w-md text-center animate-fade-in">
        <h1 className="text-6xl font-semibold mb-4 text-marsala">404</h1>
        <p className="text-xl text-neutral-700 mb-6">Página não encontrada</p>
        <p className="text-neutral-500 mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link 
          to="/"
          className="primary-button inline-flex"
        >
          <ArrowLeft size={18} />
          <span>Voltar para o Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
