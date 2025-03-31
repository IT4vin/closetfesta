
import React, { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { 
  ChevronDown, 
  Plus, 
  Edit, 
  Trash, 
  Search,
  Check,
  X,
  AlertCircle,
  History
} from "lucide-react";

// Dados de exemplo para a tabela de usuários
const usersData = [
  { 
    id: 1, 
    name: "Ana Silva", 
    email: "ana.silva@email.com", 
    role: "Administrador", 
    lastLogin: "12/05/2023 14:30",
    status: "active" 
  },
  { 
    id: 2, 
    name: "Carlos Santos", 
    email: "carlos.santos@email.com", 
    role: "Gerente", 
    lastLogin: "10/05/2023 09:15",
    status: "active" 
  },
  { 
    id: 3, 
    name: "Mariana Souza", 
    email: "mariana.souza@email.com", 
    role: "Atendente", 
    lastLogin: "11/05/2023 16:45",
    status: "inactive" 
  },
  { 
    id: 4, 
    name: "Paulo Oliveira", 
    email: "paulo.oliveira@email.com", 
    role: "Estoquista", 
    lastLogin: "09/05/2023 11:20",
    status: "active" 
  }
];

// Dados de exemplo para permissões
const permissionsData = [
  { id: "clients_view", module: "Clientes", action: "Visualizar", description: "Ver lista de clientes" },
  { id: "clients_create", module: "Clientes", action: "Criar", description: "Cadastrar novos clientes" },
  { id: "clients_edit", module: "Clientes", action: "Editar", description: "Alterar dados de clientes" },
  { id: "clients_delete", module: "Clientes", action: "Deletar", description: "Remover clientes do sistema" },
  
  { id: "products_view", module: "Produtos", action: "Visualizar", description: "Ver lista de vestidos" },
  { id: "products_create", module: "Produtos", action: "Criar", description: "Cadastrar novos vestidos" },
  { id: "products_edit", module: "Produtos", action: "Editar", description: "Alterar dados de vestidos" },
  { id: "products_delete", module: "Produtos", action: "Deletar", description: "Remover vestidos do sistema" },
  
  { id: "financial_view", module: "Financeiro", action: "Visualizar", description: "Ver dados financeiros" },
  { id: "financial_create", module: "Financeiro", action: "Criar", description: "Registrar transações financeiras" },
  { id: "financial_edit", module: "Financeiro", action: "Editar", description: "Alterar dados financeiros" },
  
  { id: "settings_view", module: "Configurações", action: "Visualizar", description: "Ver configurações do sistema" },
  { id: "settings_edit", module: "Configurações", action: "Editar", description: "Alterar configurações do sistema" },
];

// Dados de exemplo para perfis pré-definidos
const roleProfiles = [
  { 
    id: 1, 
    name: "Administrador", 
    description: "Acesso completo ao sistema", 
    permissions: permissionsData.map(p => p.id)
  },
  { 
    id: 2, 
    name: "Gerente", 
    description: "Acesso a quase todas as funções, exceto configurações avançadas", 
    permissions: permissionsData.filter(p => p.id !== "settings_edit").map(p => p.id)
  },
  { 
    id: 3, 
    name: "Atendente", 
    description: "Acesso a funções de clientes e produtos (sem deletar)", 
    permissions: ["clients_view", "clients_create", "clients_edit", "products_view"]
  },
  { 
    id: 4, 
    name: "Estoquista", 
    description: "Acesso a funções de produtos", 
    permissions: ["products_view", "products_create", "products_edit"]
  },
];

const UserPermissions = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState(0);
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Filtra usuários com base na busca
  const filteredUsers = usersData.filter(user => 
    user.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  );
  
  const handleSelectRole = (roleId: number) => {
    setSelectedRoleId(roleId);
    const rolePermissions = roleProfiles.find(r => r.id === roleId)?.permissions || [];
    setCustomPermissions(rolePermissions);
  };
  
  const handleTogglePermission = (permissionId: string) => {
    setCustomPermissions(prev => 
      prev.includes(permissionId) 
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };
  
  // Exemplo de histórico de mudanças
  const permissionHistory = [
    { date: "12/05/2023 14:35", user: "Admin", action: "Adicionou permissão", details: "Deletar Clientes para Ana Silva" },
    { date: "10/05/2023 09:20", user: "Admin", action: "Removeu permissão", details: "Editar Configurações de Carlos Santos" },
    { date: "08/05/2023 11:15", user: "Admin", action: "Alterou perfil", details: "Mariana Souza de Atendente para Gerente" },
    { date: "05/05/2023 16:30", user: "Admin", action: "Criou usuário", details: "Paulo Oliveira como Estoquista" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-3 text-gray-400" size={16} />
          <Input 
            placeholder="Buscar usuários..." 
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="pl-10" 
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowHistory(true)}
          >
            <History size={16} className="mr-2" />
            Histórico
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus size={16} className="mr-2" />
                Novo Perfil
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Perfil de Acesso</DialogTitle>
                <DialogDescription>
                  Defina um novo conjunto de permissões para atribuir aos usuários.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Nome do Perfil</Label>
                  <Input id="profile-name" placeholder="Ex: Gerente de Vendas" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-desc">Descrição</Label>
                  <Input id="profile-desc" placeholder="Descreva a função deste perfil" />
                </div>
                <div className="space-y-2">
                  <Label>Selecione as Permissões</Label>
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                    {permissionsData.map((permission) => (
                      <div key={permission.id} className="flex items-start space-x-2">
                        <Checkbox id={permission.id} />
                        <label
                          htmlFor={permission.id}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          <div className="font-medium">{permission.module} - {permission.action}</div>
                          <p className="text-xs text-gray-500">{permission.description}</p>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button>Salvar Perfil</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Último Acesso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.lastLogin}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full mr-2 ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      {user.status === 'active' ? 'Ativo' : 'Inativo'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Edit size={16} />
                          <span className="sr-only">Editar</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Gerenciar Permissões - {selectedUser?.name}</DialogTitle>
                          <DialogDescription>
                            Configure as permissões de acesso para este usuário.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                          <div>
                            <Label className="text-base">Perfil de Acesso</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                              {roleProfiles.map((role) => (
                                <div
                                  key={role.id}
                                  className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-muted ${
                                    selectedRoleId === role.id ? 'border-primary bg-primary/10' : ''
                                  }`}
                                  onClick={() => handleSelectRole(role.id)}
                                >
                                  <div className="font-medium">{role.name}</div>
                                  <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between">
                              <Label className="text-base">Permissões Personalizadas</Label>
                              <Button variant="outline" size="sm" onClick={() => setCustomPermissions([])}>
                                Limpar
                              </Button>
                            </div>
                            <div className="border rounded-lg mt-2 overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Módulo</TableHead>
                                    <TableHead>Ação</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead className="w-[100px] text-center">Permitir</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {permissionsData.map((permission) => (
                                    <TableRow key={permission.id}>
                                      <TableCell>{permission.module}</TableCell>
                                      <TableCell>{permission.action}</TableCell>
                                      <TableCell className="text-sm text-gray-500">{permission.description}</TableCell>
                                      <TableCell className="text-center">
                                        <Checkbox 
                                          checked={customPermissions.includes(permission.id)}
                                          onCheckedChange={() => handleTogglePermission(permission.id)}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                          </DialogClose>
                          <Button>Salvar Alterações</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash size={16} />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso removerá permanentemente o usuário
                            e todas as suas permissões do sistema.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <ChevronDown size={16} />
                          <span className="sr-only">Mais</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Check size={14} className="mr-2" />
                          Ativar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <X size={14} className="mr-2" />
                          Desativar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <AlertCircle size={14} className="mr-2" />
                          Forçar redefinição de senha
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Alterações de Permissões</DialogTitle>
            <DialogDescription>
              Registro de todas as mudanças realizadas nas permissões dos usuários.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Administrador</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionHistory.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>{entry.user}</TableCell>
                    <TableCell>{entry.action}</TableCell>
                    <TableCell>{entry.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistory(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Missing Label component
const Label = ({ htmlFor, className, children }: { htmlFor?: string, className?: string, children: React.ReactNode }) => {
  return (
    <label htmlFor={htmlFor} className={`text-sm font-medium ${className}`}>
      {children}
    </label>
  );
};

export default UserPermissions;
