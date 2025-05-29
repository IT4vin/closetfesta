import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  CreditCard,
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import ClientForm from "@/components/clients/ClientForm";
import ClientRentalHistory from "@/components/clients/ClientRentalHistory";
import ClientPaymentHistory from "@/components/clients/ClientPaymentHistory";

// Sample client data (would come from an API in a real app)
const clients = [
  {
    id: 1,
    name: "Ana Silva",
    email: "ana.silva@example.com",
    phone: "(11) 98765-4321",
    address: "Rua das Flores, 123, Vila Mariana, São Paulo - SP, 04567-890",
    addressDetails: {
      cep: "04567-890",
      street: "Rua das Flores",
      number: "123",
      complement: "",
      neighborhood: "Vila Mariana",
      city: "São Paulo",
      state: "SP"
    },
    document: "123.456.789-00",
    birthdate: "1985-03-15",
    createdAt: "2023-01-15",
    measurements: {
      bust: "90",
      waist: "70",
      hips: "95",
      height: "165"
    },
    notes: "Prefere vestidos longos, alérgica a tecidos sintéticos",
    totalRentals: 8,
    totalSpent: 2400,
    lastRental: "2023-06-15",
    status: "active"
  },
];

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // In a real app, fetch the client by id from an API
  const clientId = parseInt(id || "0");
  const client = clients.find(c => c.id === clientId);
  
  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <h1 className="text-2xl font-semibold mb-4">Cliente não encontrado</h1>
        <Button onClick={() => navigate("/clients")}>
          Voltar para Clientes
        </Button>
      </div>
    );
  }
  
  const handleEditClient = () => {
    setIsEditModalOpen(true);
  };
  
  const handleFormSubmit = (data: any) => {
    // In a real app, save the data to the backend
    console.log("Updated client data:", data);
    toast({
      title: "Cliente atualizado",
      description: "As alterações foram salvas com sucesso."
    });
    setIsEditModalOpen(false);
  };
  
  // Converte dados do cliente para o formato do formulário
  const getClientFormData = () => {
    if (!client.addressDetails) {
      // Se não tiver endereço detalhado, tenta extrair do endereço completo
      return {
        ...client,
        address: {
          cep: "",
          street: "",
          number: "",
          complement: "",
          neighborhood: "",
          city: "",
          state: ""
        }
      };
    }
    
    return {
      ...client,
      address: client.addressDetails
    };
  };
  
  const handleNewRental = () => {
    // Navigate to rental form with client pre-selected
    navigate("/lancamentos", { state: { selectedClient: client } });
  };
  
  return (
    <div className="page-transition">
      {/* Header with navigation and actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/clients")}
            className="h-10 w-10"
          >
            <ArrowLeft size={18} />
          </Button>
          
          <div>
            <h1 className="text-2xl font-semibold">{client.name}</h1>
            <p className="text-neutral-500">Cliente desde {client.createdAt}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleEditClient}
          >
            <Edit size={18} className="mr-2" />
            <span>Editar</span>
          </Button>
          
          <Button 
            onClick={handleNewRental}
            className="bg-marsala hover:bg-marsala-700"
          >
            <Calendar size={18} className="mr-2" />
            <span>Novo Aluguel</span>
          </Button>
        </div>
      </div>
      
      {/* Client content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Client Info */}
        <div className="lg:col-span-1">
          <div className="premium-card p-5">
            {/* Profile Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-marsala rounded-full flex items-center justify-center text-white text-2xl font-medium">
                {client.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{client.name}</h3>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  client.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {client.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
            
            {/* Contact Info */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-neutral-400" />
                <span className="text-sm">{client.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-neutral-400" />
                <span className="text-sm">{client.phone}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-neutral-400 mt-0.5" />
                <span className="text-sm">{client.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <User size={18} className="text-neutral-400" />
                <span className="text-sm">CPF: {client.document}</span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="border-t border-neutral-200 pt-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-marsala">{client.totalRentals}</p>
                  <p className="text-sm text-neutral-500">Aluguéis</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-marsala">R$ {client.totalSpent.toFixed(2)}</p>
                  <p className="text-sm text-neutral-500">Total Gasto</p>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-neutral-500">Último aluguel</p>
                <p className="font-medium">{client.lastRental}</p>
              </div>
            </div>
            
            {/* Measurements */}
            {(client.measurements.bust || client.measurements.waist || client.measurements.hips || client.measurements.height) && (
              <div className="border-t border-neutral-200 pt-4 mt-4">
                <h4 className="font-medium mb-3">Medidas</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {client.measurements.bust && (
                    <div>
                      <span className="text-neutral-500">Busto:</span> {client.measurements.bust}cm
                    </div>
                  )}
                  {client.measurements.waist && (
                    <div>
                      <span className="text-neutral-500">Cintura:</span> {client.measurements.waist}cm
                    </div>
                  )}
                  {client.measurements.hips && (
                    <div>
                      <span className="text-neutral-500">Quadril:</span> {client.measurements.hips}cm
                    </div>
                  )}
                  {client.measurements.height && (
                    <div>
                      <span className="text-neutral-500">Altura:</span> {client.measurements.height}cm
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Notes */}
            {client.notes && (
              <div className="border-t border-neutral-200 pt-4 mt-4">
                <h4 className="font-medium mb-2">Observações</h4>
                <p className="text-sm text-neutral-700">{client.notes}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Right column - History tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="rentals" className="premium-card">
            <TabsList className="mb-6 bg-neutral-100">
              <TabsTrigger value="rentals">Histórico de Aluguéis</TabsTrigger>
              <TabsTrigger value="payments">Histórico de Pagamentos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="rentals" className="p-2">
              <ClientRentalHistory clientId={client.id} />
            </TabsContent>
            
            <TabsContent value="payments" className="p-2">
              <ClientPaymentHistory clientId={client.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Edit Client Modal */}
      <Sheet open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <SheetContent side="right" className="sm:max-w-[600px] w-[90vw] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Cliente</SheetTitle>
          </SheetHeader>
          <ClientForm 
            initialData={getClientFormData()} 
            onSubmit={handleFormSubmit} 
            onCancel={() => setIsEditModalOpen(false)} 
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ClientDetail;
