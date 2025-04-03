
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
  product?: string; // Added product field
  duration?: string; // Add duration field
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { name: string; value: string }
  ) => {
    const { name, value } = 'target' in e ? e.target : e;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, date }));
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
  };

  const isValid = () => {
    return (
      formData.title.trim() !== "" && 
      formData.client.trim() !== "" && 
      formData.date !== undefined && 
      formData.time.trim() !== ""
    );
  };

  return {
    formData,
    handleInputChange,
    handleDateChange,
    handleReset,
    isValid
  };
};
