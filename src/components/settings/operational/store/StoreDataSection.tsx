
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Store, Building, User, Phone, Mail, MapPin, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// CNPJ validation function
const validateCNPJ = (cnpj: string) => {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  
  if (cnpj.length !== 14) return false;
  
  // Check for known invalid values
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  // Validate digits
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
};

// Mask functions
const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+$/, '$1');
};

const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+$/, '$1');
};

const maskZipcode = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+$/, '$1');
};

// Create form schema with validations
const storeDataSchema = z.object({
  tradingName: z.string().min(3, "Nome fantasia deve ter ao menos 3 caracteres"),
  companyName: z.string().min(3, "Razão social deve ter ao menos 3 caracteres"),
  cnpj: z.string()
    .min(18, "CNPJ inválido")
    .refine(val => validateCNPJ(val), { message: "CNPJ inválido" }),
  zipcode: z.string().min(9, "CEP inválido"),
  address: z.string().min(5, "Endereço deve ter ao menos 5 caracteres"),
  number: z.string().min(1, "Número obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, "Bairro obrigatório"),
  city: z.string().min(2, "Cidade obrigatória"),
  state: z.string().length(2, "UF deve ter 2 caracteres"),
  phone: z.string().min(14, "Telefone inválido"),
  email: z.string().email("E-mail inválido"),
});

type StoreDataFormValues = z.infer<typeof storeDataSchema>;

const StoreDataSection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchingZipcode, setSearchingZipcode] = useState(false);
  const { toast } = useToast();

  // Example initial data (in a real app would come from API/database)
  const defaultValues: Partial<StoreDataFormValues> = {
    tradingName: "MinhaLoja",
    companyName: "Minha Loja Equipamentos LTDA",
    cnpj: "12.345.678/0001-99",
    zipcode: "01234-567",
    address: "Av. Exemplo",
    number: "123",
    complement: "Sala 45",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
    phone: "(11) 98765-4321",
    email: "contato@minhaloja.com.br",
  };

  const form = useForm<StoreDataFormValues>({
    resolver: zodResolver(storeDataSchema),
    defaultValues,
  });

  const searchZipcode = async (zipcode: string) => {
    if (zipcode.length < 8) return;
    
    setSearchingZipcode(true);
    // Simulate API call (in real app would call a CEP API)
    setTimeout(() => {
      // Mock data - in real app would use data from API
      form.setValue("address", "Avenida Exemplo");
      form.setValue("neighborhood", "Centro");
      form.setValue("city", "São Paulo");
      form.setValue("state", "SP");
      
      setSearchingZipcode(false);
    }, 1500);
  };

  const onSubmit = (values: StoreDataFormValues) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log(values);
      
      toast({
        title: "Dados atualizados",
        description: "Os dados da loja foram atualizados com sucesso.",
      });
      
      setIsLoading(false);
    }, 1000);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Store className="h-6 w-6 text-primary" />
        <CardTitle>Dados da Loja</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome Fantasia */}
              <FormField
                control={form.control}
                name="tradingName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Fantasia*</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="Nome Fantasia" {...field} />
                        <User className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Razão Social */}
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social*</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="Razão Social" {...field} />
                        <Building className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* CNPJ */}
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field: { onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>CNPJ*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="00.000.000/0001-00" 
                        {...field}
                        onChange={(e) => {
                          onChange(maskCNPJ(e.target.value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* CEP */}
              <FormField
                control={form.control}
                name="zipcode"
                render={({ field: { onChange, onBlur, ...field } }) => (
                  <FormItem>
                    <FormLabel>CEP*</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="00000-000" 
                          {...field}
                          onChange={(e) => {
                            const maskedValue = maskZipcode(e.target.value);
                            onChange(maskedValue);
                          }}
                          onBlur={(e) => {
                            onBlur();
                            searchZipcode(e.target.value.replace(/\D/g, ''));
                          }}
                        />
                        {searchingZipcode ? (
                          <div className="absolute right-3 top-3 h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                        ) : (
                          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Endereço */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço*</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input placeholder="Rua, Avenida, etc" {...field} />
                          <MapPin className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número*</FormLabel>
                    <FormControl>
                      <Input placeholder="Número" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="complement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                      <Input placeholder="Sala, Andar, etc" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro*</FormLabel>
                    <FormControl>
                      <Input placeholder="Bairro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade*</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UF*</FormLabel>
                    <FormControl>
                      <Input placeholder="UF" maxLength={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field: { onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Telefone*</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="(00) 00000-0000" 
                          {...field}
                          onChange={(e) => {
                            onChange(maskPhone(e.target.value));
                          }}
                        />
                        <Phone className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail*</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="email@empresa.com.br" {...field} />
                        <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                )}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default StoreDataSection;
