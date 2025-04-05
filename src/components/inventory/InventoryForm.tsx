
import React, { useState, useEffect } from "react";
import { useProducts, Product } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface InventoryFormProps {
  product: Product | null;
  onClose: () => void;
}

const InventoryForm: React.FC<InventoryFormProps> = ({ product, onClose }) => {
  const { handleFormSubmit } = useProducts();
  const { toast } = useToast();
  
  // Estado inicial para o formulário
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    type: "",
    subtype: "",
    price: 0,
    rentalPrice: 0,
    image: "",
    status: "available",
    size: "",
    color: "",
    sku: "",
  });
  
  // Carregar dados do produto quando em modo de edição
  useEffect(() => {
    if (product) {
      setFormData({ ...product });
    }
  }, [product]);
  
  // Manipular mudanças no formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "price" || name === "rentalPrice" ? parseFloat(value) : value
    }));
  };
  
  // Manipular alterações em selects
  const handleSelectChange = (value: string, field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Enviar o formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.sku || !formData.type) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    // Enviar os dados para o hook de produtos
    handleFormSubmit(formData);
    toast({
      title: product ? "Produto atualizado" : "Produto adicionado",
      description: `${formData.name} foi ${product ? "atualizado" : "adicionado"} com sucesso`,
    });
    
    onClose();
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Produto *</Label>
          <Input 
            id="name" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="sku">SKU (Código) *</Label>
          <Input 
            id="sku" 
            name="sku" 
            value={formData.sku} 
            onChange={handleChange} 
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="type">Tipo *</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => handleSelectChange(value, "type")}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Vestido">Vestido</SelectItem>
              <SelectItem value="Terno">Terno</SelectItem>
              <SelectItem value="Acessório">Acessório</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="subtype">Subtipo</Label>
          <Input 
            id="subtype" 
            name="subtype" 
            value={formData.subtype} 
            onChange={handleChange} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="price">Preço de Venda (R$)</Label>
          <Input 
            id="price" 
            name="price" 
            type="number" 
            min="0" 
            step="0.01" 
            value={formData.price} 
            onChange={handleChange} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="rentalPrice">Preço de Aluguel (R$)</Label>
          <Input 
            id="rentalPrice" 
            name="rentalPrice" 
            type="number" 
            min="0" 
            step="0.01" 
            value={formData.rentalPrice} 
            onChange={handleChange} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="size">Tamanho</Label>
          <Input 
            id="size" 
            name="size" 
            value={formData.size} 
            onChange={handleChange} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="color">Cor</Label>
          <Input 
            id="color" 
            name="color" 
            value={formData.color} 
            onChange={handleChange} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => handleSelectChange(value, "status")}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Disponível</SelectItem>
              <SelectItem value="rented">Alugado</SelectItem>
              <SelectItem value="maintenance">Em Manutenção</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="image">URL da Imagem</Label>
          <Input 
            id="image" 
            name="image" 
            type="url" 
            value={formData.image} 
            onChange={handleChange} 
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea 
          id="description" 
          name="description" 
          rows={3} 
          value={formData.description} 
          onChange={handleChange} 
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
        <Button type="submit" className="bg-marsala hover:bg-marsala-700">Salvar</Button>
      </div>
    </form>
  );
};

export default InventoryForm;
