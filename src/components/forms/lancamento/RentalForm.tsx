
import React, { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Check, Search, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RentalContract from "@/components/rental/RentalContract";

// Schema for rental form
const rentalSchema = z.object({
  client: z.string().min(1, "Cliente é obrigatório"),
  product: z.string().min(1, "Produto é obrigatório"),
  startDate: z.date({
    required_error: "Data de retirada é obrigatória",
  }),
  endDate: z.date({
    required_error: "Data de devolução é obrigatória",
  }),
  rentalValue: z.coerce.number().min(0, "Valor do aluguel não pode ser negativo"),
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  observations: z.string().optional(),
});

export type RentalFormValues = z.infer<typeof rentalSchema>;

interface RentalFormProps {
  onClose: () => void;
}

// Mock data for demonstration purposes
const mockCompanyInfo = {
  name: "Vestir Bem Aluguel de Roupas Ltda.",
  cnpj: "12.345.678/0001-90",
  address: "Av. Paulista, 1000, São Paulo/SP, CEP 01310-100",
  phone: "(11) 3456-7890",
  email: "contato@vestirbem.com.br",
};

const mockClientInfo = {
  name: "Maria Silva",
  cpf: "123.456.789-00",
  rg: "12.345.678-9",
  address: "Rua das Flores, 123, São Paulo/SP, CEP 04567-890",
  phone: "(11) 98765-4321",
  email: "maria.silva@email.com",
};

const mockProductDetails = {
  name: "Vestido Longo Floral",
  brand: "Elegance",
  model: "FL-2023",
  serialNumber: "VLF-123456",
  marketValue: 1200.00,
  condition: "Novo, sem avarias",
};

const RentalForm = ({ onClose }: RentalFormProps) => {
  const { toast } = useToast();
  const [showContract, setShowContract] = useState(false);
  const [formData, setFormData] = useState<RentalFormValues | null>(null);

  // Rental form
  const form = useForm<RentalFormValues>({
    resolver: zodResolver(rentalSchema),
    defaultValues: {
      client: "",
      product: "",
      rentalValue: 0,
      paymentMethod: "",
      observations: "",
    },
  });

  // Calculate rental value based on days between start and end date
  const calculateRentalValue = (startDate?: Date, endDate?: Date) => {
    if (!startDate || !endDate) return 0;
    
    const diffInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays * 50; // Assuming 50 reais per day
  };

  // Update rental value when dates change
  useEffect(() => {
    const startDate = form.watch("startDate");
    const endDate = form.watch("endDate");
    
    if (startDate && endDate) {
      const value = calculateRentalValue(startDate, endDate);
      form.setValue("rentalValue", value);
    }
  }, [form.watch("startDate"), form.watch("endDate")]);

  // Submit handler for rental form
  const onSubmit = (data: RentalFormValues) => {
    console.log("Rental data:", data);
    
    // Calculate return date for message
    const returnDate = format(data.endDate, "dd/MM/yyyy", { locale: ptBR });
    
    // Here you would send data to your API
    // For now, let's simulate a successful submission
    toast({
      title: "Aluguel registrado!",
      description: `Aluguel registrado com sucesso! Data de devolução: ${returnDate}`,
      variant: "default",
    });
    
    setFormData(data);
  };

  const handleGenerateContract = () => {
    const data = form.getValues();
    if (form.formState.isValid) {
      setFormData(data);
      setShowContract(true);
    } else {
      form.trigger(); // Trigger validation
      toast({
        title: "Formulário Incompleto",
        description: "Preencha todos os campos obrigatórios para gerar o contrato.",
        variant: "destructive",
      });
    }
  };

  const handleCloseContract = () => {
    setShowContract(false);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client */}
            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente *</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        placeholder="Buscar cliente por nome ou CPF"
                        {...field}
                      />
                    </FormControl>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      type="button"
                      className="absolute right-0 top-0 h-full"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product */}
            <FormField
              control={form.control}
              name="product"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produto *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="product1">Vestido Longo Floral</SelectItem>
                      <SelectItem value="product2">Saia Midi Preta</SelectItem>
                      <SelectItem value="product3">Vestido de Festa Vermelho</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Date */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Retirada *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End Date */}
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Devolução *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          const startDate = form.getValues("startDate");
                          return startDate ? date <= startDate : date <= new Date();
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rental Value */}
            <FormField
              control={form.control}
              name="rentalValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Aluguel *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      readOnly
                      {...field}
                      value={field.value}
                      className="bg-muted cursor-not-allowed"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Method */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o método de pagamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Fixed info about late fees */}
          <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
            <p className="text-amber-800 text-sm">
              <strong>Multa por Atraso:</strong> 10% do valor do aluguel por dia de atraso.
            </p>
            <p className="text-amber-800 text-sm mt-1">
              <strong>Pagamento:</strong> 50% no ato da retirada, 50% na devolução.
            </p>
          </div>
          
          {/* Observations */}
          <FormField
            control={form.control}
            name="observations"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Adicione observações sobre o aluguel..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Form Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              variant="outline"
              className="border-marsala text-marsala hover:bg-marsala/10"
              onClick={handleGenerateContract}
            >
              <FileText className="mr-2 h-4 w-4" />
              Gerar Contrato
            </Button>
            <Button 
              type="submit" 
              className="bg-marsala hover:bg-marsala-700 text-white"
            >
              <Check className="mr-2 h-4 w-4" />
              Concluir
            </Button>
          </div>
        </form>
      </Form>

      {/* Contract Dialog */}
      <Dialog open={showContract} onOpenChange={setShowContract}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Contrato de Aluguel</DialogTitle>
          </DialogHeader>
          {formData && (
            <RentalContract
              rentalData={formData}
              companyInfo={mockCompanyInfo}
              clientInfo={mockClientInfo}
              productDetails={mockProductDetails}
              onClose={handleCloseContract}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RentalForm;
