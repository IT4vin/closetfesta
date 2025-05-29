// Configuração da loja - Closet Festa
export const STORE_CONFIG = {
  name: 'Closet Festa',
  description: 'Aluguel de roupas elegantes para ocasiões especiais',
  
  // Contatos (atualize com os dados reais)
  contacts: {
    whatsapp: '5511999999999', // Formato: código do país + DDD + número
    instagram: 'closetfesta',
    email: 'contato@closetfesta.com',
    website: 'https://closetfesta.com'
  },
  
  // Endereço (opcional)
  address: {
    street: 'Rua das Flores, 123',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567',
    country: 'Brasil'
  },
  
  // Horário de funcionamento
  businessHours: {
    weekdays: 'Segunda à Sexta: 9h às 18h',
    saturday: 'Sábado: 9h às 15h',
    sunday: 'Domingo: Fechado'
  },
  
  // Informações para SEO
  seo: {
    keywords: [
      'aluguel de roupas',
      'vestidos para festa',
      'roupas femininas',
      'closet festa',
      'moda',
      'aluguel',
      'vestidos elegantes',
      'roupas para formatura',
      'vestidos de madrinha'
    ],
    ogImage: '/og-image.jpg',
    favicon: '/favicon.ico'
  },
  
  // Configurações do catálogo
  catalog: {
    currency: 'BRL',
    currencySymbol: 'R$',
    defaultCategory: 'Todos',
    itemsPerPage: 12,
    enableFavorites: true,
    enableWhatsAppContact: true
  },
  
  // Mensagens padrão
  messages: {
    whatsappDefault: (productName: string, price: number, category: string) => 
      `Olá! Vi o produto "${productName}" no catálogo e gostaria de mais informações.

💫 *${productName}*
💰 Preço: R$ ${price.toFixed(2)}
📁 Categoria: ${category}

Poderia me ajudar com mais detalhes sobre disponibilidade e aluguel?`,
    
    welcomeMessage: 'Entre em contato via WhatsApp para alugar ou comprar seus produtos favoritos!',
    noProductsMessage: 'Ainda não há produtos cadastrados',
    loadingMessage: 'Carregando produtos...',
    errorMessage: 'Erro ao carregar produtos'
  }
};

// Funções auxiliares
export const formatWhatsAppNumber = (number: string): string => {
  return number.replace(/\D/g, '');
};

export const generateWhatsAppUrl = (number: string, message: string): string => {
  const formattedNumber = formatWhatsAppNumber(number);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
};

export const generateInstagramUrl = (username: string): string => {
  return `https://instagram.com/${username.replace('@', '')}`;
}; 