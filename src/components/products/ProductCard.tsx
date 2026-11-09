
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, Calendar, Edit, Tag, Maximize2 } from "lucide-react";

interface ProductCardProps {
  product: any;
  onEdit: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit }) => {
  const navigate = useNavigate();
  const [photoOpen, setPhotoOpen] = React.useState(false);
  
  const handleClick = () => {
    navigate(`/products/${product.id}`);
  };
  
  return (
    <div className="premium-card overflow-hidden">
      <div className="relative h-80 sm:h-[360px] lg:h-[400px] bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
        {product.image ? (
          <button
            type="button"
            className="group relative block h-full w-full p-2 sm:p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-marsala"
            onClick={() => setPhotoOpen(true)}
            aria-label={`Ampliar foto de ${product.name}`}
            title="Clique para ampliar a imagem"
          >
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-contain object-center transition-transform duration-200 group-hover:scale-[1.02]"
            />
            <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-neutral-700 shadow-sm opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Maximize2 size={13} /> Ampliar
            </span>
          </button>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            Foto não cadastrada
          </div>
        )}
        
        <span 
          className={`pointer-events-none absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${
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
            <p className="text-sm">{product.dateAdded}</p>
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
            className="flex-1 bg-marsala hover:bg-marsala-700"
            onClick={handleClick}
          >
            <Calendar size={16} className="mr-1" />
            <span>Alugar</span>
          </Button>
        </div>
      </div>
      <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{product.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center rounded-lg bg-neutral-50 dark:bg-neutral-900">
            <img
              src={product.image}
              alt={`Foto completa de ${product.name}`}
              className="max-h-[78vh] w-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductCard;
