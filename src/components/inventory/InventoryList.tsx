
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProducts, Product } from "@/hooks/useProducts";
import { AlertCircle, Pencil, Plus } from "lucide-react";
import FilterBar from "@/components/common/FilterBar";
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

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setTypeFilter("");
  };
  
  // Define filter options for FilterBar
  const selectFilters = [
    {
      name: "status",
      label: "Status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: "", label: "Todos os status" },
        { value: "available", label: "Disponível" },
        { value: "rented", label: "Alugado" },
        { value: "maintenance", label: "Manutenção" }
      ]
    },
    {
      name: "type",
      label: "Tipo",
      value: typeFilter,
      onChange: setTypeFilter,
      options: [
        { value: "", label: "Todos os tipos" },
        ...productTypes.map(type => ({ 
          value: type, 
          label: type 
        }))
      ]
    }
  ];
  
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
      {/* Header with add button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Inventário de Produtos</h2>
        <Button 
          onClick={handleAdd} 
          className="bg-marsala hover:bg-marsala-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Adicionar Produto
        </Button>
      </div>

      {/* Filtros e busca */}
      <FilterBar
        searchPlaceholder="Buscar produtos por nome ou SKU..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        selectFilters={selectFilters}
        onFilterClick={resetFilters}
      />
      
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
          <Button variant="outline" className="mt-4" onClick={resetFilters}>
            <AlertCircle className="h-4 w-4 mr-2" />
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
