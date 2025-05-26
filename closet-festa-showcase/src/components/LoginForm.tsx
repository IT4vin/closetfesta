
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/context/AppContext";

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { login } = useAppContext();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      if (success && onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError("Ocorreu um erro durante o login");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-marsala">Login Administrativo</h2>
        <p className="text-gray-500 text-sm">
          Acesse para gerenciar seu catálogo
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@closetfesta.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <Button 
          type="submit" 
          className="w-full bg-marsala hover:bg-marsala-dark" 
          disabled={isLoading}
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
      
      <div className="text-center text-xs text-gray-500">
        <p>Demonstração: use admin@closetfesta.com / admin123</p>
      </div>
    </div>
  );
};

export default LoginForm;
