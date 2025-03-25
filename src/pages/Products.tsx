
import React from "react";
import MainLayout from "../components/layout/MainLayout";
import { Search, Plus, Filter, Grid, List } from "lucide-react";

// In a real app, this would come from an API/database
const products = [
  {
    id: 1,
    name: "Vestido de Noiva Elegance",
    description: "Vestido longo de cetim com bordados",
    type: "Vestido",
    price: 1200,
    rentalPrice: 300,
    image: "https://images.unsplash.com/photo-1594552072238-5b1076134e85?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    status: "available",
    size: "M",
  },
  {
    id: 2,
    name: "Terno Preto Classic",
    description: "Terno preto em lã fria",
    type: "Terno",
    price: 900,
    rentalPrice: 180,
    image: "https://images.unsplash.com/photo-1598808503746-f34c53b9323e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    status: "rented",
    size: "42",
  },
  {
    id: 3,
    name: "Vestido Madrinha Rose",
    description: "Vestido longo em chiffon",
    type: "Vestido",
    price: 850,
    rentalPrice: 150,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    status: "available",
    size: "G",
  },
  {
    id: 4,
    name: "Smoking Azul Marinho",
    description: "Smoking em lã premium",
    type: "Terno",
    price: 1100,
    rentalPrice: 220,
    image: "https://images.unsplash.com/photo-1592878849122-facb97520f9e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    status: "available",
    size: "44",
  },
  {
    id: 5,
    name: "Vestido de Festa Dourado",
    description: "Vestido curto com paetês",
    type: "Vestido",
    price: 780,
    rentalPrice: 140,
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    status: "available",
    size: "P",
  },
  {
    id: 6,
    name: "Terno Cinza Slim",
    description: "Terno slim fit em cinza",
    type: "Terno",
    price: 920,
    rentalPrice: 170,
    image: "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    status: "rented",
    size: "40",
  },
];

const ProductsPage = () => {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  
  return (
    <MainLayout>
      <div className="page-transition">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Produtos</h1>
            <p className="text-neutral-500">Gerencie seus vestidos, ternos e acessórios</p>
          </div>
          
          <div className="flex gap-3">
            <button className="secondary-button">
              <Filter size={18} />
              <span>Filtrar</span>
            </button>
            <button className="primary-button">
              <Plus size={18} />
              <span>Novo Produto</span>
            </button>
          </div>
        </header>
        
        <div className="premium-card mb-8 p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar produtos..." 
                className="input-field pl-10"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-l-md border border-r-0 ${
                    viewMode === "grid" 
                      ? "bg-marsala text-white border-marsala" 
                      : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-r-md border ${
                    viewMode === "list" 
                      ? "bg-marsala text-white border-marsala" 
                      : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
              
              <select className="input-field">
                <option>Todos os tipos</option>
                <option>Vestidos</option>
                <option>Ternos</option>
                <option>Acessórios</option>
              </select>
              
              <select className="input-field">
                <option>Todos os status</option>
                <option>Disponível</option>
                <option>Alugado</option>
                <option>Em manutenção</option>
              </select>
            </div>
          </div>
        </div>
        
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div 
                key={product.id}
                className="premium-card overflow-hidden card-hover"
              >
                <div className="relative h-64 overflow-hidden bg-neutral-100">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-3 right-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      product.status === "available" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-orange-100 text-orange-800"
                    }`}>
                      {product.status === "available" ? "Disponível" : "Alugado"}
                    </span>
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="font-medium text-lg mb-1 truncate">{product.name}</h3>
                  <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-sm text-neutral-600">
                      Tipo: <span className="font-medium">{product.type}</span>
                    </div>
                    <div className="text-sm text-neutral-600">
                      Tamanho: <span className="font-medium">{product.size}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between border-t border-neutral-100 pt-3">
                    <div>
                      <p className="text-xs text-neutral-500">Aluguel</p>
                      <p className="font-medium text-marsala">R$ {product.rentalPrice.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-neutral-500">Venda</p>
                      <p className="font-medium">R$ {product.price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="premium-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Produto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Tamanho</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Aluguel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Venda</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-md overflow-hidden mr-3">
                          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-neutral-500 line-clamp-1">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{product.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{product.size}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        product.status === "available" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-orange-100 text-orange-800"
                      }`}>
                        {product.status === "available" ? "Disponível" : "Alugado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-marsala">
                      R$ {product.rentalPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      R$ {product.price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ProductsPage;
