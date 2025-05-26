
import { Product, StoreInfo } from "../types";

export const storeInfo: StoreInfo = {
  name: "Closet Festa",
  description: "Aluguel e venda de vestidos para todas as ocasiões especiais. Encontre o modelo perfeito para madrinhas, formaturas e eventos!",
  logo: "/placeholder.svg", // We'll use placeholder until admin uploads
  theme: "marsala",
  contacts: {
    whatsapp: "5511999999999",
    instagram: "closetfesta",
    shopee: "closetfesta"
  }
};

export const dummyProducts: Product[] = [
  {
    id: "1",
    name: "Vestido Longo Aurora",
    description: "Vestido longo em cetim com decote coração, ideal para madrinhas de casamento ou formandas.",
    rentalPrice: 150,
    salePrice: 350,
    sizes: ["P", "M", "G"],
    category: "Longo",
    tags: ["novo", "mais alugado"],
    featured: true,
    contactLinks: {
      whatsapp: "5511999999999",
      instagram: "closetfesta"
    }
  },
  {
    id: "2",
    name: "Vestido Curto Cereja",
    description: "Vestido curto em paetê com alças finas e brilho discreto, perfeito para festas noturnas.",
    rentalPrice: 100,
    salePrice: 280,
    sizes: ["PP", "P", "M"],
    category: "Curto",
    tags: ["promoção"],
    contactLinks: {
      whatsapp: "5511999999999",
      instagram: "closetfesta"
    }
  },
  {
    id: "3",
    name: "Vestido Midi Pérola",
    description: "Vestido midi em crepe com aplicações de pérolas, elegante e confortável para eventos formais.",
    rentalPrice: 120,
    salePrice: 300,
    sizes: ["P", "M", "G", "GG"],
    category: "Midi",
    featured: true,
    contactLinks: {
      whatsapp: "5511999999999",
      instagram: "closetfesta"
    }
  },
  {
    id: "4",
    name: "Vestido Sereia Esmeralda",
    description: "Vestido longo modelo sereia em veludo, com cauda e decote nas costas. Perfeito para madrinhas.",
    rentalPrice: 180,
    salePrice: 400,
    sizes: ["P", "M", "G"],
    category: "Longo",
    tags: ["mais alugado"],
    contactLinks: {
      whatsapp: "5511999999999",
      instagram: "closetfesta",
      shopee: "closetfesta"
    }
  },
  {
    id: "5",
    name: "Vestido Princesa Safira",
    description: "Vestido longo estilo princesa com saia ampla em tule e corpete bordado.",
    rentalPrice: 200,
    salePrice: 450,
    sizes: ["P", "M", "G"],
    category: "Longo",
    tags: ["novo"],
    featured: true,
    contactLinks: {
      whatsapp: "5511999999999",
      instagram: "closetfesta"
    }
  },
  {
    id: "6",
    name: "Conjunto Ametista",
    description: "Conjunto de saia longa e cropped em cetim, moderno e versátil para eventos especiais.",
    rentalPrice: 130,
    salePrice: 320,
    sizes: ["P", "M"],
    category: "Conjunto",
    contactLinks: {
      whatsapp: "5511999999999",
      instagram: "closetfesta",
      shopee: "closetfesta"
    }
  },
  {
    id: "7",
    name: "Vestido Curto Rubi",
    description: "Vestido curto com mangas em renda e saia fluida, ideal para convidadas de casamento diurno.",
    rentalPrice: 90,
    salePrice: 260,
    sizes: ["PP", "P", "M", "G"],
    category: "Curto",
    tags: ["promoção"],
    contactLinks: {
      whatsapp: "5511999999999",
      instagram: "closetfesta"
    }
  },
  {
    id: "8",
    name: "Vestido Longo Topázio",
    description: "Vestido longo com fenda lateral e aplicações em pedraria no busto. Elegância garantida!",
    rentalPrice: 170,
    salePrice: 380,
    sizes: ["M", "G", "GG"],
    category: "Longo",
    tags: ["mais alugado"],
    featured: true,
    contactLinks: {
      whatsapp: "5511999999999",
      instagram: "closetfesta"
    }
  },
];
