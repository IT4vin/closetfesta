import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Package, ShoppingCart, Users, Settings, TrendingUp, Edit } from "lucide-react";
import ProductManagement from "@/components/admin/ProductManagement";
import OrderManagement from "@/components/admin/OrderManagement";
import AdvancedSettings from "@/components/admin/AdvancedSettings";
import BulkProductEditor from "@/components/admin/BulkProductEditor";

const AdminDashboard = () => {
  const { currentUser, storeInfo, updateStoreInfo, products } = useAppContext();
  
  // Redirect if not logged in
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  const [name, setName] = useState(storeInfo.name);
  const [description, setDescription] = useState(storeInfo.description);
  const [logo, setLogo] = useState(storeInfo.logo);
  const [theme, setTheme] = useState(storeInfo.theme);
  const [whatsapp, setWhatsapp] = useState(storeInfo.contacts.whatsapp);
  const [instagram, setInstagram] = useState(storeInfo.contacts.instagram);
  const [shopee, setShopee] = useState(storeInfo.contacts.shopee || "");
  const [isLoading, setIsLoading] = useState(false);
  
  // Update local state when storeInfo changes
  useEffect(() => {
    setName(storeInfo.name);
    setDescription(storeInfo.description);
    setLogo(storeInfo.logo);
    setTheme(storeInfo.theme);
    setWhatsapp(storeInfo.contacts.whatsapp);
    setInstagram(storeInfo.contacts.instagram);
    setShopee(storeInfo.contacts.shopee || "");
  }, [storeInfo]);
  
  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      await updateStoreInfo({
        name,
        description,
        logo,
        theme,
        contacts: {
          whatsapp,
          instagram,
          shopee: shopee || undefined
        }
      });
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsLoading(false);
    }
  };

  // Statistics calculations
  const totalProducts = products.length;
  const featuredProducts = products.filter(p => p.featured).length;
  const rentalProducts = products.filter(p => p.rentalPrice > 0).length;
  const saleProducts = products.filter(p => p.salePrice !== null).length;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-marsala text-white p-3 rounded-full">
          <Settings className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-marsala">Painel de Administração</h1>
          <p className="text-gray-600">Gerencie sua loja e produtos</p>
        </div>
      </div>
      
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="store" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Loja
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="bulk-edit" className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Editor Massa
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Avançado
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-marsala mb-6">Visão Geral</h2>
            
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-marsala">{totalProducts}</div>
                  <p className="text-xs text-muted-foreground">
                    {featuredProducts} em destaque
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Para Aluguel</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{rentalProducts}</div>
                  <p className="text-xs text-muted-foreground">
                    Produtos disponíveis para aluguel
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Para Venda</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{saleProducts}</div>
                  <p className="text-xs text-muted-foreground">
                    Produtos disponíveis para venda
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Categorias</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {new Set(products.map(p => p.category)).size}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Categorias ativas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Produtos Recentes */}
            <Card>
              <CardHeader>
                <CardTitle>Produtos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <div className="flex gap-2">
                            <Badge variant="secondary">{product.category}</Badge>
                            {product.featured && <Badge className="bg-gold">Destaque</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">R$ {product.rentalPrice}</p>
                        <p className="text-sm text-gray-600">aluguel</p>
                      </div>
                    </div>
                  ))}
                  {products.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      Nenhum produto cadastrado ainda
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="store" className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-6">Informações da Loja</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="store-name">Nome da Loja</Label>
                  <Input 
                    id="store-name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome da sua loja"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="store-logo">URL do Logo</Label>
                  <Input 
                    id="store-logo" 
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="store-desc">Descrição</Label>
                <Textarea 
                  id="store-desc" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva sua loja em algumas palavras..."
                  rows={4}
                  className="resize-none"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="store-theme">Tema (Cor Principal)</Label>
                <Input 
                  id="store-theme" 
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="marsala"
                />
                <p className="text-sm text-gray-500">Exemplos: marsala, gold, black, purple</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-6">Contatos</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input 
                    id="whatsapp" 
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="5511999999999"
                  />
                  <p className="text-xs text-gray-500">Apenas números, com código do país e DDD</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input 
                    id="instagram" 
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="sua_loja"
                  />
                  <p className="text-xs text-gray-500">Apenas o nome de usuário, sem @ ou URL</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shopee">Shopee (opcional)</Label>
                <Input 
                  id="shopee" 
                  value={shopee}
                  onChange={(e) => setShopee(e.target.value)}
                  placeholder="sua_loja_shopee"
                />
                <p className="text-xs text-gray-500">Apenas o nome da loja, sem URL</p>
              </div>
              
              <Button 
                className="mt-4 bg-marsala hover:bg-marsala-dark"
                onClick={handleSaveSettings}
                disabled={isLoading}
              >
                {isLoading ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="products">
          <ProductManagement />
        </TabsContent>
        
        <TabsContent value="bulk-edit">
          <BulkProductEditor />
        </TabsContent>
        
        <TabsContent value="orders">
          <OrderManagement />
        </TabsContent>

        <TabsContent value="advanced">
          <AdvancedSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
