// Sistema de permissões e controle de acesso
// Gerenciamento de roles, usuários e recursos protegidos

import CompressedStorage from './compression';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  last_login?: string;
  permissions: Permission[];
  settings: UserSettings;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  level: number; // 1=Admin, 2=Manager, 3=Seller, 4=Viewer
  permissions: Permission[];
  inherits_from?: string; // Role pai para hierarquia
}

export interface Permission {
  resource: string;
  actions: string[];
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'pt-BR' | 'en-US';
  notifications: {
    email: boolean;
    push: boolean;
    rental_reminders: boolean;
    payment_alerts: boolean;
  };
  dashboard_preferences: {
    default_period: '7d' | '30d' | '90d' | '1y';
    widgets: string[];
  };
}

export interface SessionData {
  user: User;
  token: string;
  expires_at: string;
  last_activity: string;
  device_info: {
    user_agent: string;
    ip_address?: string;
    device_type: 'desktop' | 'mobile' | 'tablet';
  };
}

// Roles padrão do sistema
export const DEFAULT_ROLES: UserRole[] = [
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Acesso total ao sistema',
    level: 1,
    permissions: [
      { resource: '*', actions: ['*'] } // Acesso total
    ]
  },
  {
    id: 'manager',
    name: 'Gerente',
    description: 'Gerenciamento de vendas e relatórios',
    level: 2,
    permissions: [
      { resource: 'orders', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'products', actions: ['create', 'read', 'update'] },
      { resource: 'customers', actions: ['create', 'read', 'update'] },
      { resource: 'payments', actions: ['read', 'process'] },
      { resource: 'reports', actions: ['read', 'export'] },
      { resource: 'dashboard', actions: ['read'] },
      { resource: 'calendar', actions: ['read', 'update'] },
      { resource: 'system', actions: ['read'] }
    ]
  },
  {
    id: 'seller',
    name: 'Vendedor',
    description: 'Vendas e atendimento ao cliente',
    level: 3,
    permissions: [
      { resource: 'orders', actions: ['create', 'read', 'update'] },
      { resource: 'products', actions: ['read'] },
      { resource: 'customers', actions: ['create', 'read', 'update'] },
      { resource: 'payments', actions: ['read', 'process'] },
      { resource: 'calendar', actions: ['read'] },
      { 
        resource: 'orders', 
        actions: ['delete'], 
        conditions: [
          { field: 'created_by', operator: 'equals', value: '@user.id' }
        ]
      }
    ]
  },
  {
    id: 'viewer',
    name: 'Visualizador',
    description: 'Apenas consulta',
    level: 4,
    permissions: [
      { resource: 'orders', actions: ['read'] },
      { resource: 'products', actions: ['read'] },
      { resource: 'customers', actions: ['read'] },
      { resource: 'reports', actions: ['read'] },
      { resource: 'calendar', actions: ['read'] }
    ]
  }
];

export class PermissionManager {
  private static readonly SESSION_KEY = 'closetfesta_session';
  private static readonly USERS_KEY = 'closetfesta_users';
  private static readonly ROLES_KEY = 'closetfesta_roles';
  
  // Inicializar sistema com dados padrão
  static initialize(): void {
    try {
      // Usar localStorage direto para diagnosticar
      const existingRolesStr = localStorage.getItem(this.ROLES_KEY);
      const existingRoles = existingRolesStr ? JSON.parse(existingRolesStr) : null;
      
      if (!existingRoles) {
        localStorage.setItem(this.ROLES_KEY, JSON.stringify(DEFAULT_ROLES));
      }

      // Verificar usuários existentes
      const existingUsersStr = localStorage.getItem(this.USERS_KEY);
      const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : null;

      if (!existingUsers || existingUsers.length === 0) {
        const defaultUsers: User[] = [
          {
            id: 'admin-001',
            username: 'admin',
            email: 'admin@closetfesta.com',
            full_name: 'Administrador do Sistema',
            role: DEFAULT_ROLES[0], // Admin
            status: 'active',
            created_at: new Date().toISOString(),
            permissions: DEFAULT_ROLES[0].permissions,
            settings: {
              theme: 'light',
              language: 'pt-BR',
              notifications: {
                email: true,
                push: true,
                rental_reminders: true,
                payment_alerts: true
              },
              dashboard_preferences: {
                default_period: '30d',
                widgets: ['revenue', 'orders', 'products', 'alerts']
              }
            }
          },
          {
            id: 'manager-001',
            username: 'manager',
            email: 'manager@closetfesta.com',
            full_name: 'Gerente de Vendas',
            role: DEFAULT_ROLES[1], // Manager
            status: 'active',
            created_at: new Date().toISOString(),
            permissions: DEFAULT_ROLES[1].permissions,
            settings: {
              theme: 'light',
              language: 'pt-BR',
              notifications: {
                email: true,
                push: true,
                rental_reminders: true,
                payment_alerts: true
              },
              dashboard_preferences: {
                default_period: '30d',
                widgets: ['revenue', 'orders', 'products']
              }
            }
          },
          {
            id: 'seller-001',
            username: 'seller',
            email: 'seller@closetfesta.com',
            full_name: 'Vendedor',
            role: DEFAULT_ROLES[2], // Seller
            status: 'active',
            created_at: new Date().toISOString(),
            permissions: DEFAULT_ROLES[2].permissions,
            settings: {
              theme: 'light',
              language: 'pt-BR',
              notifications: {
                email: true,
                push: false,
                rental_reminders: true,
                payment_alerts: false
              },
              dashboard_preferences: {
                default_period: '7d',
                widgets: ['orders', 'products']
              }
            }
          },
          {
            id: 'viewer-001',
            username: 'viewer',
            email: 'viewer@closetfesta.com',
            full_name: 'Visualizador',
            role: DEFAULT_ROLES[3], // Viewer
            status: 'active',
            created_at: new Date().toISOString(),
            permissions: DEFAULT_ROLES[3].permissions,
            settings: {
              theme: 'light',
              language: 'pt-BR',
              notifications: {
                email: false,
                push: false,
                rental_reminders: false,
                payment_alerts: false
              },
              dashboard_preferences: {
                default_period: '30d',
                widgets: ['orders']
              }
            }
          }
        ];

        localStorage.setItem(this.USERS_KEY, JSON.stringify(defaultUsers));
      }
      
    } catch (error) {
      console.error('❌ Erro na inicialização do PermissionManager:', error);
      throw error;
    }
  }

  // Autenticação (simulada - em produção seria com servidor)
  static async login(username: string, password: string): Promise<SessionData> {
    const users = localStorage.getItem(this.USERS_KEY) ? JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]') : [];
    const user = users.find(u => u.username === username && u.status === 'active');

    if (!user) {
      throw new Error('Usuário não encontrado ou inativo');
    }

    // Verificação de senhas para demonstração (em produção seria hash)
    const defaultPasswords: { [key: string]: string } = {
      'admin': 'admin123',
      'manager': 'manager123',
      'seller': 'seller123',
      'viewer': 'viewer123'
    };

    if (defaultPasswords[username] && password !== defaultPasswords[username]) {
      throw new Error('Senha incorreta');
    }

    const session: SessionData = {
      user: {
        ...user,
        last_login: new Date().toISOString()
      },
      token: `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
      last_activity: new Date().toISOString(),
      device_info: {
        user_agent: navigator.userAgent,
        device_type: this.detectDeviceType()
      }
    };

    // Atualizar último login do usuário
    const updatedUsers = users.map(u => 
      u.id === user.id ? { ...u, last_login: new Date().toISOString() } : u
    );
    localStorage.setItem(this.USERS_KEY, JSON.stringify(updatedUsers));

    // Salvar sessão
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

    return session;
  }

  // Logout
  static logout(): void {
    try {
      console.log('🚪 Iniciando logout no PermissionManager...');
      
      // Limpar sessão
      localStorage.removeItem(this.SESSION_KEY);
      console.log('✅ Sessão removida do localStorage');
      
      // Emitir evento personalizado para notificar a aplicação
      console.log('📡 Emitindo evento user-logout...');
      const logoutEvent = new CustomEvent('user-logout');
      window.dispatchEvent(logoutEvent);
      console.log('📡 Evento user-logout emitido com sucesso');
      
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
  }

  // Obter sessão atual
  static getCurrentSession(): SessionData | null {
    const sessionStr = localStorage.getItem(this.SESSION_KEY);
    
    if (!sessionStr) return null;

    try {
      const session = JSON.parse(sessionStr);
      
      // Verificar se a sessão expirou
      if (new Date(session.expires_at) < new Date()) {
        this.logout();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Erro ao recuperar sessão:', error);
      this.logout();
      return null;
    }
  }

  // Obter usuário atual
  static getCurrentUser(): User | null {
    const session = this.getCurrentSession();
    return session?.user || null;
  }

  // Verificar se usuário está logado
  static isAuthenticated(): boolean {
    return this.getCurrentSession() !== null;
  }

  // Verificar permissão específica
  static hasPermission(resource: string, action: string, context?: any): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Admin tem acesso total
    if (user.role.level === 1) return true;

    // Verificar permissões do usuário
    return this.checkUserPermissions(user, resource, action, context);
  }

  private static checkUserPermissions(user: User, resource: string, action: string, context?: any): boolean {
    // Verificar permissões diretas do usuário
    for (const permission of user.permissions) {
      if (this.matchesPermission(permission, resource, action, user, context)) {
        return true;
      }
    }

    // Verificar permissões do role
    for (const permission of user.role.permissions) {
      if (this.matchesPermission(permission, resource, action, user, context)) {
        return true;
      }
    }

    return false;
  }

  private static matchesPermission(
    permission: Permission, 
    resource: string, 
    action: string, 
    user: User, 
    context?: any
  ): boolean {
    // Verificar recurso
    if (permission.resource !== '*' && permission.resource !== resource) {
      return false;
    }

    // Verificar ação
    if (!permission.actions.includes('*') && !permission.actions.includes(action)) {
      return false;
    }

    // Verificar condições
    if (permission.conditions) {
      for (const condition of permission.conditions) {
        if (!this.evaluateCondition(condition, user, context)) {
          return false;
        }
      }
    }

    return true;
  }

  private static evaluateCondition(condition: PermissionCondition, user: User, context?: any): boolean {
    let actualValue = context?.[condition.field];
    let expectedValue = condition.value;

    // Substituir valores especiais
    if (typeof expectedValue === 'string' && expectedValue.startsWith('@user.')) {
      const userField = expectedValue.replace('@user.', '');
      expectedValue = (user as any)[userField];
    }

    // Avaliar condição
    switch (condition.operator) {
      case 'equals':
        return actualValue === expectedValue;
      case 'not_equals':
        return actualValue !== expectedValue;
      case 'contains':
        return String(actualValue).includes(String(expectedValue));
      case 'greater_than':
        return Number(actualValue) > Number(expectedValue);
      case 'less_than':
        return Number(actualValue) < Number(expectedValue);
      default:
        return false;
    }
  }

  // Gerenciar usuários
  static createUser(userData: Omit<User, 'id' | 'created_at'>): User {
    if (!this.hasPermission('users', 'create')) {
      throw new Error('Sem permissão para criar usuários');
    }

    const users = localStorage.getItem(this.USERS_KEY) ? JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]') : [];
    
    // Verificar se username já existe
    if (users.some(u => u.username === userData.username)) {
      throw new Error('Nome de usuário já existe');
    }

    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

    return newUser;
  }

  static updateUser(userId: string, updates: Partial<User>): User {
    if (!this.hasPermission('users', 'update')) {
      throw new Error('Sem permissão para atualizar usuários');
    }

    const users = localStorage.getItem(this.USERS_KEY) ? JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]') : [];
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      throw new Error('Usuário não encontrado');
    }

    users[userIndex] = { ...users[userIndex], ...updates };
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

    return users[userIndex];
  }

  static deleteUser(userId: string): void {
    if (!this.hasPermission('users', 'delete')) {
      throw new Error('Sem permissão para deletar usuários');
    }

    const users = localStorage.getItem(this.USERS_KEY) ? JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]') : [];
    const filteredUsers = users.filter(u => u.id !== userId);
    
    localStorage.setItem(this.USERS_KEY, JSON.stringify(filteredUsers));
  }

  static getAllUsers(): User[] {
    if (!this.hasPermission('users', 'read')) {
      throw new Error('Sem permissão para listar usuários');
    }

    return localStorage.getItem(this.USERS_KEY) ? JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]') : [];
  }

  // Gerenciar roles
  static getAllRoles(): UserRole[] {
    return localStorage.getItem(this.ROLES_KEY) ? JSON.parse(localStorage.getItem(this.ROLES_KEY) || '[]') : DEFAULT_ROLES;
  }

  static createRole(roleData: Omit<UserRole, 'id'>): UserRole {
    if (!this.hasPermission('roles', 'create')) {
      throw new Error('Sem permissão para criar roles');
    }

    const roles = this.getAllRoles();
    
    const newRole: UserRole = {
      ...roleData,
      id: `role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    roles.push(newRole);
    localStorage.setItem(this.ROLES_KEY, JSON.stringify(roles));

    return newRole;
  }

  // Utilitários
  private static detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/tablet|ipad|playbook|silk/.test(userAgent)) {
      return 'tablet';
    } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(userAgent)) {
      return 'mobile';
    } else {
      return 'desktop';
    }
  }

  // Relatório de atividades
  static getActivityReport(): {
    active_users: number;
    total_users: number;
    users_by_role: { [role: string]: number };
    recent_logins: Array<{ user: string; timestamp: string }>;
  } {
    if (!this.hasPermission('users', 'read')) {
      throw new Error('Sem permissão para gerar relatórios');
    }

    const users = this.getAllUsers();
    const activeUsers = users.filter(u => u.status === 'active');
    
    const usersByRole = users.reduce((acc, user) => {
      acc[user.role.name] = (acc[user.role.name] || 0) + 1;
      return acc;
    }, {} as { [role: string]: number });

    const recentLogins = users
      .filter(u => u.last_login)
      .sort((a, b) => new Date(b.last_login!).getTime() - new Date(a.last_login!).getTime())
      .slice(0, 10)
      .map(u => ({
        user: u.full_name,
        timestamp: u.last_login!
      }));

    return {
      active_users: activeUsers.length,
      total_users: users.length,
      users_by_role: usersByRole,
      recent_logins: recentLogins
    };
  }

  // Atualizar atividade da sessão
  static updateLastActivity(): void {
    const session = this.getCurrentSession();
    if (session) {
      session.last_activity = new Date().toISOString();
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    }
  }

  // Resetar sistema para dados padrão (útil para desenvolvimento/demonstração)
  static resetSystem(): void {
    // Limpar todos os dados
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.USERS_KEY);
    localStorage.removeItem(this.ROLES_KEY);
    
    // Reinicializar com dados padrão
    this.initialize();
    
    console.log('Sistema resetado com usuários padrão criados');
  }
}

// Hook personalizado para permissões
export const usePermissions = () => {
  const user = PermissionManager.getCurrentUser();
  
  return {
    user,
    isAuthenticated: PermissionManager.isAuthenticated(),
    hasPermission: (resource: string, action: string, context?: any) => 
      PermissionManager.hasPermission(resource, action, context),
    logout: PermissionManager.logout,
    updateActivity: PermissionManager.updateLastActivity
  };
};

export default PermissionManager; 