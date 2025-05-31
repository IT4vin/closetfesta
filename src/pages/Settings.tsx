import React, { useState } from "react";
import { useAuth } from "@/stores/authStore";
import PermissionManager from "@/lib/permissions";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  User, 
  Shield, 
  Palette, 
  Settings as SettingsIcon, 
  Building, 
  CreditCard,
  Bell,
  Database,
  Activity,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertTriangle,
  Clock
} from "lucide-react";

// Componentes das configurações existentes
import UserProfileSettings from "@/components/settings/UserProfileSettings";
import SystemPersonalization from "@/components/settings/SystemPersonalization";
import SecuritySettings from "@/components/settings/SecuritySettings";
import OperationalSettings from "@/components/settings/OperationalSettings";
import UserManagement from "@/components/settings/UserManagement";
import BusinessSettings from "@/components/settings/BusinessSettings";

// Novos componentes implementados
import IntegrationsSettings from "@/components/settings/IntegrationsSettings";
import NotificationsSettings from "@/components/settings/NotificationsSettings";
import BackupSettings from "@/components/settings/BackupSettings";
import SystemSettings from "@/components/settings/SystemSettings";

// Componente placeholder para seções que ainda não existem
const PlaceholderComponent = ({ title, description }: { title: string; description: string }) => (
  <div className="text-center py-16">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <SettingsIcon className="h-8 w-8 text-gray-400" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-6">{description}</p>
    <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">
      Em desenvolvimento
    </Badge>
  </div>
);

const Settings = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("profile");

  // Verificação de permissões
  const canManageUsers = PermissionManager.hasPermission('users', 'read');
  const canManageSecurity = PermissionManager.hasPermission('security', 'read');
  const canManageSystem = PermissionManager.hasPermission('system', 'manage');
  const canManageBusiness = PermissionManager.hasPermission('business', 'manage');
  const canManageIntegrations = PermissionManager.hasPermission('integrations', 'manage');

  // Configurações das seções
  const settingsSections = [
    {
      id: "profile",
      label: "Meu Perfil",
      icon: User,
      description: "Suas informações pessoais e preferências",
      component: UserProfileSettings,
      permission: true,
      color: "bg-blue-500"
    },
    {
      id: "business", 
      label: "Negócio",
      icon: Building,
      description: "Configurações da empresa e operação",
      component: BusinessSettings,
      permission: canManageBusiness,
      color: "bg-marsala-600"
    },
    {
      id: "users",
      label: "Usuários",
      icon: User,
      description: "Gerenciar usuários e permissões",
      component: UserManagement,
      permission: canManageUsers,
      color: "bg-green-500"
    },
    {
      id: "security",
      label: "Segurança",
      icon: Shield,
      description: "Autenticação e políticas de segurança",
      component: SecuritySettings,
      permission: canManageSecurity,
      color: "bg-red-500"
    },
    {
      id: "personalization",
      label: "Aparência",
      icon: Palette,
      description: "Personalização visual do sistema",
      component: SystemPersonalization,
      permission: true,
      color: "bg-purple-500"
    },
    {
      id: "operational",
      label: "Operacional",
      icon: SettingsIcon,
      description: "Configurações de funcionamento",
      component: OperationalSettings,
      permission: canManageSystem,
      color: "bg-orange-500"
    },
    {
      id: "integrations",
      label: "Integrações",
      icon: CreditCard,
      description: "Pagamentos e sistemas externos",
      component: IntegrationsSettings,
      permission: canManageIntegrations,
      color: "bg-indigo-500"
    },
    {
      id: "notifications",
      label: "Notificações",
      icon: Bell,
      description: "Alertas e comunicações",
      component: NotificationsSettings,
      permission: true,
      color: "bg-yellow-500"
    },
    {
      id: "backup",
      label: "Backup",
      icon: Database,
      description: "Backup e recuperação de dados",
      component: BackupSettings,
      permission: canManageSystem,
      color: "bg-gray-600"
    },
    {
      id: "system",
      label: "Sistema",
      icon: Activity,
      description: "Status e monitoramento",
      component: SystemSettings,
      permission: canManageSystem,
      color: "bg-teal-500"
    }
  ];

  // Filtrar seções baseado em permissões
  const availableSections = settingsSections.filter(section => section.permission);

  const currentSection = availableSections.find(section => section.id === activeSection);

  return (
    <div className="page-transition space-y-8">
      {/* Header Melhorado */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-marsala-600 to-marsala-800 bg-clip-text text-transparent mb-2">
            Configurações do Sistema
          </h1>
          <p className="text-gray-600 text-lg flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-marsala-500" />
            Personalize e configure todos os aspectos do Closet Festa Manager
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-marsala-700 border-marsala-300 bg-marsala-50 px-4 py-2">
            <User className="h-4 w-4 mr-2" />
            {user?.full_name}
          </Badge>
          <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50 px-4 py-2">
            {user?.role.name}
          </Badge>
        </div>
      </div>

      {/* Layout Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar de Navegação */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-marsala-600" />
                Configurações
              </CardTitle>
              <CardDescription>
                Escolha a seção que deseja configurar
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {availableSections.map((section) => {
                  const Icon = section.icon;
                  const isActive = section.id === activeSection;
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left p-4 rounded-lg transition-all duration-200 flex items-center gap-3 group ${
                        isActive 
                          ? 'bg-marsala-50 text-marsala-700 border-l-4 border-marsala-600' 
                          : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg ${section.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{section.label}</div>
                        <div className="text-sm text-gray-500 truncate">
                          {section.description}
                        </div>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 bg-marsala-600 rounded-full animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>

          {/* Card de Status Rápido */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                Status do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sistema</span>
                <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Online
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Backup</span>
                <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
                  <Clock className="w-2 h-2 mr-2" />
                  Hoje
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Segurança</span>
                <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                  <Shield className="w-2 h-2 mr-2" />
                  Ativo
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo Principal */}
        <div className="lg:col-span-3">
          <Card className="min-h-[600px]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentSection && (
                    <div className={`w-10 h-10 rounded-lg ${currentSection.color} flex items-center justify-center`}>
                      <currentSection.icon className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-2xl">{currentSection?.label}</CardTitle>
                    <CardDescription className="text-lg">
                      {currentSection?.description}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recarregar
                  </Button>
                  <Button size="sm" className="bg-marsala-600 hover:bg-marsala-700">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Tudo
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              {/* Renderizar componente da seção ativa */}
              {currentSection && (
                <div className="animate-fadeIn">
                  <currentSection.component />
                </div>
              )}
              
              {/* Fallback se nenhuma seção for encontrada */}
              {!currentSection && (
                <div className="text-center py-12">
                  <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Seção não encontrada
                  </h3>
                  <p className="text-gray-600">
                    A seção selecionada não existe ou você não tem permissão para acessá-la.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
