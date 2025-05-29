import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Mail, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import FilterBar from "@/components/common/FilterBar";
import ClientForm from "@/components/clients/ClientForm";

// In a real app, this would come from an API/database
const clients = [
  {
    id: 1,
    name: "Ana Silva",
    email: "ana.silva@example.com",
    phone: "(11) 98765-4321",
    lastRental: "12/05/2023",
    totalRentals: 5,
    totalSpent: 1500,
  },
  {
    id: 2,
    name: "Pedro Santos",
    email: "pedro.santos@example.com",
    phone: "(11) 91234-5678",
    lastRental: "05/06/2023",
    totalRentals: 2,
    totalSpent: 750,
  },
  {
    id: 3,
    name: "Maria Oliveira",
    email: "maria.oliveira@example.com",
    phone: "(11) 99876-5432",
    lastRental: "20/04/2023",
    totalRentals: 8,
    totalSpent: 2400,
  },
  {
    id: 4,
    name: "João Costa",
    email: "joao.costa@example.com",
    phone: "(11) 95678-1234",
    lastRental: "15/06/2023",
    totalRentals: 1,
    totalSpent: 400,
  },
  {
    id: 5,
    name: "Carla Mendes",
    email: "carla.mendes@example.com",
    phone: "(11) 93456-7890",
    lastRental: "02/06/2023",
    totalRentals: 3,
    totalSpent: 950,
  },
  {
    id: 6,
    name: "Roberto Alves",
    email: "roberto.alves@example.com",
    phone: "(11) 97890-1234",
    lastRental: "10/05/2023",
    totalRentals: 6,
    totalSpent: 1800,
  },
];

const ClientsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  
  // Clear search handler
  const handleClearSearch = () => {
    setSearchTerm("");
  };

  // Handle new client creation
  const handleNewClient = () => {
    setIsNewClientModalOpen(true);
  };

  // Handle client form submission
  const handleClientSubmit = (clientData: any) => {
    console.log("✅ Novo cliente criado:", clientData);
    
    // In a real app, save to backend here
    
    toast({
      title: "Cliente cadastrado",
      description: "O cliente foi cadastrado com sucesso!",
    });
    
    setIsNewClientModalOpen(false);
  };

  // Handle client form cancellation
  const handleClientCancel = () => {
    setIsNewClientModalOpen(false);
  };
  
  // Filter clients based on search term
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  // Define the filter options for the FilterBar
  const selectFilters = [
    {
      name: "status",
      label: "Status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: "", label: "Todos os clientes" },
        { value: "active", label: "Ativos" },
        { value: "inactive", label: "Inativos" },
        { value: "vip", label: "VIP" },
      ]
    },
    {
      name: "sort",
      label: "Ordenar por",
      value: sortOrder,
      onChange: setSortOrder,
      options: [
        { value: "name", label: "Nome" },
        { value: "spent", label: "Maior Gasto" },
        { value: "frequency", label: "Maior Frequência" },
        { value: "recent", label: "Mais Recente" },
      ]
    }
  ];
  
  return (
    <div className="page-transition w-full">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold mb-1 md:mb-2">Clientes</h1>
          <p className="text-neutral-500 text-sm md:text-base">Gerencie seus clientes e histórico de aluguéis</p>
        </div>
        
        <Button 
          onClick={handleNewClient}
          className="bg-marsala hover:bg-marsala-700 md:self-start"
        >
          <Plus size={18} className="mr-1 md:mr-2" />
          <span>Novo Cliente</span>
        </Button>
      </header>
      
      {/* Filter bar component with clear search functionality */}
      <FilterBar
        searchPlaceholder="Buscar clientes por nome, email ou telefone..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        selectFilters={selectFilters}
        showFilterButton={false}
        onClearSearch={handleClearSearch}
      />
      
      {/* Display count of filtered clients */}
      <div className="mb-4 text-sm text-neutral-600">
        {filteredClients.length} clientes encontrados
      </div>
      
      {/* Client cards container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredClients.map((client) => (
          <div 
            key={client.id} 
            className="premium-card card-hover"
          >
            <div className="p-4 md:p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-lg">{client.name}</h3>
                  <p className="text-sm text-neutral-500">Cliente desde {client.lastRental}</p>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 bg-marsala rounded-full flex items-center justify-center text-white font-medium">
                  {client.name.charAt(0)}
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={16} className="text-neutral-400 flex-shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={16} className="text-neutral-400 flex-shrink-0" />
                  <span>{client.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={16} className="text-neutral-400 flex-shrink-0" />
                  <span>Último aluguel: {client.lastRental}</span>
                </div>
              </div>
              
              <div className="border-t border-neutral-100 pt-3 flex justify-between mb-4">
                <div>
                  <p className="text-xs text-neutral-500">Total de aluguéis</p>
                  <p className="font-medium">{client.totalRentals}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-500">Valor gasto</p>
                  <p className="font-medium text-marsala">R$ {client.totalSpent.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex flex-col xs:flex-row gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 py-2 text-sm"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  Ver Detalhes
                </Button>
                <Button 
                  className="flex-1 py-2 text-sm text-marsala border border-marsala bg-transparent hover:bg-marsala-50"
                >
                  Agendar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Client Modal */}
      <Sheet open={isNewClientModalOpen} onOpenChange={setIsNewClientModalOpen}>
        <SheetContent side="right" className="sm:max-w-[600px] w-[90vw] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo Cliente</SheetTitle>
          </SheetHeader>
          <ClientForm 
            onSubmit={handleClientSubmit} 
            onCancel={handleClientCancel} 
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ClientsPage;
