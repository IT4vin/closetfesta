
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  ShoppingBag, 
  User, 
  Clock 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ClientForm from "@/components/clients/ClientForm";
import ClientRentalHistory from "@/components/clients/ClientRentalHistory";
import ClientPaymentHistory from "@/components/clients/ClientPaymentHistory";

// Sample data (would come from an API in a real app)
const clients = [
  {
    id: 1,
    name: "Ana Silva",
    email: "ana.silva@example.com",
    phone: "(11) 98765-4321",
    address: "Rua das Flores, 123 - São Paulo, SP",
    birthdate: "1988-05-12",
    document: "123.456.789-00",
    since: "2023-01-15",
    totalRentals: 5,
    totalSpent: 1500,
    nextRental: "2023-12-20",
    measurements: {
      bust: 90,
      waist: 70,
      hips: 95,
      height: 168
    },
    notes: "Cliente VIP, prefere ser atendida pela vendedora Mariana."
  }
];

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewRentalOpen, setIsNewRentalOpen] = useState(false);
  
  // In a real app, fetch the client by id from an API
  const clientId = parseInt(id || "0");
  const client = clients.find(c => c.id === clientId);
  
  if (!client) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <h1 className="text-2xl font-semibold mb-4">Cliente não encontrado</h1>
          <Button onClick={() => navigate("/clients")}>
            Voltar para Clientes
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  const handleEditClient = () => {
    setIsEditModalOpen(true);
  };
  
  const handleNewRental = () => {
    setIsNewRentalOpen(true);
  };
  
  const handleScheduleAppointment = () => {
    // In a real app, navigate to the appointment page or open a modal
    toast({
      title: "Agendamento iniciado",
      description: "Você será redirecionado para o formulário de agendamento."
    });
  };
  
  return (
    <MainLayout>
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
              <p className="text-neutral-500">Cliente desde {new Date(client.since).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleScheduleAppointment}
              className="border-marsala text-marsala hover:bg-marsala/10"
            >
              <Calendar size={18} className="mr-2" />
              <span>Agendar</span>
            </Button>
            
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
              <ShoppingBag size={18} className="mr-2" />
              <span>Novo Aluguel</span>
            </Button>
          </div>
        </div>
        
        {/* Client content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Profile */}
          <div className="lg:col-span-1">
            <div className="premium-card p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-marsala flex items-center justify-center text-white text-xl font-semibold">
                  {client.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{client.name}</h2>
                  <p className="text-neutral-500">{client.document}</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-neutral-400" />
                  <span>{client.email}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-neutral-400" />
                  <span>{client.phone}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-neutral-400" />
                  <span>{client.address}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-neutral-400" />
                  <span>Nascimento: {new Date(client.birthdate).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              
              <div className="border-t border-neutral-200 pt-4 mb-6">
                <h3 className="font-medium mb-3">Próximo Evento</h3>
                {client.nextRental ? (
                  <div className="bg-neutral-50 p-3 rounded-md">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Aluguel Agendado</span>
                      <span className="text-sm text-marsala font-medium">
                        {new Date(client.nextRental).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-marsala"
                      onClick={() => navigate("/calendar")}
                    >
                      Ver na agenda
                    </Button>
                  </div>
                ) : (
                  <p className="text-neutral-500 text-sm">Nenhum evento agendado</p>
                )}
              </div>
              
              <div className="border-t border-neutral-200 pt-4 mb-6">
                <h3 className="font-medium mb-3">Estatísticas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-50 p-3 rounded-md">
                    <p className="text-sm text-neutral-500">Total Aluguéis</p>
                    <p className="text-lg font-medium">{client.totalRentals}</p>
                  </div>
                  
                  <div className="bg-neutral-50 p-3 rounded-md">
                    <p className="text-sm text-neutral-500">Total Gasto</p>
                    <p className="text-lg font-medium text-marsala">
                      R$ {client.totalSpent.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  className="w-full bg-marsala hover:bg-marsala-700"
                  onClick={handleNewRental}
                >
                  <ShoppingBag size={18} className="mr-2" />
                  <span>Novo Aluguel</span>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Right column - Details and History tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="details" className="premium-card">
              <TabsList className="mb-6 bg-neutral-100">
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="rentals">Histórico de Aluguéis</TabsTrigger>
                <TabsTrigger value="payments">Pagamentos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="p-2">
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Medidas</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="border border-neutral-200 rounded-md p-3">
                      <p className="text-sm text-neutral-500">Busto</p>
                      <p className="font-medium">{client.measurements.bust} cm</p>
                    </div>
                    
                    <div className="border border-neutral-200 rounded-md p-3">
                      <p className="text-sm text-neutral-500">Cintura</p>
                      <p className="font-medium">{client.measurements.waist} cm</p>
                    </div>
                    
                    <div className="border border-neutral-200 rounded-md p-3">
                      <p className="text-sm text-neutral-500">Quadril</p>
                      <p className="font-medium">{client.measurements.hips} cm</p>
                    </div>
                    
                    <div className="border border-neutral-200 rounded-md p-3">
                      <p className="text-sm text-neutral-500">Altura</p>
                      <p className="font-medium">{client.measurements.height} cm</p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Observações</h3>
                  <p className="text-neutral-700">{client.notes}</p>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Histórico de Eventos</h3>
                  <div className="space-y-4">
                    {/* This would be dynamic in a real app */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                        <ShoppingBag size={16} className="text-neutral-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">Aluguel Vestido de Noiva</h4>
                        <p className="text-sm text-neutral-500">10/10/2023 - R$ 500,00</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                        <User size={16} className="text-neutral-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">Prova de Roupa</h4>
                        <p className="text-sm text-neutral-500">05/10/2023</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                        <Clock size={16} className="text-neutral-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">Cliente Cadastrado</h4>
                        <p className="text-sm text-neutral-500">{new Date(client.since).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="rentals" className="p-2">
                <ClientRentalHistory clientId={client.id} />
              </TabsContent>
              
              <TabsContent value="payments" className="p-2">
                <ClientPaymentHistory clientId={client.id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Edit Client Modal */}
      <Sheet open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <SheetContent side="right" className="sm:max-w-[600px] w-[90vw] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Cliente</SheetTitle>
          </SheetHeader>
          <ClientForm 
            initialData={client} 
            onSubmit={(data) => {
              console.log("Updated client data:", data);
              toast({
                title: "Cliente atualizado",
                description: "As alterações foram salvas com sucesso."
              });
              setIsEditModalOpen(false);
            }}
            onCancel={() => setIsEditModalOpen(false)} 
          />
        </SheetContent>
      </Sheet>
      
      {/* New Rental Modal */}
      <Sheet open={isNewRentalOpen} onOpenChange={setIsNewRentalOpen}>
        <SheetContent side="right" className="sm:max-w-[600px] w-[90vw] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo Aluguel</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {/* We'll use the existing NovoLancamentoForm component */}
            <p className="mb-4">Cliente selecionado: <strong>{client.name}</strong></p>
            {/* In a real implementation, you would pre-fill the form with the selected client */}
          </div>
        </SheetContent>
      </Sheet>
    </MainLayout>
  );
};

export default ClientDetail;
