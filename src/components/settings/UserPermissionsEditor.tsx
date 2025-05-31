import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Shield, 
  User, 
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Edit,
  Trash,
  Settings,
  Users,
  Package,
  DollarSign,
  Calendar,
  BarChart3,
  Database,
  Key,
  History,
  Copy,
  RefreshCw
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface User {
  id: number;
  full_name: string;
  email: string;
  role_name: string;
  department: string;
  position: string;
  permissions: string[];
}

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  is_default: boolean;
}

interface Permission {
  id: string;
  module: string;
  action: string;
  description: string;
  category: string;
  level: 'basic' | 'advanced' | 'critical';
  requires?: string[];
}

interface PermissionModule {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  permissions: Permission[];
}

interface UserPermissionsEditorProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: number, permissions: string[], roleId?: number) => void;
}

const UserPermissionsEditor: React.FC<UserPermissionsEditorProps> = ({
  user,
  isOpen,
  onClose,
  onSave
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [permissionHistory, setPermissionHistory] = useState<any[]>([]);
  const [showAdvancedMode, setShowAdvancedMode] = useState(false);

  // Dados simulados de perfis e permissões
  const rolesData: Role[] = [
    {
      id: 1,
      name: "Administrador",
      description: "Acesso total ao sistema",
      permissions: ["all"],
      is_default: true
    },
    {
      id: 2,
      name: "Gerente",
      description: "Acesso gerencial completo",
      permissions: [
        "customers_read", "customers_write", "customers_export",
        "products_read", "products_write", "products_pricing",
        "inventory_read", "inventory_write", "inventory_reports",
        "rentals_read", "rentals_write", "rentals_cancel",
        "financial_read", "financial_write", "financial_reports"
      ],
      is_default: true
    },
    {
      id: 3,
      name: "Vendedor",
      description: "Acesso a vendas e atendimento",
      permissions: [
        "customers_read", "customers_write",
        "products_read",
        "rentals_read", "rentals_write",
        "financial_read"
      ],
      is_default: true
    },
    {
      id: 4,
      name: "Atendente",
      description: "Acesso básico para atendimento",
      permissions: [
        "customers_read",
        "products_read",
        "rentals_read"
      ],
      is_default: true
    },
    {
      id: 5,
      name: "Estoquista",
      description: "Gerenciamento de estoque",
      permissions: [
        "products_read", "products_write",
        "inventory_read", "inventory_write", "inventory_reports"
      ],
      is_default: false
    }
  ];

  const permissionModules: PermissionModule[] = [
    {
      id: "customers",
      name: "Clientes",
      description: "Gerenciamento de clientes e relacionamento",
      icon: Users,
      permissions: [
        { 
          id: "customers_read", 
          module: "Clientes", 
          action: "Visualizar", 
          description: "Ver lista e detalhes dos clientes", 
          category: "customers", 
          level: "basic" 
        },
        { 
          id: "customers_write", 
          module: "Clientes", 
          action: "Gerenciar", 
          description: "Criar, editar e atualizar dados de clientes", 
          category: "customers", 
          level: "basic",
          requires: ["customers_read"] 
        },
        { 
          id: "customers_delete", 
          module: "Clientes", 
          action: "Excluir", 
          description: "Remover clientes do sistema", 
          category: "customers", 
          level: "critical",
          requires: ["customers_write"] 
        },
        { 
          id: "customers_export", 
          module: "Clientes", 
          action: "Exportar", 
          description: "Exportar dados dos clientes", 
          category: "customers", 
          level: "advanced",
          requires: ["customers_read"] 
        },
        { 
          id: "customers_merge", 
          module: "Clientes", 
          action: "Mesclar", 
          description: "Mesclar dados de clientes duplicados", 
          category: "customers", 
          level: "critical",
          requires: ["customers_write"] 
        }
      ]
    },
    {
      id: "products",
      name: "Produtos",
      description: "Catálogo de vestidos e acessórios",
      icon: Package,
      permissions: [
        { 
          id: "products_read", 
          module: "Produtos", 
          action: "Visualizar", 
          description: "Ver catálogo de produtos", 
          category: "products", 
          level: "basic" 
        },
        { 
          id: "products_write", 
          module: "Produtos", 
          action: "Gerenciar", 
          description: "Criar, editar e atualizar produtos", 
          category: "products", 
          level: "basic",
          requires: ["products_read"] 
        },
        { 
          id: "products_delete", 
          module: "Produtos", 
          action: "Excluir", 
          description: "Remover produtos do catálogo", 
          category: "products", 
          level: "critical",
          requires: ["products_write"] 
        },
        { 
          id: "products_pricing", 
          module: "Produtos", 
          action: "Preços", 
          description: "Gerenciar preços e promoções", 
          category: "products", 
          level: "advanced",
          requires: ["products_write"] 
        },
        { 
          id: "products_import", 
          module: "Produtos", 
          action: "Importar", 
          description: "Importar produtos em lote", 
          category: "products", 
          level: "advanced",
          requires: ["products_write"] 
        }
      ]
    },
    {
      id: "inventory",
      name: "Estoque",
      description: "Controle de estoque e movimentações",
      icon: Database,
      permissions: [
        { 
          id: "inventory_read", 
          module: "Estoque", 
          action: "Visualizar", 
          description: "Ver níveis de estoque", 
          category: "inventory", 
          level: "basic" 
        },
        { 
          id: "inventory_write", 
          module: "Estoque", 
          action: "Gerenciar", 
          description: "Ajustar estoque e movimentações", 
          category: "inventory", 
          level: "basic",
          requires: ["inventory_read"] 
        },
        { 
          id: "inventory_reports", 
          module: "Estoque", 
          action: "Relatórios", 
          description: "Gerar relatórios de estoque", 
          category: "inventory", 
          level: "advanced",
          requires: ["inventory_read"] 
        },
        { 
          id: "inventory_transfer", 
          module: "Estoque", 
          action: "Transferir", 
          description: "Transferir produtos entre locais", 
          category: "inventory", 
          level: "advanced",
          requires: ["inventory_write"] 
        },
        { 
          id: "inventory_audit", 
          module: "Estoque", 
          action: "Auditoria", 
          description: "Realizar auditoria de estoque", 
          category: "inventory", 
          level: "critical",
          requires: ["inventory_write"] 
        }
      ]
    },
    {
      id: "rentals",
      name: "Aluguéis",
      description: "Gestão de aluguéis e reservas",
      icon: Calendar,
      permissions: [
        { 
          id: "rentals_read", 
          module: "Aluguéis", 
          action: "Visualizar", 
          description: "Ver aluguéis e reservas", 
          category: "rentals", 
          level: "basic" 
        },
        { 
          id: "rentals_write", 
          module: "Aluguéis", 
          action: "Gerenciar", 
          description: "Criar e gerenciar aluguéis", 
          category: "rentals", 
          level: "basic",
          requires: ["rentals_read"] 
        },
        { 
          id: "rentals_cancel", 
          module: "Aluguéis", 
          action: "Cancelar", 
          description: "Cancelar aluguéis e reservas", 
          category: "rentals", 
          level: "advanced",
          requires: ["rentals_write"] 
        },
        { 
          id: "rentals_refund", 
          module: "Aluguéis", 
          action: "Reembolsar", 
          description: "Processar reembolsos", 
          category: "rentals", 
          level: "critical",
          requires: ["rentals_cancel"] 
        },
        { 
          id: "rentals_extend", 
          module: "Aluguéis", 
          action: "Prorrogar", 
          description: "Prorrogar prazos de devolução", 
          category: "rentals", 
          level: "advanced",
          requires: ["rentals_write"] 
        }
      ]
    },
    {
      id: "financial",
      name: "Financeiro",
      description: "Gestão financeira e pagamentos",
      icon: DollarSign,
      permissions: [
        { 
          id: "financial_read", 
          module: "Financeiro", 
          action: "Visualizar", 
          description: "Ver dados financeiros", 
          category: "financial", 
          level: "basic" 
        },
        { 
          id: "financial_write", 
          module: "Financeiro", 
          action: "Gerenciar", 
          description: "Gerenciar transações financeiras", 
          category: "financial", 
          level: "advanced",
          requires: ["financial_read"] 
        },
        { 
          id: "financial_reports", 
          module: "Financeiro", 
          action: "Relatórios", 
          description: "Gerar relatórios financeiros", 
          category: "financial", 
          level: "advanced",
          requires: ["financial_read"] 
        },
        { 
          id: "financial_reconcile", 
          module: "Financeiro", 
          action: "Conciliar", 
          description: "Conciliar contas e pagamentos", 
          category: "financial", 
          level: "critical",
          requires: ["financial_write"] 
        },
        { 
          id: "financial_tax", 
          module: "Financeiro", 
          action: "Impostos", 
          description: "Gerenciar informações fiscais", 
          category: "financial", 
          level: "critical",
          requires: ["financial_write"] 
        }
      ]
    },
    {
      id: "system",
      name: "Sistema",
      description: "Configurações e administração",
      icon: Settings,
      permissions: [
        { 
          id: "system_settings", 
          module: "Sistema", 
          action: "Configurações", 
          description: "Alterar configurações do sistema", 
          category: "system", 
          level: "critical" 
        },
        { 
          id: "system_users", 
          module: "Sistema", 
          action: "Usuários", 
          description: "Gerenciar usuários e permissões", 
          category: "system", 
          level: "critical" 
        },
        { 
          id: "system_backup", 
          module: "Sistema", 
          action: "Backup", 
          description: "Gerenciar backups", 
          category: "system", 
          level: "critical" 
        },
        { 
          id: "system_audit", 
          module: "Sistema", 
          action: "Auditoria", 
          description: "Ver logs de auditoria", 
          category: "system", 
          level: "critical" 
        },
        { 
          id: "system_integrations", 
          module: "Sistema", 
          action: "Integrações", 
          description: "Configurar integrações externas", 
          category: "system", 
          level: "critical" 
        }
      ]
    }
  ];

  // Histórico simulado de alterações
  const sampleHistory = [
    {
      date: "2024-01-15 14:30",
      admin: "Ana Silva",
      action: "Adicionou permissão",
      details: "Gerenciar Produtos",
      type: "add"
    },
    {
      date: "2024-01-14 10:15",
      admin: "Ana Silva", 
      action: "Removeu permissão",
      details: "Excluir Clientes",
      type: "remove"
    },
    {
      date: "2024-01-13 16:45",
      admin: "Ana Silva",
      action: "Alterou perfil",
      details: "De Atendente para Vendedor",
      type: "change"
    }
  ];

  useEffect(() => {
    if (user && isOpen) {
      setCustomPermissions(user.permissions || []);
      setPermissionHistory(sampleHistory);
      
      // Detectar perfil baseado nas permissões
      const userRole = rolesData.find(role => 
        role.permissions.every(perm => user.permissions.includes(perm)) &&
        user.permissions.every(perm => role.permissions.includes(perm) || role.permissions.includes("all"))
      );
      
      setSelectedRole(userRole?.id || null);
    }
  }, [user, isOpen]);

  const handleRoleChange = (roleId: number) => {
    setSelectedRole(roleId);
    const role = rolesData.find(r => r.id === roleId);
    if (role) {
      setCustomPermissions(role.permissions);
    }
  };

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    if (checked) {
      // Adicionar permissão e suas dependências
      const permission = getAllPermissions().find(p => p.id === permissionId);
      const newPermissions = [...customPermissions];
      
      if (permission?.requires) {
        permission.requires.forEach(req => {
          if (!newPermissions.includes(req)) {
            newPermissions.push(req);
          }
        });
      }
      
      if (!newPermissions.includes(permissionId)) {
        newPermissions.push(permissionId);
      }
      
      setCustomPermissions(newPermissions);
    } else {
      // Remover permissão e dependentes
      const dependents = getAllPermissions().filter(p => 
        p.requires?.includes(permissionId)
      ).map(p => p.id);
      
      setCustomPermissions(prev => 
        prev.filter(id => id !== permissionId && !dependents.includes(id))
      );
    }
    
    // Reset do role se houver mudanças manuais
    setSelectedRole(null);
  };

  const getAllPermissions = (): Permission[] => {
    return permissionModules.flatMap(module => module.permissions);
  };

  const getFilteredPermissions = () => {
    const allPermissions = getAllPermissions();
    if (!searchTerm) return allPermissions;
    
    return allPermissions.filter(permission =>
      permission.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.module.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getPermissionLevel = (level: string) => {
    const levels = {
      basic: { color: "text-green-700 bg-green-50 border-green-200", label: "Básico" },
      advanced: { color: "text-blue-700 bg-blue-50 border-blue-200", label: "Avançado" },
      critical: { color: "text-red-700 bg-red-50 border-red-200", label: "Crítico" }
    };
    
    return levels[level as keyof typeof levels] || levels.basic;
  };

  const getPermissionStats = () => {
    const total = getAllPermissions().length;
    const selected = customPermissions.length;
    const byLevel = {
      basic: customPermissions.filter(id => 
        getAllPermissions().find(p => p.id === id)?.level === 'basic'
      ).length,
      advanced: customPermissions.filter(id => 
        getAllPermissions().find(p => p.id === id)?.level === 'advanced'
      ).length,
      critical: customPermissions.filter(id => 
        getAllPermissions().find(p => p.id === id)?.level === 'critical'
      ).length
    };
    
    return { total, selected, byLevel };
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onSave(user.id, customPermissions, selectedRole || undefined);
      toast.success("Permissões atualizadas com sucesso!");
      onClose();
      
    } catch (error) {
      toast.error("Erro ao salvar permissões");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPermissions = () => {
    const permissions = customPermissions.join(', ');
    navigator.clipboard.writeText(permissions);
    toast.success("Permissões copiadas para a área de transferência!");
  };

  const handleResetPermissions = () => {
    if (user) {
      setCustomPermissions(user.permissions || []);
      setSelectedRole(null);
      toast.info("Permissões resetadas para o estado original");
    }
  };

  const stats = getPermissionStats();

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xl">Editar Permissões</div>
              <div className="text-sm font-normal text-gray-600">
                {user.full_name} • {user.department} • {user.position}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.selected}</div>
              <div className="text-sm text-gray-600">de {stats.total} permissões</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-700">{stats.byLevel.basic}</div>
              <div className="text-sm text-green-600">Básicas</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-700">{stats.byLevel.advanced}</div>
              <div className="text-sm text-blue-600">Avançadas</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-700">{stats.byLevel.critical}</div>
              <div className="text-sm text-red-600">Críticas</div>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Input
                  placeholder="Buscar permissões..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={showAdvancedMode}
                  onCheckedChange={setShowAdvancedMode}
                />
                <Label>Modo Avançado</Label>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyPermissions}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetPermissions}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Resetar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Seção Principal - Permissões */}
            <div className="lg:col-span-2 space-y-6">
              {/* Perfis Pré-definidos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Perfis de Acesso</CardTitle>
                  <CardDescription>
                    Selecione um perfil pré-definido ou configure permissões personalizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {rolesData.map((role) => (
                      <div
                        key={role.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedRole === role.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleRoleChange(role.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{role.name}</div>
                          {selectedRole === role.id && (
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">{role.description}</div>
                        <Badge variant="outline" className="text-xs">
                          {role.permissions.includes("all") ? "Todas" : role.permissions.length} permissões
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Permissões por Módulo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Permissões por Módulo</CardTitle>
                  <CardDescription>
                    Configure permissões específicas para cada módulo do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {permissionModules.map((module) => {
                      const Icon = module.icon;
                      const modulePermissions = module.permissions.filter(p => 
                        !searchTerm || getFilteredPermissions().some(fp => fp.id === p.id)
                      );
                      
                      if (modulePermissions.length === 0) return null;
                      
                      const selectedCount = modulePermissions.filter(p => 
                        customPermissions.includes(p.id)
                      ).length;
                      
                      return (
                        <AccordionItem key={module.id} value={module.id}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3 w-full">
                              <Icon className="w-5 h-5 text-gray-600" />
                              <div className="flex-1 text-left">
                                <div className="font-medium">{module.name}</div>
                                <div className="text-sm text-gray-500">{module.description}</div>
                              </div>
                              <Badge variant="outline">
                                {selectedCount}/{modulePermissions.length}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 pt-4">
                              {modulePermissions.map((permission) => {
                                const isSelected = customPermissions.includes(permission.id);
                                const isDisabled = permission.requires?.some(req => 
                                  !customPermissions.includes(req)
                                ) && !isSelected;
                                const level = getPermissionLevel(permission.level);
                                
                                return (
                                  <div 
                                    key={permission.id} 
                                    className={`p-4 border rounded-lg ${
                                      isSelected ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <Checkbox
                                        checked={isSelected}
                                        disabled={isDisabled}
                                        onCheckedChange={(checked) => 
                                          handlePermissionToggle(permission.id, checked as boolean)
                                        }
                                        className="mt-1"
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Label className="font-medium cursor-pointer">
                                            {permission.action}
                                          </Label>
                                          <Badge variant="outline" className={`text-xs ${level.color}`}>
                                            {level.label}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">
                                          {permission.description}
                                        </p>
                                        
                                        {showAdvancedMode && (
                                          <div className="space-y-1">
                                            <div className="text-xs text-gray-500">
                                              ID: <code className="bg-gray-100 px-1 rounded">{permission.id}</code>
                                            </div>
                                            {permission.requires && (
                                              <div className="text-xs text-gray-500">
                                                Requer: {permission.requires.map(req => (
                                                  <code key={req} className="bg-gray-100 px-1 rounded mr-1">
                                                    {req}
                                                  </code>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        
                                        {isDisabled && (
                                          <div className="flex items-center gap-1 mt-2">
                                            <AlertTriangle className="w-3 h-3 text-yellow-600" />
                                            <span className="text-xs text-yellow-600">
                                              Requer outras permissões
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Histórico e Informações */}
            <div className="space-y-6">
              {/* Informações do Usuário */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Informações do Usuário
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm text-gray-600">E-mail</Label>
                    <div className="font-medium">{user.email}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Perfil Atual</Label>
                    <div className="font-medium">{user.role_name}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Departamento</Label>
                    <div className="font-medium">{user.department}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Cargo</Label>
                    <div className="font-medium">{user.position}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Resumo das Mudanças */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Resumo das Alterações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Permissões atuais:</span>
                      <span className="font-medium">{user.permissions?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Novas permissões:</span>
                      <span className="font-medium">{customPermissions.length}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Diferença:</span>
                      <span className={`font-medium ${
                        customPermissions.length > (user.permissions?.length || 0) 
                          ? 'text-green-600' 
                          : customPermissions.length < (user.permissions?.length || 0)
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}>
                        {customPermissions.length > (user.permissions?.length || 0) && '+'}
                        {customPermissions.length - (user.permissions?.length || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Histórico */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Histórico Recente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {permissionHistory.slice(0, 5).map((entry, index) => (
                      <div key={index} className="text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${
                            entry.type === 'add' ? 'bg-green-500' :
                            entry.type === 'remove' ? 'bg-red-500' : 'bg-blue-500'
                          }`}></div>
                          <span className="font-medium">{entry.action}</span>
                        </div>
                        <div className="text-gray-600 ml-4">{entry.details}</div>
                        <div className="text-xs text-gray-500 ml-4">{entry.date}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Permissões
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserPermissionsEditor; 