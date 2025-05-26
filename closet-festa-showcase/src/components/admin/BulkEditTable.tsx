
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Product, Size } from '@/types';

interface BulkEditTableProps {
  products: Product[];
  selectedProducts: string[];
  onProductUpdate: (productId: string, field: keyof Product, value: any) => void;
  onSelectProduct: (productId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
}

const BulkEditTable: React.FC<BulkEditTableProps> = ({
  products,
  selectedProducts,
  onProductUpdate,
  onSelectProduct,
  onSelectAll
}) => {
  const categories = ['Vestidos', 'Acessórios', 'Sapatos', 'Bolsas', 'Conjuntos'];
  const availableSizes: Size[] = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'único'];

  const allSelected = products.length > 0 && products.every(p => selectedProducts.includes(p.id));
  const someSelected = products.some(p => selectedProducts.includes(p.id));

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected && !allSelected}
                onCheckedChange={(checked) => onSelectAll(!!checked)}
              />
            </TableHead>
            <TableHead className="min-w-[200px]">Nome</TableHead>
            <TableHead className="min-w-[250px]">Descrição</TableHead>
            <TableHead className="min-w-[120px]">Categoria</TableHead>
            <TableHead className="min-w-[100px]">Preço Aluguel</TableHead>
            <TableHead className="min-w-[100px]">Preço Venda</TableHead>
            <TableHead className="min-w-[150px]">Tamanhos</TableHead>
            <TableHead className="min-w-[100px]">Destaque</TableHead>
            <TableHead className="min-w-[200px]">Tags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className={selectedProducts.includes(product.id) ? 'bg-blue-50' : ''}>
              <TableCell>
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={(checked) => onSelectProduct(product.id, !!checked)}
                />
              </TableCell>
              
              <TableCell>
                <Input
                  value={product.name}
                  onChange={(e) => onProductUpdate(product.id, 'name', e.target.value)}
                  className="border-0 bg-transparent p-1 focus:bg-white focus:border focus:border-blue-300"
                />
              </TableCell>
              
              <TableCell>
                <Input
                  value={product.description || ''}
                  onChange={(e) => onProductUpdate(product.id, 'description', e.target.value)}
                  className="border-0 bg-transparent p-1 focus:bg-white focus:border focus:border-blue-300"
                />
              </TableCell>
              
              <TableCell>
                <Select
                  value={product.category || ''}
                  onValueChange={(value) => onProductUpdate(product.id, 'category', value)}
                >
                  <SelectTrigger className="border-0 bg-transparent p-1 focus:bg-white focus:border focus:border-blue-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              
              <TableCell>
                <Input
                  type="number"
                  value={product.rentalPrice || ''}
                  onChange={(e) => onProductUpdate(product.id, 'rentalPrice', parseFloat(e.target.value) || 0)}
                  className="border-0 bg-transparent p-1 focus:bg-white focus:border focus:border-blue-300"
                />
              </TableCell>
              
              <TableCell>
                <Input
                  type="number"
                  value={product.salePrice || ''}
                  onChange={(e) => onProductUpdate(product.id, 'salePrice', e.target.value ? parseFloat(e.target.value) : null)}
                  className="border-0 bg-transparent p-1 focus:bg-white focus:border focus:border-blue-300"
                />
              </TableCell>
              
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {availableSizes.map((size) => (
                    <Badge
                      key={size}
                      variant={product.sizes.includes(size) ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() => {
                        const newSizes = product.sizes.includes(size)
                          ? product.sizes.filter(s => s !== size)
                          : [...product.sizes, size];
                        onProductUpdate(product.id, 'sizes', newSizes);
                      }}
                    >
                      {size}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              
              <TableCell>
                <Checkbox
                  checked={product.featured || false}
                  onCheckedChange={(checked) => onProductUpdate(product.id, 'featured', !!checked)}
                />
              </TableCell>
              
              <TableCell>
                <Input
                  value={(product.tags || []).join(', ')}
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                    onProductUpdate(product.id, 'tags', tags);
                  }}
                  placeholder="tag1, tag2, tag3"
                  className="border-0 bg-transparent p-1 focus:bg-white focus:border focus:border-blue-300"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BulkEditTable;
