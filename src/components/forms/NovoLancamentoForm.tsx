
import React, { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Check, CreditCard, Plus, Search, User } from "lucide-react";

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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Schema for sale form
const saleSchema = z.object({
  client: z.string().min(1, "Cliente é obrigatório"),
  product: z.string().min(1, "Produto é obrigatório"),
  quantity: z.coerce.number().min(1, "Quantidade mínima é 1"),
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  installments: z.coerce.number().optional(),
  discount: z.coerce.number().min(0).max(10, "Desconto máximo é 10%").optional(),
  observations: z.string().optional(),
});

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

interface NovoLancamentoFormProps {
  onClose: () => void;
}

const NovoLancamentoForm = ({ onClose }: NovoLancamentoFormProps) => {
  const [activeTab, setActiveTab] = useState("venda");
  const { toast } = useToast();

  // Sale form
  const saleForm = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      client: "",
      product: "",
      quantity: 1,
      paymentMethod: "",
      discount: 0,
      observations: "",
    },
  });

  // Rental form
  const rentalForm = useForm<z.infer<typeof rentalSchema>>({
    resolver: zodResolver(rentalSchema),
    defaultValues: {
      client: "",
      product: "",
      rentalValue: 0,
      paymentMethod: "",
      observations: "",
    },
  });

  // Submit handler for sale form
  const onSaleSubmit = (data: z.infer<typeof saleSchema>) => {
    console.log("Sale data:", data);
    
    // Here you would send data to your API
    // For now, let's simulate a successful submission
    toast({
      title: "Venda registrada!",
      description: `Venda registrada com sucesso! Nº #${Math.floor(Math.random() * 1000)}`,
      variant: "default",
    });
    
    onClose();
  };

  // Submit handler for rental form
  const onRentalSubmit = (data: z.infer<typeof rentalSchema>) => {
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
    
    onClose();
  };

  // Calculate rental value based on days between start and end date
  const calculateRentalValue = (startDate?: Date, endDate?: Date) => {
    if (!startDate || !endDate) return 0;
    
    const diffInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays * 50; // Assuming 50 reais per day
  };

  // Update rental value when dates change
  React.useEffect(() => {
    const startDate = rentalForm.watch("startDate");
    const endDate = rentalForm.watch("endDate");
    
    if (startDate && endDate) {
      const value = calculateRentalValue(startDate, endDate);
      rentalForm.setValue("rentalValue", value);
    }
  }, [rentalForm.watch("startDate"), rentalForm.watch("endDate")]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full grid grid-cols-2">
        <TabsTrigger value="venda">Nova Venda</TabsTrigger>
        <TabsTrigger value="aluguel">Novo Aluguel</TabsTrigger>
      </TabsList>
      
      {/* Sale Form */}
      <TabsContent value="venda" className="space-y-4 py-4">
        <Form {...saleForm}>
          <form onSubmit={saleForm.handleSubmit(onSaleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client */}
              <FormField
                control={saleForm.control}
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
                control={saleForm.control}
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
                        <SelectItem value="product3">Blusa de Seda Verde</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quantity */}
              <FormField
                control={saleForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Method */}
              <FormField
                control={saleForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value !== 'cartao') {
                          saleForm.setValue('installments', undefined);
                        }
                      }} 
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

              {/* Installments (when Payment Method is Credit Card) */}
              {saleForm.watch("paymentMethod") === "cartao" && (
                <FormField
                  control={saleForm.control}
                  name="installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parcelamento</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o número de parcelas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}x {num === 1 ? 'à vista' : 'sem juros'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Discount */}
              <FormField
                control={saleForm.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desconto (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0}
                        max={10}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Observations */}
            <FormField
              control={saleForm.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Adicione observações sobre a venda..."
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
                type="submit" 
                className="bg-marsala hover:bg-marsala-700 text-white"
              >
                <Check className="mr-2 h-4 w-4" />
                Concluir
              </Button>
            </div>
          </form>
        </Form>
      </TabsContent>
      
      {/* Rental Form */}
      <TabsContent value="aluguel" className="space-y-4 py-4">
        <Form {...rentalForm}>
          <form onSubmit={rentalForm.handleSubmit(onRentalSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client */}
              <FormField
                control={rentalForm.control}
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
                control={rentalForm.control}
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
                control={rentalForm.control}
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
                control={rentalForm.control}
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
                            const startDate = rentalForm.getValues("startDate");
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
                control={rentalForm.control}
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
                control={rentalForm.control}
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
              control={rentalForm.control}
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
                type="submit" 
                className="bg-marsala hover:bg-marsala-700 text-white"
              >
                <Check className="mr-2 h-4 w-4" />
                Concluir
              </Button>
            </div>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
};

export default NovoLancamentoForm;
