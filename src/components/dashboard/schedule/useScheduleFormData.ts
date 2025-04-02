
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export type Client = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  name: string;
};

export type ScheduleFormDataType = {
  type: string;
  client: string;
  product: string;
  time: string;
  duration: string;
  notes: string;
};

export const useScheduleFormData = () => {
  const [date, setDate] = useState<Date | undefined>();
  const [formData, setFormData] = useState<ScheduleFormDataType>({
    type: "",
    client: "",
    product: "",
    time: "",
    duration: "1",
    notes: "",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const [clients, setClients] = useState<Client[]>([
    { id: "1", name: "Maria Silva" },
    { id: "2", name: "João Paulo" },
    { id: "3", name: "Ana Beatriz" },
    { id: "4", name: "Carlos Eduardo" },
    { id: "5", name: "Fernanda Lima" },
  ]);
  
  const [products, setProducts] = useState<Product[]>([
    { id: "vestido-a", name: "Vestido de Festa A" },
    { id: "vestido-b", name: "Vestido de Noiva B" },
    { id: "terno-c", name: "Terno C" },
    { id: "vestido-d", name: "Vestido de Gala D" },
    { id: "terno-e", name: "Terno de Casamento E" },
  ]);
  
  const { toast } = useToast();

  useEffect(() => {
    const hasFormData = formData.type || formData.client || formData.product || 
                      formData.time || formData.notes || formData.duration !== "1" || date;
    setHasChanges(hasFormData);
  }, [formData, date]);

  useEffect(() => {
    const loadClients = async () => {
      try {
        console.log("Loaded clients:", clients.length);
      } catch (error) {
        console.error("Failed to load clients:", error);
        toast({
          title: "Erro ao carregar clientes",
          description: "Não foi possível carregar a lista de clientes. Tente novamente.",
          variant: "destructive",
        });
      }
    };

    loadClients();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log("Loaded products:", products.length);
      } catch (error) {
        console.error("Failed to load products:", error);
        toast({
          title: "Erro ao carregar produtos",
          description: "Não foi possível carregar a lista de produtos. Tente novamente.",
          variant: "destructive",
        });
      }
    };

    loadProducts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { name: string; value: string }) => {
    const { name, value } = 'target' in e ? e.target : e;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return {
    formData,
    date,
    setDate,
    handleChange,
    clients,
    products,
    hasChanges,
    isCalendarOpen,
    setIsCalendarOpen
  };
};
