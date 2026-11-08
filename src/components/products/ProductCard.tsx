
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CreditCard, Eye, Edit, Tag, Clock3 } from "lucide-react";

interface ProductCardProps {
  product: any;
  onEdit: () => void;
  onHistory: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onHistory }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/products/${product.id}`);
  };
  
  return (
    <div className="premium-card overflow-hidden">
      <div className="relative">
        <div 
          className="h-48 bg-center bg-cover" 
          style={{ backgroundImage: `url(${product.image})` }}
        />
        
        <span 
          className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${
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
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-medium text-lg truncate">{product.name}</h3>
            <p className="text-neutral-500 text-sm">{product.sku}</p>
          </div>
          <div>
            <span className="inline-flex items-center gap-1 text-sm text-neutral-500">
              <Tag size={14} />
              {product.type}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="text-sm">
            <p className="text-neutral-500">Tamanho</p>
            <p>{product.size}</p>
          </div>
          <div className="text-sm">
            <p className="text-neutral-500">Cor</p>
            <p>{product.color}</p>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-neutral-500">Valor</p>
            <div className="flex items-center gap-1">
              <CreditCard size={16} className="text-marsala" />
              <p className="font-medium">R$ {product.rentalPrice}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-neutral-500">Adicionado em</p>
            <p className="text-sm">{product.created_at ? new Date(product.created_at).toLocaleDateString("pt-BR") : "—"}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="flex-1"
          >
            <Edit size={16} className="mr-1" />
            <span>Editar</span>
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            title={"Histórico de locações de " + product.name}
            aria-label={"Histórico de locações de " + product.name}
            onClick={(e) => { e.stopPropagation(); onHistory(); }}
            className="shrink-0 border-marsala-200 text-marsala-800 hover:bg-marsala-50"
          >
            <Clock3 size={17} />
          </Button>

          <Button 
            className="flex-1 bg-marsala hover:bg-marsala-700"
            onClick={handleClick}
          >
            <Eye size={16} className="mr-1" />
            <span>Ver ficha</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
