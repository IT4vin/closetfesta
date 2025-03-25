
import React from "react";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash, Eye } from "lucide-react";

interface ProductTableProps {
  products: any[];
  onEdit: (product: any) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ products, onEdit }) => {
  return (
    <div className="premium-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Imagem</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Tamanho</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aluguel</TableHead>
            <TableHead className="text-right">Venda</TableHead>
            <TableHead className="text-right w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="hover:bg-neutral-50 transition-colors">
              <TableCell>
                <div className="h-12 w-12 rounded-md overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="h-full w-full object-cover" 
                  />
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-xs text-neutral-500">{product.sku}</div>
                </div>
              </TableCell>
              <TableCell>
                {product.type}
                {product.subtype && <span className="text-xs text-neutral-500"> ({product.subtype})</span>}
              </TableCell>
              <TableCell>{product.size}</TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell className="text-right font-medium text-marsala">
                R$ {product.rentalPrice.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-medium">
                R$ {product.price.toFixed(2)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => onEdit(product)}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductTable;
