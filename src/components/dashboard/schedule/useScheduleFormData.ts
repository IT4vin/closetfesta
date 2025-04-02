
import { useState, useEffect } from "react";

export interface Client {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
}

export interface FormData {
  type: string;
  client: string;
  product: string;
  time: string;
  notes: string;
}

export const useScheduleFormData = () => {
  const [formData, setFormData] = useState<FormData>({
    type: "",
    client: "",
    product: "",
    time: "",
    notes: ""
  });
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [initialFormData, setInitialFormData] = useState<FormData>(formData);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Mock clients and products for development - in a real app, these would come from an API
  const clients: Client[] = [
    { id: "1", name: "Maria Oliveira" },
    { id: "2", name: "João Silva" },
    { id: "3", name: "Ana Pereira" },
    { id: "4", name: "Carlos Santos" },
    { id: "5", name: "Luiza Costa" },
  ];
  
  const products: Product[] = [
    { id: "1", name: "Vestido Noiva Clássico", category: "Vestidos" },
    { id: "2", name: "Terno Azul Marinho", category: "Ternos" },
    { id: "3", name: "Vestido Madrinha Rosa", category: "Vestidos" },
    { id: "4", name: "Smoking Preto", category: "Ternos" },
    { id: "5", name: "Vestido de Festa Longo", category: "Vestidos" }
  ];
  
  // Check for form changes
  useEffect(() => {
    const hasChanged = 
      formData.type !== initialFormData.type ||
      formData.client !== initialFormData.client ||
      formData.product !== initialFormData.product ||
      formData.time !== initialFormData.time ||
      formData.notes !== initialFormData.notes;
    
    setHasChanges(hasChanged);
  }, [formData, initialFormData]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  return {
    formData,
    setFormData,
    date,
    setDate,
    handleChange,
    clients,
    products,
    hasChanges
  };
};
