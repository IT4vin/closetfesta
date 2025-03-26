
import React from "react";
import { Search } from "lucide-react";

interface EmptyProductsProps {
  filtered?: boolean;
}

const EmptyProducts: React.FC<EmptyProductsProps> = ({ filtered = false }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="bg-neutral-100 p-6 rounded-full mb-4">
        <Search size={32} className="text-neutral-400" />
      </div>
      <h3 className="text-lg font-medium mb-2">
        {filtered 
          ? "Nenhum produto corresponde aos filtros" 
          : "Nenhum produto encontrado"}
      </h3>
      <p className="text-neutral-500 max-w-md mx-auto">
        {filtered 
          ? "Tente ajustar os filtros ou a busca para encontrar o que procura."
          : "Adicione seu primeiro produto clicando no botão '+ Novo Produto'."}
      </p>
    </div>
  );
};

export default EmptyProducts;
