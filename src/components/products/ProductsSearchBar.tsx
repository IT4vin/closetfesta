
import React from "react";
import { Search } from "lucide-react";

interface ProductsSearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const ProductsSearchBar: React.FC<ProductsSearchBarProps> = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
      <input 
        type="text" 
        placeholder="Buscar produtos por nome, código ou categoria..." 
        className="input-field pl-10 w-full"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};

export default ProductsSearchBar;
