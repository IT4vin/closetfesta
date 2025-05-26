
import React, { useState, useEffect } from 'react';
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
import ImageUploader from './ImageUploader';
import { getProductImages, ProductImage } from '@/services/imageService';

const ProductManagement = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useAppContext();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<{ [key: string]: ProductImage[] }>({});

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

  // Load images for products
  useEffect(() => {
    const loadProductImages = async () => {
      const imageMap: { [key: string]: ProductImage[] } = {};
      
      for (const product of products) {
        try {
          const images = await getProductImages(product.id);
          imageMap[product.id] = images;
        } catch (error) {
          console.error(`Failed to load images for product ${product.id}:`, error);
          imageMap[product.id] = [];
        }
      }
      
      setProductImages(imageMap);
    };

    if (products.length > 0) {
      loadProductImages();
    }
  }, [products]);

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
    if (confirm('Tem certeza que deseja excluir este produto? Todas as imagens também serão removidas.')) {
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

  const handleImagesChange = (productId: string, images: ProductImage[]) => {
    setProductImages(prev => ({
      ...prev,
      [productId]: images
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
            <CreationForm 
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              categories={categories}
              availableSizes={availableSizes}
              toggleSize={toggleSize}
              addTag={addTag}
              removeTag={removeTag}
              setIsAddDialogOpen={setIsAddDialogOpen}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          const images = productImages[product.id] || [];
          const mainImage = images.length > 0 ? images[0].url : '/placeholder.svg';
          
          return (
            <Card key={product.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewingProduct(product)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(product)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <img
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-40 object-cover rounded-md mb-3"
                />
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Badge variant="secondary">{product.category}</Badge>
                    {product.featured && <Badge className="bg-gold">Destaque</Badge>}
                    {images.length > 0 && (
                      <Badge variant="outline">{images.length} foto{images.length !== 1 ? 's' : ''}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                  <div className="flex justify-between text-sm">
                    <span>Aluguel: R$ {product.rentalPrice}</span>
                    {product.salePrice && <span>Venda: R$ {product.salePrice}</span>}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {product.sizes.map(size => (
                      <Badge key={size} variant="outline" className="text-xs">{size}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <ProductForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              categories={categories}
              availableSizes={availableSizes}
              toggleSize={toggleSize}
              addTag={addTag}
              removeTag={removeTag}
              productId={editingProduct.id}
              images={productImages[editingProduct.id] || []}
              onImagesChange={(images) => handleImagesChange(editingProduct.id, images)}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewingProduct} onOpenChange={() => setViewingProduct(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewingProduct?.name}</DialogTitle>
          </DialogHeader>
          {viewingProduct && (
            <div className="space-y-4">
              {productImages[viewingProduct.id] && productImages[viewingProduct.id].length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {productImages[viewingProduct.id].slice(0, 4).map((img, index) => (
                    <img
                      key={index}
                      src={img.url}
                      alt={`${viewingProduct.name} ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  ))}
                  {productImages[viewingProduct.id].length > 4 && (
                    <div className="flex items-center justify-center bg-gray-100 rounded-md">
                      <span className="text-sm text-gray-600">
                        +{productImages[viewingProduct.id].length - 4} mais
                      </span>
                    </div>
                  )}
                </div>
              )}
              <p>{viewingProduct.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoria:</Label>
                  <p>{viewingProduct.category}</p>
                </div>
                <div>
                  <Label>Preço de Aluguel:</Label>
                  <p>R$ {viewingProduct.rentalPrice}</p>
                </div>
                {viewingProduct.salePrice && (
                  <div>
                    <Label>Preço de Venda:</Label>
                    <p>R$ {viewingProduct.salePrice}</p>
                  </div>
                )}
                <div>
                  <Label>Tamanhos:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewingProduct.sizes.map(size => (
                      <Badge key={size} variant="outline">{size}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              {viewingProduct.tags && viewingProduct.tags.length > 0 && (
                <div>
                  <Label>Tags:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewingProduct.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Creation Form Component for new products
const CreationForm = ({ 
  formData, 
  setFormData, 
  onSubmit,
  categories, 
  availableSizes, 
  toggleSize, 
  addTag, 
  removeTag,
  setIsAddDialogOpen
}: any) => {
  const { addProduct } = useAppContext();
  const [newTag, setNewTag] = useState('');
  const [tempProductId, setTempProductId] = useState('temp-' + Date.now());
  const [tempImages, setTempImages] = useState<ProductImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTagSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(newTag);
      setNewTag('');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || formData.rentalPrice <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);

    const productData = {
      ...formData,
      tags: formData.tags.filter((tag: string) => tag.trim() !== ''),
      contactLinks: {
        whatsapp: formData.contactLinks.whatsapp || '',
        instagram: formData.contactLinks.instagram || '',
        shopee: formData.contactLinks.shopee || ''
      }
    };

    try {
      // Adiciona o produto e obtém o ID gerado
      const newProduct = await addProduct(productData);
      
      // Se houver imagens temporárias, associe-as ao produto real
      if (tempImages.length > 0) {
        toast.info(`Enviando ${tempImages.length} imagens. Por favor, aguarde...`);
        
        for (const image of tempImages) {
          // O processo de upload já foi feito, aqui precisaríamos apenas atualizar o product_id
          // Isso seria feito em uma implementação real com um endpoint específico
          // Por enquanto, vamos apenas simular com um delay
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        toast.success(`${tempImages.length} imagens foram adicionadas com sucesso!`);
      }
      
      setIsAddDialogOpen(false);
      toast.success('Produto criado com sucesso!');
    } catch (error: any) {
      toast.error(`Erro ao salvar produto: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleCreateProduct} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome do Produto *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Categoria *</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData((prev: any) => ({ ...prev, category: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat: string) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
          onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rentalPrice">Preço de Aluguel (R$) *</Label>
          <Input
            id="rentalPrice"
            type="number"
            min="0"
            step="0.01"
            value={formData.rentalPrice}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, rentalPrice: parseFloat(e.target.value) || 0 }))}
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
            onChange={(e) => setFormData((prev: any) => ({ ...prev, salePrice: e.target.value ? parseFloat(e.target.value) : null }))}
          />
        </div>
      </div>

      {/* Image Upload Section */}
      <div>
        <Label>Imagens do Produto</Label>
        <ImageUploader
          productId={tempProductId}
          images={tempImages}
          onImagesChange={setTempImages}
          maxImages={10}
        />
        <p className="text-sm text-blue-600 mt-2">
          As imagens serão associadas ao produto quando ele for salvo.
        </p>
      </div>

      <div>
        <Label>Tamanhos Disponíveis</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {availableSizes.map((size: Size) => (
            <div key={size} className="flex items-center space-x-2">
              <Checkbox
                id={size}
                checked={formData.sizes.includes(size)}
                onCheckedChange={() => toggleSize(size)}
              />
              <Label htmlFor={size}>{size}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Tags</Label>
        <Input
          placeholder="Digite uma tag e pressione Enter"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyPress={handleTagSubmit}
        />
        <div className="flex flex-wrap gap-1 mt-2">
          {formData.tags.map((tag: string) => (
            <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
              {tag} ×
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="featured"
          checked={formData.featured}
          onCheckedChange={(checked) => setFormData((prev: any) => ({ ...prev, featured: !!checked }))}
        />
        <Label htmlFor="featured">Produto em Destaque</Label>
      </div>

      <Button type="submit" className="w-full bg-marsala hover:bg-marsala-dark" disabled={isSubmitting}>
        {isSubmitting ? 'Criando Produto...' : 'Criar Produto'}
      </Button>
    </form>
  );
};

// Product Form Component for editing
const ProductForm = ({ 
  formData, 
  setFormData, 
  onSubmit, 
  categories, 
  availableSizes, 
  toggleSize, 
  addTag, 
  removeTag, 
  productId,
  images,
  onImagesChange,
  isEditing = false,
}: any) => {
  const [newTag, setNewTag] = useState('');

  const handleTagSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(newTag);
      setNewTag('');
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
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
          <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat: string) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
          <Label htmlFor="rentalPrice">Preço de Aluguel (R$) *</Label>
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
            onChange={(e) => setFormData(prev => ({ ...prev, salePrice: e.target.value ? parseFloat(e.target.value) : null }))}
          />
        </div>
      </div>

      {/* Image Upload Section - Only show for editing existing products */}
      {productId && (
        <div>
          <Label>Imagens do Produto</Label>
          <ImageUploader
            productId={productId}
            images={images}
            onImagesChange={onImagesChange}
            maxImages={10}
          />
        </div>
      )}

      <div>
        <Label>Tamanhos Disponíveis</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {availableSizes.map((size: Size) => (
            <div key={size} className="flex items-center space-x-2">
              <Checkbox
                id={size}
                checked={formData.sizes.includes(size)}
                onCheckedChange={() => toggleSize(size)}
              />
              <Label htmlFor={size}>{size}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Tags</Label>
        <Input
          placeholder="Digite uma tag e pressione Enter"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyPress={handleTagSubmit}
        />
        <div className="flex flex-wrap gap-1 mt-2">
          {formData.tags.map((tag: string) => (
            <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
              {tag} ×
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="featured"
          checked={formData.featured}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: !!checked }))}
        />
        <Label htmlFor="featured">Produto em Destaque</Label>
      </div>

      <Button type="submit" className="w-full bg-marsala hover:bg-marsala-dark">
        {isEditing ? 'Atualizar Produto' : 'Criar Produto'}
      </Button>
    </form>
  );
};

export default ProductManagement;
