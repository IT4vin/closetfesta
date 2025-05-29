export interface ClientAddress {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface ClientMeasurements {
  bust?: string;
  waist?: string;
  hips?: string;
  height?: string;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  document: string;
  birthdate?: string;
  address?: string; // Endereço completo (para compatibilidade)
  addressDetails?: ClientAddress; // Endereço detalhado
  measurements?: ClientMeasurements;
  notes?: string;
  createdAt?: string;
  totalRentals?: number;
  totalSpent?: number;
  lastRental?: string;
  status?: 'active' | 'inactive' | 'vip';
}

export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  address: ClientAddress;
  birthdate: string;
  document: string;
  measurements: ClientMeasurements;
  notes: string;
} 