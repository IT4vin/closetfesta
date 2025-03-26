
import React from "react";
import MainLayout from "../components/layout/MainLayout";
import { Search, Plus, Filter, Mail, Phone, Calendar } from "lucide-react";

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
  return (
    <MainLayout>
      <div className="page-transition">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Clientes</h1>
            <p className="text-neutral-500 text-lg">Gerencie seus clientes e histórico de aluguéis</p>
          </div>
          
          <div className="flex gap-4">
            <button className="secondary-button py-3 px-6 text-base">
              <Filter size={20} className="mr-2" />
              <span>Filtrar</span>
            </button>
            <button className="primary-button py-3 px-6 text-base">
              <Plus size={20} className="mr-2" />
              <span>Novo Cliente</span>
            </button>
          </div>
        </header>
        
        <div className="premium-card mb-8 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
              <input 
                type="text" 
                placeholder="Buscar clientes por nome, email ou telefone..." 
                className="input-field pl-12 py-3 text-base"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <select className="input-field py-3 text-base">
                <option>Todos os clientes</option>
                <option>Ativos</option>
                <option>Inativos</option>
                <option>VIP</option>
              </select>
              
              <select className="input-field py-3 text-base">
                <option>Ordenar por Nome</option>
                <option>Maior Gasto</option>
                <option>Maior Frequência</option>
                <option>Mais Recente</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {clients.map((client) => (
            <div key={client.id} className="premium-card p-6 card-hover">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="font-medium text-xl">{client.name}</h3>
                  <p className="text-base text-neutral-500">Cliente desde {client.lastRental}</p>
                </div>
                <div className="w-12 h-12 bg-marsala rounded-full flex items-center justify-center text-white font-medium text-lg">
                  {client.name.charAt(0)}
                </div>
              </div>
              
              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-3 text-base">
                  <Mail size={20} className="text-neutral-400" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center gap-3 text-base">
                  <Phone size={20} className="text-neutral-400" />
                  <span>{client.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-base">
                  <Calendar size={20} className="text-neutral-400" />
                  <span>Último aluguel: {client.lastRental}</span>
                </div>
              </div>
              
              <div className="border-t border-neutral-100 pt-4 flex justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Total de aluguéis</p>
                  <p className="font-medium text-lg">{client.totalRentals}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-neutral-500">Valor gasto</p>
                  <p className="font-medium text-lg text-marsala">R$ {client.totalSpent.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="mt-5 flex gap-3">
                <button className="flex-1 py-3 text-base text-center border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors">
                  Ver Detalhes
                </button>
                <button className="flex-1 py-3 text-base text-center text-marsala border border-marsala rounded-md hover:bg-marsala-50 transition-colors">
                  Agendar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default ClientsPage;
