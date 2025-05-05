
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Filter, Mail, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  
  // Filter clients based on search term
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );
  
  return (
    <div className="page-transition w-full px-4 md:px-6 overflow-hidden">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 md:mb-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold mb-1 md:mb-2">Clientes</h1>
          <p className="text-neutral-500 text-sm md:text-lg">Gerencie seus clientes e histórico de aluguéis</p>
        </div>
        
        <div className="flex gap-2 md:gap-4 mt-2 md:mt-0">
          <Button 
            variant="outline" 
            className="border-neutral-200 text-neutral-700 hover:bg-neutral-50"
            size="sm"
            md-size="default"
          >
            <Filter size={18} className="mr-1 md:mr-2" />
            <span>Filtrar</span>
          </Button>
          <Button 
            className="bg-marsala hover:bg-marsala-700"
            size="sm"
            md-size="default"
          >
            <Plus size={18} className="mr-1 md:mr-2" />
            <span>Novo Cliente</span>
          </Button>
        </div>
      </header>
      
      <div className="premium-card mb-4 md:mb-8 p-3 md:p-5 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar clientes por nome, email ou telefone..." 
              className="input-field pl-10 md:pl-12 py-2 md:py-3 text-sm md:text-base w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto mt-2 md:mt-0">
            <select className="input-field py-2 md:py-3 text-sm md:text-base w-1/2 md:w-auto">
              <option>Todos os clientes</option>
              <option>Ativos</option>
              <option>Inativos</option>
              <option>VIP</option>
            </select>
            
            <select className="input-field py-2 md:py-3 text-sm md:text-base w-1/2 md:w-auto">
              <option>Ordenar por Nome</option>
              <option>Maior Gasto</option>
              <option>Maior Frequência</option>
              <option>Mais Recente</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
        {filteredClients.map((client) => (
          <div key={client.id} className="premium-card p-4 md:p-6 card-hover w-full">
            <div className="flex justify-between items-start mb-4 md:mb-5">
              <div>
                <h3 className="font-medium text-lg md:text-xl">{client.name}</h3>
                <p className="text-sm md:text-base text-neutral-500">Cliente desde {client.lastRental}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-marsala rounded-full flex items-center justify-center text-white font-medium text-lg">
                {client.name.charAt(0)}
              </div>
            </div>
            
            <div className="space-y-2 md:space-y-3 mb-4 md:mb-5">
              <div className="flex items-center gap-2 md:gap-3 text-sm md:text-base">
                <Mail size={18} className="text-neutral-400 flex-shrink-0" />
                <span className="truncate">{client.email}</span>
              </div>
              <div className="flex items-center gap-2 md:gap-3 text-sm md:text-base">
                <Phone size={18} className="text-neutral-400 flex-shrink-0" />
                <span>{client.phone}</span>
              </div>
              <div className="flex items-center gap-2 md:gap-3 text-sm md:text-base">
                <Calendar size={18} className="text-neutral-400 flex-shrink-0" />
                <span>Último aluguel: {client.lastRental}</span>
              </div>
            </div>
            
            <div className="border-t border-neutral-100 pt-3 md:pt-4 flex justify-between">
              <div>
                <p className="text-xs md:text-sm text-neutral-500">Total de aluguéis</p>
                <p className="font-medium text-base md:text-lg">{client.totalRentals}</p>
              </div>
              <div className="text-right">
                <p className="text-xs md:text-sm text-neutral-500">Valor gasto</p>
                <p className="font-medium text-base md:text-lg text-marsala">R$ {client.totalSpent.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="mt-4 md:mt-5 flex gap-2 md:gap-3">
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
        ))}
      </div>
    </div>
  );
};

export default ClientsPage;
