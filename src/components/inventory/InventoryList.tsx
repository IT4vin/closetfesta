
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProducts, Product } from "@/hooks/useProducts";
import { Search, FilterX, Plus, Pencil, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InventoryForm from "./InventoryForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const InventoryList = () => {
  const { productsList } = useProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  
  // Tipos de produtos únicos
  const productTypes = Array.from(new Set(productsList.map(product => product.type)));
  
  // Filtrar produtos com base nos critérios
  const filteredProducts = productsList.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "" || product.status === statusFilter;
    const matchesType = typeFilter === "" || product.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });
  
  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setShowForm(true);
  };
  
  const handleAdd = () => {
    setEditProduct(null);
    setShowForm(true);
  };
  
  const handleCloseForm = () => {
    setShowForm(false);
    setEditProduct(null);
  };
  
  // Função para definir cor do badge de status
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'available':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Disponível</Badge>;
      case 'rented':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Alugado</Badge>;
      default:
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Manutenção</Badge>;
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Filtros e busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os status</SelectItem>
              <SelectItem value="available">Disponível</SelectItem>
              <SelectItem value="rented">Alugado</SelectItem>
              <SelectItem value="maintenance">Manutenção</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os tipos</SelectItem>
              {productTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={() => {
            setSearchTerm("");
            setStatusFilter("");
            setTypeFilter("");
          }}>
            <FilterX className="h-4 w-4" />
          </Button>
          
          <Button onClick={handleAdd} className="bg-marsala hover:bg-marsala-700">
            <Plus className="h-4 w-4 mr-2" /> Adicionar
          </Button>
        </div>
      </div>
      
      {/* Tabela de estoque */}
      {filteredProducts.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map(product => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.sku}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.type}</TableCell>
                  <TableCell>{product.size}</TableCell>
                  <TableCell>{product.color}</TableCell>
                  <TableCell>{getStatusBadge(product.status)}</TableCell>
                  <TableCell>R$ {product.rentalPrice}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-10 text-center border rounded-lg">
          <AlertCircle className="h-8 w-8 text-neutral-400 mb-2" />
          <h3 className="text-lg font-medium">Nenhum produto encontrado</h3>
          <p className="text-sm text-neutral-500 max-w-md mt-1">
            Não encontramos produtos que correspondam aos seus critérios de busca. 
            Tente ajustar os filtros ou adicione novos produtos.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => {
            setSearchTerm("");
            setStatusFilter("");
            setTypeFilter("");
          }}>
            <FilterX className="h-4 w-4 mr-2" />
            Limpar filtros
          </Button>
        </div>
      )}
      
      {/* Formulário de edição/adição em modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Editar Produto" : "Adicionar Produto"}</DialogTitle>
          </DialogHeader>
          <InventoryForm product={editProduct} onClose={handleCloseForm} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryList;
