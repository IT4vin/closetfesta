
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Edit, Eye, CreditCard, Tag, CalendarDays } from "lucide-react";

interface ProductTableProps {
  products: any[];
  onEdit: (product: any) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ products, onEdit }) => {
  const navigate = useNavigate();
  
  return (
    <div className="overflow-x-auto premium-card">
      <table className="w-full">
        <thead>
          <tr className="bg-neutral-50">
            <th className="text-left p-4 font-medium">Produto</th>
            <th className="text-left p-4 font-medium">Categoria</th>
            <th className="text-left p-4 font-medium">Tamanho</th>
            <th className="text-left p-4 font-medium">Preço</th>
            <th className="text-left p-4 font-medium">Status</th>
            <th className="text-right p-4 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-t border-neutral-200 hover:bg-neutral-50">
              <td className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-md overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-neutral-500">{product.sku}</div>
                  </div>
                </div>
              </td>
              <td className="p-4">
                <div className="flex items-center space-x-1">
                  <Tag size={14} className="text-neutral-400" />
                  <span>{product.type}</span>
                </div>
              </td>
              <td className="p-4">{product.size}</td>
              <td className="p-4">
                <div className="flex items-center space-x-1">
                  <CreditCard size={14} className="text-marsala" />
                  <span>R$ {product.rentalPrice}</span>
                </div>
              </td>
              <td className="p-4">
                <span 
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    product.status === 'available' 
                      ? 'bg-green-100 text-green-800' 
                      : product.status === 'rented'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                  {product.status === 'available' 
                    ? 'Disponível' 
                    : product.status === 'rented'
                    ? 'Alugado'
                    : 'Manutenção'}
                </span>
              </td>
              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <Eye size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onEdit(product)}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="text-marsala"
                  >
                    <CalendarDays size={16} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
