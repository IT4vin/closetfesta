
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  DollarSign, 
  Tag, 
  Scissors, 
  Clock, 
  Users, 
  ShoppingBag 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ProductForm from "@/components/products/ProductForm";
import RentalHistoryTable from "@/components/products/RentalHistoryTable";
import MaintenanceHistoryTable from "@/components/products/MaintenanceHistoryTable";

// Sample data (would come from an API in a real app)
const products = [
  {
    id: 1,
    name: "Vestido de Noiva Elegance",
    description: "Vestido longo de cetim com bordados",
    type: "Vestido",
    subtype: "Noiva",
    price: 1200,
    rentalPrice: 300,
    image: "https://images.unsplash.com/photo-1594552072238-5b1076134e85?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    status: "available",
    size: "M",
    color: "Branco",
    sku: "VEST-001",
    dateAdded: "2023-10-12",
    material: "Cetim e renda",
    cleaningInstructions: "Lavagem a seco apenas",
    notes: "Bordado feito à mão",
    location: "Prateleira A3",
    condition: "Excelente"
  }
];

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  
  // In a real app, fetch the product by id from an API
  const productId = parseInt(id || "0");
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <h1 className="text-2xl font-semibold mb-4">Produto não encontrado</h1>
        <Button onClick={() => navigate("/products")}>
          Voltar para Produtos
        </Button>
      </div>
    );
  }
  
  const handleEditProduct = () => {
    setIsEditModalOpen(true);
  };
  
  const handleRentProduct = () => {
    setIsRentalModalOpen(true);
  };
  
  const handleFormSubmit = (data: any) => {
    // In a real app, save the data to the backend
    console.log("Updated product data:", data);
    toast({
      title: "Produto atualizado",
      description: "As alterações foram salvas com sucesso."
    });
    setIsEditModalOpen(false);
  };
  
  const handleScheduleMaintenance = () => {
    toast({
      title: "Manutenção agendada",
      description: "A manutenção foi agendada com sucesso."
    });
  };
  
  return (
    <div className="page-transition">
      {/* Header with navigation and actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/products")}
            className="h-10 w-10"
          >
            <ArrowLeft size={18} />
          </Button>
          
          <div>
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            <p className="text-neutral-500">SKU: {product.sku}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleScheduleMaintenance}
            className="border-marsala text-marsala hover:bg-marsala/10"
          >
            <Scissors size={18} className="mr-2" />
            <span>Agendar Manutenção</span>
          </Button>
          
          <Button
            variant="outline" 
            onClick={handleEditProduct}
          >
            <Edit size={18} className="mr-2" />
            <span>Editar</span>
          </Button>
          
          <Button 
            onClick={handleRentProduct}
            className="bg-marsala hover:bg-marsala-700"
          >
            <Calendar size={18} className="mr-2" />
            <span>Alugar</span>
          </Button>
        </div>
      </div>
      
      {/* Product content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Image */}
        <div className="lg:col-span-1">
          <div className="premium-card p-0 overflow-hidden">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-auto object-cover aspect-[3/4]"
            />
            
            <div className="p-5">
              <div className="flex justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Preço</h3>
                  <p className="text-2xl font-bold text-marsala">
                    R$ {product.rentalPrice.toFixed(2)}
                    <span className="text-sm text-neutral-500 font-normal">/diária</span>
                  </p>
                </div>
                
                <div className="text-right">
                  <h3 className="font-semibold text-lg">Status</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    product.status === 'available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {product.status === 'available' ? 'Disponível' : 'Alugado'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="border border-neutral-200 rounded-md p-3">
                  <p className="text-sm text-neutral-500">Tamanho</p>
                  <p className="font-medium">{product.size}</p>
                </div>
                
                <div className="border border-neutral-200 rounded-md p-3">
                  <p className="text-sm text-neutral-500">Cor</p>
                  <p className="font-medium">{product.color}</p>
                </div>
                
                <div className="border border-neutral-200 rounded-md p-3">
                  <p className="text-sm text-neutral-500">Categoria</p>
                  <p className="font-medium">{product.type}</p>
                </div>
                
                <div className="border border-neutral-200 rounded-md p-3">
                  <p className="text-sm text-neutral-500">Subcategoria</p>
                  <p className="font-medium">{product.subtype}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <Button 
                  className="w-full bg-marsala hover:bg-marsala-700"
                  onClick={handleRentProduct}
                >
                  <Calendar size={18} className="mr-2" />
                  <span>Alugar Agora</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right column - Details and History tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="details" className="premium-card">
            <TabsList className="mb-6 bg-neutral-100">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="history">Histórico de Aluguéis</TabsTrigger>
              <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="p-2">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Tag size={18} className="text-neutral-400" />
                    <h3 className="font-medium">Tipo de Produto</h3>
                  </div>
                  <p className="text-neutral-700 pl-7">{product.type} - {product.subtype}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <DollarSign size={18} className="text-neutral-400" />
                    <h3 className="font-medium">Preço de Compra</h3>
                  </div>
                  <p className="text-neutral-700 pl-7">R$ {product.price.toFixed(2)}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-neutral-400" />
                    <h3 className="font-medium">Data de Aquisição</h3>
                  </div>
                  <p className="text-neutral-700 pl-7">{product.dateAdded}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={18} className="text-neutral-400" />
                    <h3 className="font-medium">Localização no Estoque</h3>
                  </div>
                  <p className="text-neutral-700 pl-7">{product.location}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium mb-2">Descrição</h3>
                <p className="text-neutral-700">{product.description}</p>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium mb-2">Material</h3>
                <p className="text-neutral-700">{product.material}</p>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium mb-2">Instruções de Limpeza</h3>
                <p className="text-neutral-700">{product.cleaningInstructions}</p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Observações</h3>
                <p className="text-neutral-700">{product.notes}</p>
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="p-2">
              <RentalHistoryTable productId={product.id} />
            </TabsContent>
            
            <TabsContent value="maintenance" className="p-2">
              <MaintenanceHistoryTable productId={product.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Edit Product Modal */}
      <Sheet open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <SheetContent side="right" className="sm:max-w-[900px] w-[90vw] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Produto</SheetTitle>
          </SheetHeader>
          <ProductForm 
            initialData={product} 
            onSubmit={handleFormSubmit} 
            onCancel={() => setIsEditModalOpen(false)} 
          />
        </SheetContent>
      </Sheet>
      
      {/* Rental Modal */}
      <Sheet open={isRentalModalOpen} onOpenChange={setIsRentalModalOpen}>
        <SheetContent side="right" className="sm:max-w-[600px] w-[90vw] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo Aluguel</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {/* We'll use the existing NovoLancamentoForm component */}
            <p className="mb-4">Produto selecionado: <strong>{product.name}</strong></p>
            {/* In a real implementation, you would pre-fill the form with the selected product */}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ProductDetail;
