
import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface ScheduleFormProps {
  onClose: () => void;
}

const ScheduleForm = ({ onClose }: ScheduleFormProps) => {
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    type: "",
    client: "",
    product: "",
    time: "",
    duration: "1",
    notes: "",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [clients, setClients] = useState([
    { id: "1", name: "Maria Silva" },
    { id: "2", name: "João Paulo" },
    { id: "3", name: "Ana Beatriz" },
    { id: "4", name: "Carlos Eduardo" },
    { id: "5", name: "Fernanda Lima" },
  ]);
  const [products, setProducts] = useState([
    { id: "vestido-a", name: "Vestido de Festa A" },
    { id: "vestido-b", name: "Vestido de Noiva B" },
    { id: "terno-c", name: "Terno C" },
    { id: "vestido-d", name: "Vestido de Gala D" },
    { id: "terno-e", name: "Terno de Casamento E" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Monitor for changes
  useEffect(() => {
    const hasFormData = formData.type || formData.client || formData.product || 
                        formData.time || formData.notes || formData.duration !== "1" || date;
    setHasChanges(hasFormData);
  }, [formData, date]);

  // Simulate loading clients from API
  useEffect(() => {
    const loadClients = async () => {
      try {
        // In a real app, fetch clients from your API
        // const response = await fetch('/api/clients');
        // const data = await response.json();
        // setClients(data);
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

  // Simulate loading products from API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        // In a real app, fetch products from your API
        // const response = await fetch('/api/products');
        // const data = await response.json();
        // setProducts(data);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast({
        title: "Data obrigatória",
        description: "Por favor, selecione uma data para o agendamento",
        variant: "destructive",
      });
      return;
    }

    if (!formData.type || !formData.client || !formData.product || !formData.time) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log("Form submitted:", { ...formData, date });
      
      toast({
        title: "Agendamento realizado",
        description: "Seu agendamento foi salvo com sucesso!",
      });
      
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o agendamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      setIsConfirmDialogOpen(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select 
              value={formData.type}
              onValueChange={(value) => handleChange({ name: "type", value })}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prova">Prova</SelectItem>
                <SelectItem value="evento">Evento</SelectItem>
                <SelectItem value="ajuste">Ajuste</SelectItem>
                <SelectItem value="consultoria">Consultoria</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Select
              value={formData.client}
              onValueChange={(value) => handleChange({ name: "client", value })}
            >
              <SelectTrigger id="client">
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product">Produto</Label>
            <Select
              value={formData.product}
              onValueChange={(value) => handleChange({ name: "product", value })}
            >
              <SelectTrigger id="product">
                <SelectValue placeholder="Selecione o produto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Horário</Label>
              <Select
                value={formData.time}
                onValueChange={(value) => handleChange({ name: "time", value })}
              >
                <SelectTrigger id="time">
                  <SelectValue placeholder="Hora" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
                    <SelectItem key={hour} value={`${hour}:00`}>{`${hour}:00`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duração (horas)</Label>
            <Select
              value={formData.duration}
              onValueChange={(value) => handleChange({ name: "duration", value })}
            >
              <SelectTrigger id="duration">
                <SelectValue placeholder="Duração" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">30 minutos</SelectItem>
                <SelectItem value="1">1 hora</SelectItem>
                <SelectItem value="1.5">1 hora e 30 minutos</SelectItem>
                <SelectItem value="2">2 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Observações adicionais"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button variant="outline" type="button" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            className="bg-marsala hover:bg-marsala-700 text-white" 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>

      {/* Confirmation Dialog for unsaved changes */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alterações não salvas
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Se sair agora, essas alterações serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmDialogOpen(false)}>
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setIsConfirmDialogOpen(false);
                onClose();
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Descartar alterações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ScheduleForm;
