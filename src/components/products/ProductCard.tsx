
import React from "react";
import { Edit, Trash, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface ProductCardProps {
  product: any;
  onEdit: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit }) => {
  return (
    <div className="premium-card overflow-hidden card-hover">
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
              : product.status === "rented"
              ? "bg-orange-100 text-orange-800"
              : "bg-red-100 text-red-800"
          }`}>
            {product.status === "available" ? "Disponível" : 
             product.status === "rented" ? "Alugado" : "Em Manutenção"}
          </span>
        </div>
        
        <div className="absolute bottom-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white text-neutral-700 hover:text-marsala">
                <Eye size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                <Edit size={16} className="mr-2" />
                <span>Editar</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-red-500">
                <Trash size={16} className="mr-2" />
                <span>Excluir</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-medium text-lg truncate">{product.name}</h3>
          <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded">
            {product.sku}
          </span>
        </div>
        
        <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm text-neutral-600">
            Tipo: <span className="font-medium">{product.type}</span>
            {product.subtype && <span> ({product.subtype})</span>}
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
  );
};

export default ProductCard;
