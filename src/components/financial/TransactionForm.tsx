
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowDown, 
  ArrowUp, 
  Calendar,
  Store,
  User,
  FileText,
  CreditCard,
  Receipt
} from "lucide-react";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';

interface TransactionFormProps {
  transaction: any | null;
  onClose: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ transaction, onClose }) => {
  const [selectedTab, setSelectedTab] = useState<"income" | "expense">("income");
  const [date, setDate] = useState<Date | undefined>(transaction?.date ? new Date(transaction.date) : new Date());
  const [formData, setFormData] = useState({
    description: transaction?.description || "",
    value: transaction?.value || "",
    category: transaction?.category || "",
    paymentMethod: transaction?.paymentMethod || "",
    notes: transaction?.notes || "",
    contactName: transaction?.contactName || "",
    documentNumber: transaction?.documentNumber || "",
    dueDate: transaction?.dueDate ? new Date(transaction.dueDate) : undefined,
  });
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Would actually send this to an API in a real app
    console.log("Form submitted with data:", {
      ...formData,
      type: selectedTab,
      date,
      // For new transactions, generate an ID
      id: transaction?.id || `TRX-${Math.floor(Math.random() * 10000)}`,
    });
    onClose();
  };
  
  // Categories based on transaction type
  const incomeCategories = [
    { value: "rental", label: "Aluguel de Produtos" },
    { value: "sale", label: "Venda de Produtos" },
    { value: "service", label: "Serviços" },
    { value: "adjustment", label: "Ajuste Positivo" },
    { value: "other", label: "Outros" },
  ];
  
  const expenseCategories = [
    { value: "suppliers", label: "Fornecedores" },
    { value: "rent", label: "Aluguel" },
    { value: "utilities", label: "Contas (Água/Luz/etc)" },
    { value: "salaries", label: "Salários" },
    { value: "marketing", label: "Marketing" },
    { value: "maintenance", label: "Manutenção" },
    { value: "taxes", label: "Impostos" },
    { value: "purchase", label: "Compra de Produtos" },
    { value: "other", label: "Outros" },
  ];
  
  // Payment methods
  const paymentMethods = [
    { value: "cash", label: "Dinheiro" },
    { value: "credit", label: "Cartão de Crédito" },
    { value: "debit", label: "Cartão de Débito" },
    { value: "transfer", label: "Transferência Bancária" },
    { value: "pix", label: "PIX" },
    { value: "boleto", label: "Boleto" },
    { value: "check", label: "Cheque" },
  ];
  
  const getContactLabel = () => {
    return selectedTab === "income" ? "Cliente" : "Fornecedor";
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs 
        defaultValue={selectedTab} 
        onValueChange={(value) => setSelectedTab(value as "income" | "expense")}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="income" className="flex gap-2 items-center">
            <ArrowUp size={16} className="text-green-600" />
            Entrada
          </TabsTrigger>
          <TabsTrigger value="expense" className="flex gap-2 items-center">
            <ArrowDown size={16} className="text-red-600" />
            Saída
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="description">Descrição</Label>
              <div className="relative mt-1">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="description"
                  name="description"
                  placeholder="Descrição da transação"
                  value={formData.description}
                  onChange={handleChange}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="value">Valor (R$)</Label>
              <div className="relative mt-1">
                <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="value"
                  name="value"
                  type="text"
                  placeholder="0,00"
                  value={formData.value}
                  onChange={handleChange}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="contactName">{getContactLabel()}</Label>
              <div className="relative mt-1">
                {selectedTab === "income" ? (
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                ) : (
                  <Store className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                )}
                <Input
                  id="contactName"
                  name="contactName"
                  placeholder={`Nome do ${getContactLabel().toLowerCase()}`}
                  value={formData.contactName}
                  onChange={handleChange}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="documentNumber">Número do Documento</Label>
              <div className="relative mt-1">
                <Receipt className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="documentNumber"
                  name="documentNumber"
                  placeholder="Nota fiscal, recibo, etc."
                  value={formData.documentNumber}
                  onChange={handleChange}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select 
                name="category" 
                value={formData.category} 
                onValueChange={(value) => setFormData({...formData, category: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {(selectedTab === "income" ? incomeCategories : expenseCategories).map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
              <Select 
                name="paymentMethod" 
                value={formData.paymentMethod} 
                onValueChange={(value) => setFormData({...formData, paymentMethod: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Data da Transação</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-1"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>Data de Vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-1"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.dueDate ? format(formData.dueDate, "dd/MM/yyyy") : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date) => setFormData({...formData, dueDate: date})}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Observações adicionais sobre a transação"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
            />
          </div>
        </div>
      </Tabs>
      
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          type="submit"
          className={selectedTab === "income" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-marsala hover:bg-marsala-700 text-white"}
        >
          {transaction ? "Atualizar" : "Registrar"} {selectedTab === "income" ? "Entrada" : "Saída"}
        </Button>
      </div>
    </form>
  );
};

export default TransactionForm;
