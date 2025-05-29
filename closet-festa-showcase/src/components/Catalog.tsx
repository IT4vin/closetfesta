import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { ChevronLeft, ChevronRight, MessageCircle, Heart } from 'lucide-react';
import { STORE_CONFIG, generateWhatsAppUrl, generateInstagramUrl } from '../config/store';

const ProductImageCarousel = ({ images, productName }: { images: string[], productName: string }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="h-48 bg-gray-100 rounded mb-3 flex items-center justify-center">
        <span className="text-gray-400 text-sm">Imagem em breve</span>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative h-48 bg-gray-100 rounded mb-3 overflow-hidden group">
      <img
        src={images[currentImageIndex]}
        alt={`${productName} - Imagem ${currentImageIndex + 1}`}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = '/placeholder-product.jpg';
        }}
      />
      
      {images.length > 1 && (
        <>
          {/* Botões de navegação */}
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          
          {/* Indicadores */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const handleWhatsAppContact = (product: any) => {
  const message = STORE_CONFIG.messages.whatsappDefault(
    product.name,
    product.rentalPrice,
    product.category
  );
  
  const whatsappUrl = generateWhatsAppUrl(STORE_CONFIG.contacts.whatsapp, message);
  window.open(whatsappUrl, '_blank');
};

export default function Catalog() {
  const [categoryFilter, setCategoryFilter] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { products, categories, loading, error } = useProducts();

  // Filtrar produtos por categoria se selecionada
  const filteredProducts = categoryFilter 
    ? products.filter(product => product.category === categoryFilter)
    : products;

  const toggleFavorite = (productId: string) => {
    if (!STORE_CONFIG.catalog.enableFavorites) return;
    
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return newFavorites;
    });
  };

  console.log('Produtos carregados:', products.length);
  console.log('Produtos filtrados:', filteredProducts.length);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-center mb-4 text-marsala">
          {STORE_CONFIG.name} - Catálogo
        </h1>
        <p className="text-center text-gray-600 mb-4">
          {STORE_CONFIG.messages.welcomeMessage}
        </p>
        
        <div className="mb-4 flex gap-2">
          <select
            className="border rounded px-3 py-2 bg-white"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="">{STORE_CONFIG.catalog.defaultCategory} as categorias</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-lg">{STORE_CONFIG.messages.loadingMessage}</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <div className="text-red-600 font-semibold">{STORE_CONFIG.messages.errorMessage}:</div>
          <div className="text-red-500">{error}</div>
        </div>
      )}

      {!loading && !error && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-lg text-gray-600 mb-2">Nenhum produto encontrado</div>
          <div className="text-gray-500">
            {categoryFilter ? 'Tente selecionar uma categoria diferente' : STORE_CONFIG.messages.noProductsMessage}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="border rounded-lg shadow-sm p-4 bg-white hover:shadow-md transition-shadow relative">
            {/* Botão de favorito */}
            {STORE_CONFIG.catalog.enableFavorites && (
              <button
                onClick={() => toggleFavorite(product.id)}
                className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
              >
                <Heart 
                  className={`w-4 h-4 ${favorites.has(product.id) ? 'text-red-500 fill-red-500' : 'text-gray-400'}`}
                />
              </button>
            )}

            {/* Carousel de imagens ou placeholder */}
            <ProductImageCarousel images={product.images || []} productName={product.name} />
            
            <div className="space-y-3">
              <div className="font-bold text-lg text-gray-800">{product.name}</div>
              <div className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                {product.category}
              </div>
              {product.description && (
                <div className="text-sm text-gray-600 line-clamp-2">{product.description}</div>
              )}
              <div className="font-semibold text-xl text-marsala">
                {STORE_CONFIG.catalog.currencySymbol} {Number(product.rentalPrice).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                Tamanhos: {product.sizes.join(', ')}
              </div>
              {product.images && product.images.length > 0 && (
                <div className="text-xs text-gray-400">
                  {product.images.length} {product.images.length === 1 ? 'imagem' : 'imagens'}
                </div>
              )}
              
              {/* Botão de contato via WhatsApp */}
              {STORE_CONFIG.catalog.enableWhatsAppContact && (
                <button
                  onClick={() => handleWhatsAppContact(product)}
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Falar no WhatsApp
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Informação de contato da loja */}
      <div className="mt-12 bg-marsala/5 border border-marsala/20 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-marsala mb-2">
          {STORE_CONFIG.name}
        </h3>
        <p className="text-gray-600 mb-2">
          {STORE_CONFIG.description}
        </p>
        <div className="text-sm text-gray-500 mb-4">
          <div>{STORE_CONFIG.businessHours.weekdays}</div>
          <div>{STORE_CONFIG.businessHours.saturday}</div>
          <div>{STORE_CONFIG.businessHours.sunday}</div>
        </div>
        <div className="flex justify-center gap-4">
          <a
            href={generateWhatsAppUrl(STORE_CONFIG.contacts.whatsapp, 'Olá! Gostaria de saber mais sobre o catálogo de roupas.')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp Geral
          </a>
          <a
            href={generateInstagramUrl(STORE_CONFIG.contacts.instagram)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            📷 Instagram
          </a>
        </div>
      </div>

      {/* Informações de debug (remover em produção) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-50 rounded text-sm">
          <div><strong>Debug:</strong></div>
          <div>Total de produtos: {products.length}</div>
          <div>Produtos filtrados: {filteredProducts.length}</div>
          <div>Categorias: {categories.length}</div>
          <div>Filtro ativo: {categoryFilter || 'Nenhum'}</div>
          <div>Produtos com imagem: {products.filter(p => p.images && p.images.length > 0).length}</div>
          <div>Favoritos: {favorites.size}</div>
          <div>WhatsApp: {STORE_CONFIG.contacts.whatsapp}</div>
        </div>
      )}
    </div>
  );
} 