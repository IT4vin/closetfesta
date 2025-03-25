
import React from "react";
import { Search } from "lucide-react";

const EmptyProducts: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-neutral-100 p-6 rounded-full mb-4">
        <Search size={32} className="text-neutral-400" />
      </div>
      <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
      <p className="text-neutral-500 max-w-md">
        Tente ajustar os filtros ou a busca para encontrar o que procura.
      </p>
    </div>
  );
};

export default EmptyProducts;
