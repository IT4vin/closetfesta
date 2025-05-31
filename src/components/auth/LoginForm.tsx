import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, LogIn, User, Key, Sparkles, RefreshCw, Stethoscope } from "lucide-react";
import { useAuthActions } from "@/stores/authStore";
import PermissionManager from "@/lib/permissions";

interface LoginFormProps {
  onLoginSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(true);
  
  const { login } = useAuthActions();

  const demoCredentials = [
    { 
      username: 'admin', 
      password: 'admin123', 
      role: 'Administrador', 
      description: 'Acesso total ao sistema',
      icon: '👑',
      bgColor: 'bg-marsala-50 border-marsala-200 hover:bg-marsala-100'
    },
    { 
      username: 'manager', 
      password: 'manager123', 
      role: 'Gerente', 
      description: 'Vendas e relatórios',
      icon: '📊',
      bgColor: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    { 
      username: 'seller', 
      password: 'seller123', 
      role: 'Vendedor', 
      description: 'Apenas vendas',
      icon: '🛍️',
      bgColor: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    { 
      username: 'viewer', 
      password: 'viewer123', 
      role: 'Visualizador', 
      description: 'Apenas consulta',
      icon: '👁️',
      bgColor: 'bg-gray-50 border-gray-200 hover:bg-gray-100'
    }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🔑 Tentativa de login via AuthStore:', { username, password: password.replace(/./g, '*') });

    try {
      const success = await login(username, password);
      
      if (success) {
        console.log('✅ Login realizado com sucesso via AuthStore');
        onLoginSuccess();
      } else {
        setError('Falha no login. Verifique suas credenciais.');
      }
    } catch (err) {
      console.error('❌ Erro de login via AuthStore:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    try {
      // Limpar completamente o localStorage relacionado ao sistema
      localStorage.removeItem('closetfesta_session');
      localStorage.removeItem('closetfesta_users');
      localStorage.removeItem('closetfesta_roles');
      
      // Forçar reinicialização
      PermissionManager.resetSystem();
      
      setError('');
      setUsername('');
      setPassword('');
      
      console.log('🔄 Sistema completamente resetado');
      alert('Sistema resetado! Usuários padrão recriados. Tente fazer login novamente.');
    } catch (err) {
      console.error('Erro ao resetar sistema:', err);
    }
  };

  const handleDiagnose = () => {
    try {
      // Verificar usuários no localStorage
      const users = JSON.parse(localStorage.getItem('closetfesta_users') || '[]');
      console.log('👥 Usuários no localStorage:', users);
      
      // Forçar reinicialização
      PermissionManager.initialize();
      
      alert(`Diagnóstico:\n- Usuários encontrados: ${users.length}\n- Verificar console para detalhes`);
    } catch (err) {
      console.error('Erro no diagnóstico:', err);
      alert('Erro no diagnóstico. Verificar console.');
    }
  };

  const quickLogin = (user: typeof demoCredentials[0]) => {
    setUsername(user.username);
    setPassword(user.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-marsala-50 via-neutral-50 to-marsala-100 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%23800020%22%20fill-opacity=%220.03%22%3E%3Ccircle%20cx=%2230%22%20cy=%2230%22%20r=%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
      
      <div className="relative w-full max-w-5xl">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-lg overflow-hidden">
          {/* Header com gradiente marsala */}
          <div className="relative bg-gradient-to-r from-marsala-600 to-marsala-800 p-8 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <CardHeader className="relative text-center pb-0">
              <div className="mx-auto mb-6 h-20 w-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-4 ring-white/30">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-4xl font-bold text-white mb-2">
                Closet Festa Manager
              </CardTitle>
              <div className="flex items-center justify-center gap-2 text-marsala-100">
                <Sparkles className="h-4 w-4" />
                <p className="text-lg">Sistema de Gestão de Aluguel de Roupas</p>
                <Sparkles className="h-4 w-4" />
              </div>
            </CardHeader>
          </div>

          <CardContent className="p-8 space-y-8">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {/* Formulário de Login */}
            <div className="max-w-md mx-auto">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2 text-gray-700 font-medium">
                    <User className="h-4 w-4 text-marsala-600" />
                    Usuário
                  </Label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Digite seu usuário"
                      className="h-12 pl-4 pr-4 border-gray-200 focus:border-marsala-400 focus:ring-marsala-400/20 bg-white/70"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2 text-gray-700 font-medium">
                    <Key className="h-4 w-4 text-marsala-600" />
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      className="h-12 pl-4 pr-4 border-gray-200 focus:border-marsala-400 focus:ring-marsala-400/20 bg-white/70"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-marsala-600 to-marsala-700 hover:from-marsala-700 hover:to-marsala-800 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Entrando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogIn className="h-5 w-5" />
                      Entrar no Sistema
                    </div>
                  )}
                </Button>
              </form>
            </div>

            {/* Seção de Demonstração */}
            {showDemo && (
              <div className="mt-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-gradient-to-r from-marsala-500 to-marsala-600 rounded-lg flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">Usuários para Demonstração</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDemo(false)}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  >
                    Ocultar
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {demoCredentials.map((user, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.02] ${user.bgColor}`}
                      onClick={() => quickLogin(user)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{user.icon}</span>
                          <Badge variant="outline" className="text-xs font-medium border-current">
                            {user.role}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">Clique para usar</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-gray-600" />
                          <span className="text-sm font-medium">{user.username}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Key className="h-3 w-3 text-gray-600" />
                          <span className="text-sm font-mono">{user.password}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 pl-5">{user.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ferramentas de Desenvolvimento */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1 h-11 border-marsala-200 text-marsala-700 hover:bg-marsala-50 hover:border-marsala-300"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resetar Sistema
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDiagnose}
                  className="flex-1 h-11 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Diagnóstico
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center border-t border-gray-100 pt-6">
              <div className="text-xs text-gray-500 space-y-1">
                <p className="font-medium">© 2025 Closet Festa Manager - Sistema de Demonstração</p>
                <p>Desenvolvido para gestão completa de aluguel de roupas</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <span>Feito com</span>
                  <span className="text-marsala-500">♥</span>
                  <span>usando React, TypeScript & Tailwind CSS</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm; 