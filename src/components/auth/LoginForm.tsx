import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, LogIn, User, Key } from "lucide-react";
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

  const demoCredentials = [
    { username: 'admin', password: 'admin123', role: 'Administrador', description: 'Acesso total', color: 'bg-red-50 border-red-200' },
    { username: 'manager', password: 'manager123', role: 'Gerente', description: 'Vendas e relatórios', color: 'bg-blue-50 border-blue-200' },
    { username: 'seller', password: 'seller123', role: 'Vendedor', description: 'Apenas vendas', color: 'bg-green-50 border-green-200' },
    { username: 'viewer', password: 'viewer123', role: 'Visualizador', description: 'Apenas consulta', color: 'bg-gray-50 border-gray-200' }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🔑 Tentativa de login:', { username, password: password.replace(/./g, '*') });

    try {
      await PermissionManager.login(username, password);
      console.log('✅ Login realizado com sucesso');
      onLoginSuccess();
    } catch (err) {
      console.error('❌ Erro de login:', err);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Título */}
        <div className="text-center">
          <div className="bg-white p-4 rounded-full w-16 h-16 mx-auto mb-4 shadow-lg">
            <Shield className="h-8 w-8 text-purple-600 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ClosetFesta</h1>
          <p className="text-gray-600">Sistema de Gestão Híbrido</p>
        </div>

        {/* Formulário de Login */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Fazer Login
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Usuário
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>

              {error && (
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full text-sm"
                  onClick={handleReset}
                >
                  🔄 Resetar Sistema (caso persistam problemas)
                </Button>
              )}

              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={handleDiagnose}
                >
                  🔍 Diagnóstico
                </Button>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => {
                    setUsername('admin');
                    setPassword('admin123');
                  }}
                >
                  ⚡ Login Rápido
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Credenciais de Demonstração */}
        {showDemo && (
          <Card className="shadow-lg border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Credenciais de Demonstração
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDemo(false)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {demoCredentials.map((cred, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-4 border-2 rounded-lg hover:shadow-md cursor-pointer transition-all ${cred.color}`}
                  onClick={() => quickLogin(cred)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-bold text-lg">{cred.username}</div>
                      <Badge variant="outline" className="text-xs">{cred.role}</Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">{cred.description}</div>
                    <div className="text-xs bg-white px-2 py-1 rounded border">
                      <span className="text-gray-500">Senha: </span>
                      <span className="font-mono font-bold text-purple-600">{cred.password}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="ml-3">
                    ↗ Usar
                  </Button>
                </div>
              ))}
              
              <div className="text-xs text-center text-gray-500 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                💡 <strong>Dica:</strong> Clique em qualquer cartão acima para preencher automaticamente.<br/>
                As senhas são exatamente como mostrado (admin123, manager123, etc.)
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recursos do Sistema */}
        <Card className="shadow-lg border-green-200">
          <CardHeader>
            <CardTitle className="text-lg text-green-800">🚀 Otimizações Implementadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Compressão de Dados
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Sync Diferencial
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Dashboard Executivo
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Sistema de Permissões
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm; 