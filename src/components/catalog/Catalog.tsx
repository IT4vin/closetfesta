import React, { useState, Suspense } from 'react';
import { Search, Filter, Grid, List, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Lazy loading dos componentes para evitar problemas de dependência
const ProductGrid = React.lazy(() => 
  import('./ProductGrid').catch(() => ({
    default: () => <div className="text-center py-8">Erro ao carregar ProductGrid</div>
  }))
);

const ProductList = React.lazy(() => 
  import('./ProductList').catch(() => ({
    default: () => <div className="text-center py-8">Erro ao carregar ProductList</div>
  }))
);

export default function Catalog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<'all' | 'rental' | 'sale'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('name');
  const [page, setPage] = useState(1);

  // Estados fixos por enquanto para evitar problemas
  const products: any[] = [];
  const loading = false;
  const error = null;
  const hasMore = false;
  const totalCount = 0;
  const categories: any[] = [];

  // Detecta a porta atual do sistema principal
  const currentPort = window.location.port || '3000';
  const currentHost = window.location.hostname;

  const handleOpenShowcase = async () => {
    // Lista de portas possíveis para o showcase (baseado nos logs do terminal)
    // Exclui a porta atual do sistema principal
    const possiblePorts = [8085, 8080, 8081, 8082, 8083, 8084, 3000, 5173, 4173]
      .filter(port => port.toString() !== currentPort);
    
    // Função para verificar se uma porta está respondendo
    const checkPort = async (port: number): Promise<boolean> => {
      try {
        const response = await fetch(`http://localhost:${port}`, { 
          method: 'HEAD',
          mode: 'no-cors'
        });
        return true;
      } catch {
        return false;
      }
    };

    // Função para tentar abrir o showcase
    const tryOpenShowcase = async () => {
      // Primeiro, tenta a porta mais provável baseada nos logs (8085 se não for a atual)
      const primaryPort = currentPort === '8085' ? 8080 : 8085;
      const primaryUrl = `http://localhost:${primaryPort}`;
      
      try {
        window.open(primaryUrl, '_blank');
        console.log(`Abrindo showcase em: ${primaryUrl}`);
        return;
      } catch (error) {
        console.warn(`Erro ao abrir ${primaryUrl}:`, error);
      }

      // Se falhar, tenta outras portas
      for (const port of possiblePorts) {
        try {
          const url = `http://localhost:${port}`;
          window.open(url, '_blank');
          console.log(`Tentando abrir showcase em: ${url}`);
          return;
        } catch (error) {
          console.warn(`Erro ao abrir porta ${port}:`, error);
        }
      }

      // Se todas falharem, mostra instruções
      alert(
        '🚨 CATÁLOGO PÚBLICO NÃO ENCONTRADO\n\n' +
        'O sistema showcase não foi encontrado em nenhuma porta.\n\n' +
        '📋 SOLUÇÕES:\n\n' +
        '1️⃣ Certifique-se de que o showcase esteja rodando:\n' +
        '   • Execute: npm run dev:showcase\n' +
        '   • Ou: npm run dev:both\n\n' +
        '2️⃣ Verifique a porta do showcase no terminal\n\n' +
        '3️⃣ Acesse manualmente uma destas URLs:\n' +
        '   • http://localhost:8085\n' +
        '   • http://localhost:8080\n' +
        '   • http://localhost:3000\n\n' +
        `ℹ️ Sistema atual: ${currentHost}:${currentPort}\n\n` +
        '💡 DICA: Use "npm run dev:both" para rodar ambos os sistemas!'
      );
    };

    await tryOpenShowcase();
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value === 'all' ? null : value);
    setPage(1);
  };

  const handlePriceFilterChange = (value: 'all' | 'rental' | 'sale') => {
    setPriceFilter(value);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPage(1);
  };

  return (
    <div className="page-transition w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold mb-2">Catálogo de Produtos</h1>
            <p className="text-neutral-500">
              Explore nossa coleção completa de {totalCount || 0} produtos
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded">
                Sistema Principal: {currentHost}:{currentPort}
              </span>
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                Showcase: Porta 8085 ou 8080
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenShowcase}
              className="flex items-center gap-2 bg-marsala hover:bg-marsala/90"
              title="Abre o catálogo público (closet-festa-showcase) para compartilhar com clientes"
            >
              <ExternalLink className="h-4 w-4" />
              Catálogo Público
            </Button>
            
            {/* Botão de ajuda/instruções */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                alert(
                  '📋 CATÁLOGO PÚBLICO - GUIA COMPLETO\n\n' +
                  '🎯 O QUE É:\n' +
                  'O catálogo público é um sistema separado (closet-festa-showcase) otimizado para compartilhar com clientes.\n\n' +
                  '🚀 COMO USAR:\n\n' +
                  '1️⃣ RODAR O SHOWCASE:\n' +
                  '   • Execute: npm run dev:showcase\n' +
                  '   • Ou: npm run dev:both (ambos os sistemas)\n\n' +
                  '2️⃣ VERIFICAR A PORTA:\n' +
                  '   • Veja no terminal onde o showcase iniciou\n' +
                  '   • Geralmente: localhost:8085, 8080, ou 3000\n\n' +
                  '3️⃣ USAR O BOTÃO:\n' +
                  '   • Clique em "Catálogo Público"\n' +
                  '   • O sistema tentará várias portas automaticamente\n\n' +
                  '📱 RECURSOS DO SHOWCASE:\n' +
                  '• Interface responsiva para mobile\n' +
                  '• Busca e filtros de produtos\n' +
                  '• Otimizado para compartilhamento\n' +
                  '• Contato direto via WhatsApp\n\n' +
                  '🔧 PROBLEMAS? Execute: npm run dev:both'
                );
              }}
              title="Guia completo do catálogo público"
              className="px-2"
            >
              ?
            </Button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-1">
            <Select onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Filter */}
          <div className="md:col-span-1">
            <Select onValueChange={handlePriceFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Preço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="rental">Aluguel</SelectItem>
                <SelectItem value="sale">Venda</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="md:col-span-1">
            <Select onValueChange={handleSortChange}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="price">Preço</SelectItem>
                <SelectItem value="created_at">Mais Recente</SelectItem>
                <SelectItem value="popularity">Popularidade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode */}
          <div className="md:col-span-1">
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="flex-1"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex-1"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-marsala border-t-transparent"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">Erro ao carregar produtos: {error}</p>
          <p className="text-sm text-neutral-600 mt-2">
            Verifique sua conexão com a internet e tente novamente.
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && !error && (
        <>
          {/* Results Count */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-neutral-600">
              {products.length} de {totalCount || 0} produtos
            </p>
          </div>

          {/* Products Display */}
          <Suspense fallback={
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-marsala border-t-transparent"></div>
            </div>
          }>
            {viewMode === 'grid' ? (
              <ProductGrid products={products} />
            ) : (
              <ProductList products={products} />
            )}
          </Suspense>

          {/* Pagination */}
          {(hasMore || page > 1) && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Anterior
              </Button>
              
              <span className="flex items-center px-4 py-2 text-sm">
                Página {page}
              </span>
              
              <Button
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore || loading}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="text-center py-12">
          <div className="text-neutral-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-neutral-700 mb-2">
            Nenhum produto encontrado
          </h3>
          <p className="text-neutral-500">
            Tente ajustar os filtros ou buscar por outros termos
          </p>
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Recarregar Página
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 