import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Product, Size } from '@/types';
import { toast } from 'sonner';

const ProductManagement = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useAppContext();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rentalPrice: 0,
    salePrice: null as number | null,
    sizes: [] as Size[],
    category: '',
    tags: [] as string[],
    featured: false,
    contactLinks: {
      whatsapp: '',
      instagram: '',
      shopee: ''
    }
  });

  const categories = ['Vestidos', 'Acessórios', 'Sapatos', 'Bolsas', 'Conjuntos'];
  const availableSizes: Size[] = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'único'];

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rentalPrice: 0,
      salePrice: null,
      sizes: [],
      category: '',
      tags: [],
      featured: false,
      contactLinks: {
        whatsapp: '',
        instagram: '',
        shopee: ''
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || formData.rentalPrice <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const productData = {
      ...formData,
      tags: formData.tags.filter(tag => tag.trim() !== ''),
      contactLinks: {
        whatsapp: formData.contactLinks.whatsapp || '',
        instagram: formData.contactLinks.instagram || '',
        shopee: formData.contactLinks.shopee || ''
      }
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        setEditingProduct(null);
        toast.success('Produto atualizado com sucesso!');
      } else {
        await addProduct(productData);
        setIsAddDialogOpen(false);
        toast.success('Produto criado com sucesso!');
      }
      
      resetForm();
    } catch (error: any) {
      toast.error(`Erro ao salvar produto: ${error.message}`);
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description,
      rentalPrice: product.rentalPrice,
      salePrice: product.salePrice,
      sizes: product.sizes,
      category: product.category,
      tags: product.tags || [],
      featured: product.featured || false,
      contactLinks: {
        whatsapp: product.contactLinks?.whatsapp || '',
        instagram: product.contactLinks?.instagram || '',
        shopee: product.contactLinks?.shopee || ''
      }
    });
    setEditingProduct(product);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteProduct(id);
        toast.success('Produto excluído com sucesso!');
      } catch (error: any) {
        toast.error(`Erro ao excluir produto: ${error.message}`);
      }
    }
  };

  const toggleSize = (size: Size) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-marsala">Gerenciamento de Produtos</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-marsala hover:bg-marsala-dark">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Produto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rentalPrice">Preço do Aluguel (R$) *</Label>
                  <Input
                    id="rentalPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.rentalPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, rentalPrice: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="salePrice">Preço de Venda (R$)</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salePrice || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      salePrice: e.target.value ? parseFloat(e.target.value) : null 
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label>Tamanhos Disponíveis</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableSizes.map(size => (
                    <label key={size} className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.sizes.includes(size)}
                        onCheckedChange={() => toggleSize(size)}
                      />
                      <span>{size}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: !!checked }))}
                  />
                  <span>Produto em Destaque</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-marsala hover:bg-marsala-dark">
                  Adicionar Produto
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewingProduct(product)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(product)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">R$ {product.rentalPrice.toFixed(2)}</span>
                  <Badge variant="secondary">{product.category}</Badge>
                </div>
                {product.featured && (
                  <Badge className="bg-marsala">Destaque</Badge>
                )}
                <div className="flex flex-wrap gap-1">
                  {product.sizes.map(size => (
                    <Badge key={size} variant="outline" className="text-xs">
                      {size}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de Edição */}
      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Produto: {editingProduct.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Nome do Produto *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingProduct(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-marsala hover:bg-marsala-dark">
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de Visualização */}
      {viewingProduct && (
        <Dialog open={!!viewingProduct} onOpenChange={() => setViewingProduct(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{viewingProduct.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">{viewingProduct.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Preço do Aluguel:</strong> R$ {viewingProduct.rentalPrice.toFixed(2)}
                </div>
                {viewingProduct.salePrice && (
                  <div>
                    <strong>Preço de Venda:</strong> R$ {viewingProduct.salePrice.toFixed(2)}
                  </div>
                )}
                <div>
                  <strong>Categoria:</strong> {viewingProduct.category}
                </div>
                <div>
                  <strong>Tamanhos:</strong> {viewingProduct.sizes.join(', ')}
                </div>
              </div>
              {viewingProduct.tags && viewingProduct.tags.length > 0 && (
                <div>
                  <strong>Tags:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewingProduct.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {viewingProduct.featured && (
                <Badge className="bg-marsala">Produto em Destaque</Badge>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ProductManagement;
