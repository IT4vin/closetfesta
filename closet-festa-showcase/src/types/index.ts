export type Size = "PP" | "P" | "M" | "G" | "GG" | "XG" | "único";

export interface Product {
  id: string;
  name: string;
  description: string;
  rentalPrice: number;
  salePrice: number | null;
  sizes: Size[];
  category: string;
  tags?: string[];
  featured?: boolean;
  contactLinks?: {
    whatsapp?: string;
    instagram?: string;
    shopee?: string;
  };
  images?: string[];
}

export interface StoreInfo {
  name: string;
  description: string;
  logo: string;
  theme: string;
  contacts: {
    whatsapp: string;
    instagram: string;
    shopee?: string;
  };
}

export interface User {
  email: string;
  isAdmin: boolean;
}
