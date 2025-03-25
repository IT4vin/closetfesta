
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import BasicInfoForm from "./product-form/BasicInfoForm";
import PricingForm from "./product-form/PricingForm";
import DetailsForm from "./product-form/DetailsForm";

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
        <BasicInfoForm 
          formData={formData} 
          errors={errors} 
          handleChange={handleChange} 
        />
        
        {/* Middle column - Pricing and sizing */}
        <PricingForm 
          formData={formData} 
          errors={errors} 
          handleChange={handleChange} 
        />
        
        {/* Right column - Description and images */}
        <DetailsForm 
          formData={formData} 
          handleChange={handleChange} 
          handleImageUpload={handleImageUpload}
          removeImage={removeImage}
        />
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
