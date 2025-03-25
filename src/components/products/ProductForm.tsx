
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Upload, Image, Plus } from "lucide-react";

interface ProductFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialData || {
    name: "",
    type: "",
    subtype: "",
    description: "",
    price: "",
    rentalPrice: "",
    status: "available",
    size: "",
    color: "",
    images: []
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = "O nome do produto é obrigatório";
    if (!formData.type) newErrors.type = "A categoria é obrigatória";
    if (!formData.rentalPrice) newErrors.rentalPrice = "O preço de aluguel é obrigatório";
    if (!formData.size) newErrors.size = "O tamanho é obrigatório";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Generate SKU if not present
    if (!formData.sku) {
      const typePrefix = formData.type === "Vestido" ? "VEST" : 
                          formData.type === "Terno" ? "TERN" : "ACES";
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      formData.sku = `${typePrefix}-${randomSuffix}`;
    }
    
    // Add date if new product
    if (!formData.dateAdded) {
      formData.dateAdded = new Date().toISOString().split('T')[0];
    }
    
    onSubmit(formData);
  };
  
  // Handle image upload (mock)
  const handleImageUpload = () => {
    // In a real app, this would handle actual file uploads
    const mockImageUrl = "https://images.unsplash.com/photo-1566174053879-31528523f8c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80";
    
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), mockImageUrl]
    }));
  };
  
  // Remove image
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_: any, i: number) => i !== index)
    }));
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Basic info */}
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-600 mb-1">
              Nome do Produto*
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>
          
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-neutral-600 mb-1">
              Categoria*
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange as any}
              className={`input-field w-full ${errors.type ? "border-red-500" : ""}`}
            >
              <option value="">Selecione uma categoria</option>
              <option value="Vestido">Vestido</option>
              <option value="Terno">Terno</option>
              <option value="Acessório">Acessório</option>
            </select>
            {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type}</p>}
          </div>
          
          <div>
            <label htmlFor="subtype" className="block text-sm font-medium text-neutral-600 mb-1">
              Subcategoria
            </label>
            <select
              id="subtype"
              name="subtype"
              value={formData.subtype}
              onChange={handleChange as any}
              className="input-field w-full"
            >
              <option value="">Selecione uma subcategoria</option>
              {formData.type === "Vestido" && (
                <>
                  <option value="Noiva">Noiva</option>
                  <option value="Madrinha">Madrinha</option>
                  <option value="Festa">Festa</option>
                  <option value="Debutante">Debutante</option>
                </>
              )}
              {formData.type === "Terno" && (
                <>
                  <option value="Social">Social</option>
                  <option value="Smoking">Smoking</option>
                  <option value="Slim">Slim</option>
                </>
              )}
              {formData.type === "Acessório" && (
                <>
                  <option value="Gravata">Gravata</option>
                  <option value="Tiara">Tiara</option>
                  <option value="Joias">Joias</option>
                </>
              )}
            </select>
          </div>
          
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-neutral-600 mb-1">
              Código SKU
            </label>
            <Input
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              placeholder="Gerado automaticamente"
              disabled={initialData?.sku}
            />
            <p className="text-xs text-neutral-500 mt-1">
              Será gerado automaticamente se deixado em branco
            </p>
          </div>
        </div>
        
        {/* Middle column - Pricing and sizing */}
        <div className="space-y-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-neutral-600 mb-1">
              Preço de Venda (R$)
            </label>
            <Input
              id="price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
          </div>
          
          <div>
            <label htmlFor="rentalPrice" className="block text-sm font-medium text-neutral-600 mb-1">
              Preço de Aluguel (R$)*
            </label>
            <Input
              id="rentalPrice"
              name="rentalPrice"
              type="number"
              value={formData.rentalPrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={errors.rentalPrice ? "border-red-500" : ""}
            />
            {errors.rentalPrice && <p className="text-sm text-red-500 mt-1">{errors.rentalPrice}</p>}
          </div>
          
          <div>
            <label htmlFor="size" className="block text-sm font-medium text-neutral-600 mb-1">
              Tamanho*
            </label>
            <Input
              id="size"
              name="size"
              value={formData.size}
              onChange={handleChange}
              className={errors.size ? "border-red-500" : ""}
            />
            {errors.size && <p className="text-sm text-red-500 mt-1">{errors.size}</p>}
          </div>
          
          <div>
            <label htmlFor="color" className="block text-sm font-medium text-neutral-600 mb-1">
              Cor
            </label>
            <Input
              id="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-neutral-600 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange as any}
              className="input-field w-full"
            >
              <option value="available">Disponível</option>
              <option value="rented">Alugado</option>
              <option value="maintenance">Em Manutenção</option>
            </select>
          </div>
        </div>
        
        {/* Right column - Description and images */}
        <div className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-neutral-600 mb-1">
              Descrição detalhada
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="input-field w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Imagens do Produto
            </label>
            <div className="border-2 border-dashed border-neutral-300 rounded-md p-6 text-center cursor-pointer hover:bg-neutral-50 transition-colors" onClick={handleImageUpload}>
              <div className="flex flex-col items-center">
                <Upload className="h-12 w-12 text-neutral-400 mb-2" />
                <p className="text-sm font-medium text-neutral-700">Clique para fazer upload</p>
                <p className="text-xs text-neutral-500 mt-1">Ou arraste e solte imagens aqui</p>
                <p className="text-xs text-neutral-500 mt-1">PNG, JPG até 5MB</p>
              </div>
            </div>
            
            {/* Image previews */}
            {formData.images && formData.images.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {formData.images.map((img: string, index: number) => (
                  <div key={index} className="relative">
                    <img src={img} alt="Preview" className="w-full h-24 object-cover rounded-md" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-black bg-opacity-50 text-white p-1 rounded-full"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="border-t border-neutral-200 pt-6 flex justify-end gap-3">
        <Button 
          type="button" 
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          className="bg-marsala hover:bg-marsala/90 text-white"
        >
          {initialData ? 'Atualizar Produto' : 'Salvar Produto'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
