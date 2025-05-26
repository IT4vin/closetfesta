
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Instagram, Search, MessageCircle, ShoppingBag, Settings } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import LoginForm from "./LoginForm";

const Header = () => {
  const { storeInfo, searchTerm, setSearchTerm, currentUser, logout } = useAppContext();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src={storeInfo.logo} 
              alt={storeInfo.name} 
              className="h-12 w-12 object-contain"
            />
            <h1 className="text-2xl font-bold text-marsala">{storeInfo.name}</h1>
          </div>
          
          <div className="flex-1 w-full md:max-w-md px-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar vestidos..."
                className="w-full py-2 pl-10 pr-4 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-marsala"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <Link to="/admin">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 text-marsala border-marsala hover:bg-marsala hover:text-white"
                  >
                    <Settings size={16} />
                    <span className="hidden sm:inline">Painel Admin</span>
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  onClick={logout}
                  className="text-marsala hover:text-marsala-dark"
                >
                  Sair
                </Button>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                onClick={() => setIsLoginOpen(true)}
                className="text-marsala hover:text-marsala-dark"
              >
                Admin
              </Button>
            )}
            
            <div className="flex items-center gap-2 ml-2">
              <a 
                href={`https://wa.me/${storeInfo.contacts.whatsapp}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-marsala hover:bg-marsala-dark text-white p-2 rounded-full transition-colors"
              >
                <MessageCircle size={20} />
              </a>
              <a 
                href={`https://instagram.com/${storeInfo.contacts.instagram}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-marsala hover:bg-marsala-dark text-white p-2 rounded-full transition-colors"
              >
                <Instagram size={20} />
              </a>
              {storeInfo.contacts.shopee && (
                <a 
                  href={`https://shopee.com.br/${storeInfo.contacts.shopee}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-marsala hover:bg-marsala-dark text-white p-2 rounded-full transition-colors"
                >
                  <ShoppingBag size={20} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-center">Login Administrativo</DialogTitle>
          <LoginForm onSuccess={() => setIsLoginOpen(false)} />
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
