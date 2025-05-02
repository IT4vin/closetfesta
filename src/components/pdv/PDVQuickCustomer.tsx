
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  name: string;
  document: string;
  email?: string;
  phone?: string;
}

interface PDVQuickCustomerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: { name: string; document: string }) => void;
}

const PDVQuickCustomer: React.FC<PDVQuickCustomerProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [quickName, setQuickName] = useState("");
  const [quickDocument, setQuickDocument] = useState("");
  const [showQuickForm, setShowQuickForm] = useState(false);

  // Exemplo de clientes (em um caso real, seriam buscados do backend)
  const mockCustomers: Customer[] = [
    { id: "1", name: "João Silva", document: "123.456.789-00", email: "joao@example.com", phone: "(11) 98765-4321" },
    { id: "2", name: "Maria Oliveira", document: "987.654.321-00", email: "maria@example.com", phone: "(11) 91234-5678" },
    { id: "3", name: "Pedro Santos", document: "456.789.123-00", email: "pedro@example.com", phone: "(11) 95555-5555" },
    { id: "4", name: "Ana Costa", document: "789.123.456-00", email: "ana@example.com", phone: "(11) 94444-4444" },
  ];

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setQuickName("");
      setQuickDocument("");
      setShowQuickForm(false);
    }
  }, [isOpen]);

  // Filter customers based on search term
  const filteredCustomers = mockCustomers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    customer.document.includes(searchTerm)
  );

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer({
      name: customer.name,
      document: customer.document
    });
    onClose();
  };

  const handleQuickCreate = () => {
    if (!quickName) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, digite o nome do cliente.",
        variant: "destructive",
      });
      return;
    }

    const newCustomer = {
      name: quickName,
      document: quickDocument
    };

    onSelectCustomer(newCustomer);
    toast({
      title: "Cliente adicionado",
      description: "O cliente foi adicionado com sucesso.",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {showQuickForm ? "Cadastro Rápido de Cliente" : "Selecionar Cliente"}
          </DialogTitle>
        </DialogHeader>

        {!showQuickForm ? (
          <>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar por nome ou CPF/CNPJ"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto mb-4">
              {filteredCustomers.length === 0 ? (
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <p className="text-gray-500 mb-2">Nenhum cliente encontrado</p>
                  <Button variant="outline" onClick={() => setShowQuickForm(true)}>
                    <UserPlus size={16} className="mr-2" />
                    Cadastro Rápido
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className="flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                    >
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.document}</p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <User size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={() => setShowQuickForm(true)}>
                <UserPlus size={16} className="mr-2" />
                Novo Cliente
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4 mb-4">
              <div>
                <Label htmlFor="quickName">Nome do Cliente*</Label>
                <Input
                  id="quickName"
                  placeholder="Nome completo"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="quickDocument">CPF/CNPJ (opcional)</Label>
                <Input
                  id="quickDocument"
                  placeholder="000.000.000-00"
                  value={quickDocument}
                  onChange={(e) => setQuickDocument(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setShowQuickForm(false)}>
                Voltar
              </Button>
              <Button onClick={handleQuickCreate}>
                Salvar Cliente
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PDVQuickCustomer;
