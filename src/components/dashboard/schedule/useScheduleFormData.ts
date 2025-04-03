
import { useState } from "react";

export interface ScheduleFormData {
  title: string;
  client: string;
  date: Date | undefined;
  time: string;
  endTime: string;
  location: string;
  type: string;
  notes: string;
  status: string;
  product?: string;
  duration: string; // Ensure duration is properly defined
}

// Define Client and Product interfaces
export interface Client {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
}

// Rename ScheduleFormData to ScheduleFormDataType for backwards compatibility
export type ScheduleFormDataType = ScheduleFormData;

export const useScheduleFormData = (initialDate?: Date) => {
  const [formData, setFormData] = useState<ScheduleFormData>({
    title: "",
    client: "",
    date: initialDate || undefined,
    time: "",
    endTime: "",
    location: "",
    type: "fitting", // default value
    notes: "",
    status: "agendado", // default value
    product: "",
    duration: ""
  });

  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Mock data for clients and products
  const clients = [
    { id: "1", name: "João Silva" },
    { id: "2", name: "Maria Oliveira" },
    { id: "3", name: "Pedro Santos" }
  ];

  const products = [
    { id: "1", name: "Vestido de Noiva Elegance" },
    { id: "2", name: "Terno Preto Classic" },
    { id: "3", name: "Vestido Madrinha Rose" }
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { name: string; value: string }
  ) => {
    const { name, value } = 'target' in e ? e.target : e;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleDateChange = (newDate: Date | undefined) => {
    setFormData(prev => ({ ...prev, date: newDate }));
    setDate(newDate);
    setHasChanges(true);
  };

  const handleReset = () => {
    setFormData({
      title: "",
      client: "",
      date: initialDate || undefined,
      time: "",
      endTime: "",
      location: "",
      type: "fitting",
      notes: "",
      status: "agendado",
      product: "",
      duration: ""
    });
    setDate(initialDate);
    setHasChanges(false);
  };

  const isValid = () => {
    return (
      formData.title.trim() !== "" && 
      formData.client.trim() !== "" && 
      formData.date !== undefined && 
      formData.time.trim() !== ""
    );
  };

  // Alias for handleInputChange to match the component expectations
  const handleChange = handleInputChange;

  return {
    formData,
    handleInputChange,
    handleDateChange,
    handleReset,
    isValid,
    // Additional properties expected by ScheduleFormFields
    date,
    setDate,
    handleChange,
    clients,
    products,
    hasChanges,
    setHasChanges
  };
};
