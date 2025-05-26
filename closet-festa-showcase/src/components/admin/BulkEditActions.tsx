
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit } from 'lucide-react';
import { Product } from '@/types';

interface BulkEditActionsProps {
  selectedCount: number;
  onBulkEdit: (field: keyof Product, value: any) => void;
}

const BulkEditActions: React.FC<BulkEditActionsProps> = ({ selectedCount, onBulkEdit }) => {
  const [bulkField, setBulkField] = useState<keyof Product>('category');
  const [bulkValue, setBulkValue] = useState<string>('');
  const [bulkFeatured, setBulkFeatured] = useState<boolean>(false);

  const categories = ['Vestidos', 'Acessórios', 'Sapatos', 'Bolsas', 'Conjuntos'];

  const handleBulkUpdate = () => {
    let value: any = bulkValue;

    switch (bulkField) {
      case 'rentalPrice':
      case 'salePrice':
        value = parseFloat(bulkValue) || 0;
        break;
      case 'featured':
        value = bulkFeatured;
        break;
      case 'tags':
        value = bulkValue.split(',').map(tag => tag.trim()).filter(tag => tag);
        break;
    }

    onBulkEdit(bulkField, value);
    setBulkValue('');
    setBulkFeatured(false);
  };

  const renderValueInput = () => {
    switch (bulkField) {
      case 'category':
        return (
          <Select value={bulkValue} onValueChange={setBulkValue}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'featured':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={bulkFeatured}
              onCheckedChange={(checked) => setBulkFeatured(!!checked)}
            />
            <span>Produto em Destaque</span>
          </div>
        );
      
      case 'rentalPrice':
      case 'salePrice':
        return (
          <Input
            type="number"
            placeholder="Preço"
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
            className="w-32"
          />
        );
      
      default:
        return (
          <Input
            placeholder="Valor"
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
            className="w-40"
          />
        );
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Edit className="w-5 h-5" />
          Edição em Massa ({selectedCount} produtos selecionados)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <Select value={bulkField} onValueChange={(value) => setBulkField(value as keyof Product)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category">Categoria</SelectItem>
                <SelectItem value="rentalPrice">Preço Aluguel</SelectItem>
                <SelectItem value="salePrice">Preço Venda</SelectItem>
                <SelectItem value="featured">Destaque</SelectItem>
                <SelectItem value="description">Descrição</SelectItem>
                <SelectItem value="tags">Tags</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            {renderValueInput()}
          </div>
          
          <Button 
            onClick={handleBulkUpdate}
            disabled={!bulkValue && bulkField !== 'featured'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Aplicar a {selectedCount} produtos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkEditActions;
