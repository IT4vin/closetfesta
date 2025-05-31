import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash, 
  Search,
  Shield,
  Eye,
  EyeOff,
  Save,
  UserPlus,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MoreHorizontal,
  Key,
  Mail,
  Phone,
  Calendar,
  Building,
  UserCheck,
  UserX,
  History
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import UserPermissionsEditor from "./UserPermissionsEditor";

// Interfaces
interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  cpf: string;
  birth_date: string;
  address: string;
  hire_date: string;
  department: string;
  position: string;
  salary: number;
  role_id: number;
  role_name: string;
  status: 'active' | 'inactive' | 'pending';
  last_login: string;
  created_at: string;
  permissions: string[];
}

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  is_default: boolean;
  users_count: number;
}

interface Permission {
  id: string;
  module: string;
  action: string;
  description: string;
  category: string;
}

interface UserFormData {
  full_name: string;
  email: string;
  phone: string;
  cpf: string;
  birth_date: string;
  address: string;
  department: string;
  position: string;
  salary: number;
  role_id: number;
  password: string;
  confirm_password: string;
  send_welcome_email: boolean;
  permissions: string[];
}

const UserManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions'>('users');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPermissionsEditor, setShowPermissionsEditor] = useState(false);

  // Dados simulados
  const usersData: User[] = [
    {
      id: 1,
      full_name: "Ana Silva Santos",
      email: "ana.silva@closetfesta.com",
      phone: "(11) 98765-4321",
      cpf: "123.456.789-00",
      birth_date: "1985-03-15",
      address: "Rua das Flores, 123 - São Paulo/SP",
      hire_date: "2023-01-15",
      department: "Administração",
      position: "Gerente Geral",
      salary: 5500.00,
      role_id: 1,
      role_name: "Administrador",
      status: "active",
      last_login: "2024-01-15 14:30",
      created_at: "2023-01-15",
      permissions: ["all"]
    },
    {
      id: 2,
      full_name: "Carlos Santos Oliveira",
      email: "carlos.santos@closetfesta.com",
      phone: "(11) 98765-4322",
      cpf: "123.456.789-01",
      birth_date: "1990-07-20",
      address: "Av. Paulista, 456 - São Paulo/SP",
      hire_date: "2023-03-01",
      department: "Vendas",
      position: "Consultor de Vendas",
      salary: 3200.00,
      role_id: 2,
      role_name: "Vendedor",
      status: "active",
      last_login: "2024-01-15 10:15",
      created_at: "2023-03-01",
      permissions: ["customers_read", "customers_write", "products_read", "rentals_read", "rentals_write"]
    },
    {
      id: 3,
      full_name: "Mariana Souza Lima",
      email: "mariana.souza@closetfesta.com",
      phone: "(11) 98765-4323",
      cpf: "123.456.789-02",
      birth_date: "1992-11-10",
      address: "Rua Augusta, 789 - São Paulo/SP",
      hire_date: "2023-06-15",
      department: "Atendimento",
      position: "Atendente",
      salary: 2800.00,
      role_id: 3,
      role_name: "Atendente",
      status: "inactive",
      last_login: "2024-01-10 16:45",
      created_at: "2023-06-15",
      permissions: ["customers_read", "products_read", "rentals_read"]
    }
  ];

  const rolesData: Role[] = [
    {
      id: 1,
      name: "Administrador",
      description: "Acesso total ao sistema com todas as permissões",
      permissions: ["all"],
      is_default: true,
      users_count: 1
    },
    {
      id: 2,
      name: "Vendedor",
      description: "Acesso a vendas, clientes e estoque",
      permissions: ["customers_read", "customers_write", "products_read", "rentals_read", "rentals_write", "financial_read"],
      is_default: true,
      users_count: 1
    },
    {
      id: 3,
      name: "Atendente",
      description: "Acesso básico para atendimento ao cliente",
      permissions: ["customers_read", "products_read", "rentals_read"],
      is_default: true,
      users_count: 1
    },
    {
      id: 4,
      name: "Estoquista",
      description: "Gerenciamento de produtos e estoque",
      permissions: ["products_read", "products_write", "inventory_read", "inventory_write"],
      is_default: false,
      users_count: 0
    }
  ];

  const permissionsData: Permission[] = [
    // Clientes
    { id: "customers_read", module: "Clientes", action: "Visualizar", description: "Ver lista e detalhes dos clientes", category: "customers" },
    { id: "customers_write", module: "Clientes", action: "Gerenciar", description: "Criar, editar e excluir clientes", category: "customers" },
    { id: "customers_export", module: "Clientes", action: "Exportar", description: "Exportar dados dos clientes", category: "customers" },
    
    // Produtos
    { id: "products_read", module: "Produtos", action: "Visualizar", description: "Ver catálogo de produtos", category: "products" },
    { id: "products_write", module: "Produtos", action: "Gerenciar", description: "Criar, editar e excluir produtos", category: "products" },
    { id: "products_pricing", module: "Produtos", action: "Preços", description: "Gerenciar preços dos produtos", category: "products" },
    
    // Estoque
    { id: "inventory_read", module: "Estoque", action: "Visualizar", description: "Ver níveis de estoque", category: "inventory" },
    { id: "inventory_write", module: "Estoque", action: "Gerenciar", description: "Ajustar estoque e movimentações", category: "inventory" },
    { id: "inventory_reports", module: "Estoque", action: "Relatórios", description: "Gerar relatórios de estoque", category: "inventory" },
    
    // Aluguéis
    { id: "rentals_read", module: "Aluguéis", action: "Visualizar", description: "Ver aluguéis e reservas", category: "rentals" },
    { id: "rentals_write", module: "Aluguéis", action: "Gerenciar", description: "Criar e gerenciar aluguéis", category: "rentals" },
    { id: "rentals_cancel", module: "Aluguéis", action: "Cancelar", description: "Cancelar aluguéis", category: "rentals" },
    
    // Financeiro
    { id: "financial_read", module: "Financeiro", action: "Visualizar", description: "Ver dados financeiros", category: "financial" },
    { id: "financial_write", module: "Financeiro", action: "Gerenciar", description: "Gerenciar transações financeiras", category: "financial" },
    { id: "financial_reports", module: "Financeiro", action: "Relatórios", description: "Gerar relatórios financeiros", category: "financial" },
    
    // Sistema
    { id: "system_settings", module: "Sistema", action: "Configurações", description: "Alterar configurações do sistema", category: "system" },
    { id: "system_users", module: "Sistema", action: "Usuários", description: "Gerenciar usuários e permissões", category: "system" },
    { id: "system_backup", module: "Sistema", action: "Backup", description: "Gerenciar backups", category: "system" }
  ];

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<UserFormData>({
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      cpf: "",
      birth_date: "",
      address: "",
      department: "",
      position: "",
      salary: 0,
      role_id: 0,
      password: "",
      confirm_password: "",
      send_welcome_email: true,
      permissions: []
    }
  });

  const watchPassword = watch("password");
  const watchPermissions = watch("permissions");

  // Filtrar usuários
  const filteredUsers = usersData.filter(user => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar permissões por categoria
  const groupedPermissions = permissionsData.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const onSubmitUser = async (data: UserFormData) => {
    setIsLoading(true);
    
    try {
      // Validações
      if (data.password !== data.confirm_password) {
        toast.error("As senhas não coincidem");
        return;
      }

      if (data.password.length < 6) {
        toast.error("A senha deve ter pelo menos 6 caracteres");
        return;
      }

      // Simular criação do usuário
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Usuário criado com sucesso!");
      setShowUserForm(false);
      reset();
      
    } catch (error) {
      toast.error("Erro ao criar usuário");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Usuário removido com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover usuário");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'ativado' : 'desativado';
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`Usuário ${action} com sucesso!`);
    } catch (error) {
      toast.error(`Erro ao ${action.slice(0, -1)}r usuário`);
    }
  };

  const handleResetPassword = async (userId: number) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("E-mail de redefinição de senha enviado!");
    } catch (error) {
      toast.error("Erro ao enviar e-mail de redefinição");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Ativo', className: 'text-green-700 bg-green-50 border-green-200' },
      inactive: { label: 'Inativo', className: 'text-red-700 bg-red-50 border-red-200' },
      pending: { label: 'Pendente', className: 'text-yellow-700 bg-yellow-50 border-yellow-200' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleEditPermissions = (user: User) => {
    setSelectedUser(user);
    setShowPermissionsEditor(true);
  };

  const handleSavePermissions = async (userId: number, permissions: string[], roleId?: number) => {
    try {
      // Simular salvamento das permissões
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualizar usuário localmente (em um app real, isso viria da API)
      console.log("Permissões atualizadas:", { userId, permissions, roleId });
      
      toast.success("Permissões atualizadas com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar permissões");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h2>
          <p className="text-gray-600 mt-1">Gerencie funcionários, permissões e acessos ao sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
            <Users className="w-4 h-4 mr-2" />
            {usersData.filter(u => u.status === 'active').length} usuários ativos
          </Badge>
          <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-green-600" />
                  Cadastrar Novo Funcionário
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações do novo funcionário e configure suas permissões de acesso.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmitUser)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informações Pessoais */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informações Pessoais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Nome Completo *</Label>
                        <Input
                          id="full_name"
                          placeholder="Nome completo do funcionário"
                          {...register("full_name", { required: "Nome é obrigatório" })}
                        />
                        {errors.full_name && (
                          <p className="text-sm text-red-600">{errors.full_name.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">E-mail *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="email@exemplo.com"
                            {...register("email", { 
                              required: "E-mail é obrigatório",
                              pattern: {
                                value: /^\S+@\S+$/i,
                                message: "E-mail inválido"
                              }
                            })}
                          />
                          {errors.email && (
                            <p className="text-sm text-red-600">{errors.email.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            placeholder="(11) 99999-9999"
                            {...register("phone")}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cpf">CPF</Label>
                          <Input
                            id="cpf"
                            placeholder="000.000.000-00"
                            {...register("cpf")}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="birth_date">Data de Nascimento</Label>
                          <Input
                            id="birth_date"
                            type="date"
                            {...register("birth_date")}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Endereço</Label>
                        <Textarea
                          id="address"
                          placeholder="Endereço completo"
                          className="min-h-[80px]"
                          {...register("address")}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Informações Profissionais */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informações Profissionais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="department">Departamento *</Label>
                          <Select onValueChange={(value) => setValue("department", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="administracao">Administração</SelectItem>
                              <SelectItem value="vendas">Vendas</SelectItem>
                              <SelectItem value="atendimento">Atendimento</SelectItem>
                              <SelectItem value="estoque">Estoque</SelectItem>
                              <SelectItem value="financeiro">Financeiro</SelectItem>
                              <SelectItem value="marketing">Marketing</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="position">Cargo *</Label>
                          <Input
                            id="position"
                            placeholder="Cargo do funcionário"
                            {...register("position", { required: "Cargo é obrigatório" })}
                          />
                          {errors.position && (
                            <p className="text-sm text-red-600">{errors.position.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="salary">Salário (R$)</Label>
                        <Input
                          id="salary"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...register("salary", { valueAsNumber: true })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role_id">Perfil de Acesso *</Label>
                        <Select onValueChange={(value) => setValue("role_id", parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um perfil" />
                          </SelectTrigger>
                          <SelectContent>
                            {rolesData.map((role) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                <div>
                                  <div className="font-medium">{role.name}</div>
                                  <div className="text-sm text-gray-500">{role.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium">Configurações de Acesso</h4>
                        
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="password">Senha Temporária *</Label>
                            <div className="relative">
                              <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Senha temporária"
                                {...register("password", { 
                                  required: "Senha é obrigatória",
                                  minLength: {
                                    value: 6,
                                    message: "Senha deve ter pelo menos 6 caracteres"
                                  }
                                })}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 -translate-y-1/2"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                            {errors.password && (
                              <p className="text-sm text-red-600">{errors.password.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirm_password">Confirmar Senha *</Label>
                            <Input
                              id="confirm_password"
                              type="password"
                              placeholder="Confirme a senha"
                              {...register("confirm_password", { 
                                required: "Confirmação de senha é obrigatória",
                                validate: value => value === watchPassword || "Senhas não coincidem"
                              })}
                            />
                            {errors.confirm_password && (
                              <p className="text-sm text-red-600">{errors.confirm_password.message}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="send_welcome_email"
                            checked={watch("send_welcome_email")}
                            onCheckedChange={(checked) => setValue("send_welcome_email", checked as boolean)}
                          />
                          <Label htmlFor="send_welcome_email" className="text-sm">
                            Enviar e-mail de boas-vindas com instruções de acesso
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Permissões Personalizadas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      Permissões Personalizadas (Opcional)
                    </CardTitle>
                    <CardDescription>
                      Configure permissões específicas além do perfil selecionado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {Object.entries(groupedPermissions).map(([category, permissions]) => (
                        <div key={category} className="space-y-3">
                          <h4 className="font-medium text-gray-900 capitalize">
                            {category === 'customers' && 'Clientes'}
                            {category === 'products' && 'Produtos'}
                            {category === 'inventory' && 'Estoque'}
                            {category === 'rentals' && 'Aluguéis'}
                            {category === 'financial' && 'Financeiro'}
                            {category === 'system' && 'Sistema'}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {permissions.map((permission) => (
                              <div key={permission.id} className="flex items-start space-x-2 p-3 border rounded-lg">
                                <Checkbox
                                  id={permission.id}
                                  checked={watchPermissions?.includes(permission.id)}
                                  onCheckedChange={(checked) => {
                                    const currentPermissions = watchPermissions || [];
                                    if (checked) {
                                      setValue("permissions", [...currentPermissions, permission.id]);
                                    } else {
                                      setValue("permissions", currentPermissions.filter(p => p !== permission.id));
                                    }
                                  }}
                                />
                                <div className="flex-1">
                                  <Label htmlFor={permission.id} className="text-sm font-medium cursor-pointer">
                                    {permission.action}
                                  </Label>
                                  <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Criar Funcionário
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Navegação das Abas */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          {[
            { id: 'users', label: 'Funcionários', icon: Users, count: usersData.length },
            { id: 'roles', label: 'Perfis de Acesso', icon: Shield, count: rolesData.length },
            { id: 'permissions', label: 'Permissões', icon: Key, count: permissionsData.length },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <Badge variant="outline" className="ml-1">
                  {tab.count}
                </Badge>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Aba Funcionários */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar funcionários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os departamentos</SelectItem>
                <SelectItem value="administracao">Administração</SelectItem>
                <SelectItem value="vendas">Vendas</SelectItem>
                <SelectItem value="atendimento">Atendimento</SelectItem>
                <SelectItem value="estoque">Estoque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Funcionários */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Perfil de Acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {user.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.department}</div>
                        <div className="text-sm text-gray-500">
                          Admitido em {formatDate(user.hire_date)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.position}</div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(user.salary)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
                        <Shield className="w-3 h-3 mr-1" />
                        {user.role_name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.last_login ? formatDate(user.last_login.split(' ')[0]) : 'Nunca'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar Dados
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditPermissions(user)}>
                            <Shield className="w-4 h-4 mr-2" />
                            Editar Permissões
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                            <Key className="w-4 h-4 mr-2" />
                            Redefinir Senha
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleToggleUserStatus(user.id, user.status)}
                          >
                            {user.status === 'active' ? (
                              <>
                                <UserX className="w-4 h-4 mr-2" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash className="w-4 h-4 mr-2" />
                                <span className="text-red-600">Excluir</span>
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o funcionário "{user.full_name}"? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Aba Perfis de Acesso */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">Gerencie os perfis de acesso do sistema</p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Perfil
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rolesData.map((role) => (
              <Card key={role.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    <Badge variant="outline">
                      {role.users_count} usuários
                    </Badge>
                  </div>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Permissões:</p>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((permission) => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permissionsData.find(p => p.id === permission)?.action || permission}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{role.permissions.length - 3} mais
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      {!role.is_default && (
                        <Button variant="outline" size="sm" className="text-red-600">
                          <Trash className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Aba Permissões */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <p className="text-gray-600">Visualize todas as permissões disponíveis no sistema</p>
          
          {Object.entries(groupedPermissions).map(([category, permissions]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg capitalize">
                  {category === 'customers' && 'Clientes'}
                  {category === 'products' && 'Produtos'}
                  {category === 'inventory' && 'Estoque'}
                  {category === 'rentals' && 'Aluguéis'}
                  {category === 'financial' && 'Financeiro'}
                  {category === 'system' && 'Sistema'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="p-4 border rounded-lg">
                      <div className="font-medium">{permission.action}</div>
                      <div className="text-sm text-gray-500 mt-1">{permission.description}</div>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {permission.id}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Editor Avançado de Permissões */}
      <UserPermissionsEditor
        user={selectedUser}
        isOpen={showPermissionsEditor}
        onClose={() => {
          setShowPermissionsEditor(false);
          setSelectedUser(null);
        }}
        onSave={handleSavePermissions}
      />
    </div>
  );
};

export default UserManagement;
