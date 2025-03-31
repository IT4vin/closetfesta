
import React from "react";
import { CreditCard } from "lucide-react";

interface TopProduct {
  id: string;
  name: string;
  type: string;
  image: string;
  rentalCount: number;
  revenue: string;
}

const TopProducts = () => {
  // Dados de exemplo (seriam substituídos por dados reais do backend)
  const products: TopProduct[] = [
    {
      id: "1",
      name: "Vestido de Noiva Clássico",
      type: "Vestido",
      image: "https://images.unsplash.com/photo-1566174053879-31528523f8c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      rentalCount: 12,
      revenue: "R$ 3.600"
    },
    {
      id: "2",
      name: "Smoking Preto",
      type: "Terno",
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      rentalCount: 10,
      revenue: "R$ 2.950"
    },
    {
      id: "3",
      name: "Vestido de Festa Azul",
      type: "Vestido",
      image: "https://images.unsplash.com/photo-1571513722275-4b41940f54b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      rentalCount: 8,
      revenue: "R$ 2.400"
    },
    {
      id: "4",
      name: "Terno Slim Cinza",
      type: "Terno",
      image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      rentalCount: 7,
      revenue: "R$ 1.890"
    }
  ];

  return (
    <div className="premium-card overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold">Produtos Mais Alugados</h2>
      </div>
      
      <div className="divide-y divide-gray-100">
        {products.map((product) => (
          <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-md overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium truncate">{product.name}</h3>
                <p className="text-gray-500 text-sm">{product.type}</p>
              </div>
              
              <div className="text-right">
                <div className="font-medium">{product.rentalCount} aluguéis</div>
                <div className="flex items-center justify-end text-sm text-marsala">
                  <CreditCard size={14} className="mr-1" />
                  <span>{product.revenue}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopProducts;
