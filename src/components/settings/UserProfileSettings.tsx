
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileFormValues {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const UserProfileSettings = () => {
  const { user } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<ProfileFormValues>({
    defaultValues: {
      email: user?.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const watchNewPassword = watch("newPassword");

  // Obter as iniciais do nome do usuário para o avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const onSubmit = (data: ProfileFormValues) => {
    // Simulate API call with timeout
    toast({
      title: "Informações atualizadas",
      description: "Suas informações de perfil foram atualizadas com sucesso.",
    });
    
    // Reset password fields after successful submission
    reset({
      ...data,
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle>Perfil do Usuário</CardTitle>
        <CardDescription>
          Atualize suas informações de perfil e senha
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center space-x-4 mb-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-lg">{user ? getInitials(user.name) : "U"}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-medium">{user?.name}</h3>
              <p className="text-sm text-gray-500">{user?.role === "admin" ? "Administrador" : "Usuário"}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email"
                type="email"
                {...register("email", {
                  required: "E-mail é obrigatório",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Endereço de e-mail inválido"
                  }
                })}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="text-md font-semibold mb-4">Alterar Senha</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      {...register("currentPassword", {
                        required: "Senha atual é obrigatória para alteração"
                      })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                  {errors.currentPassword && (
                    <p className="text-sm text-red-500 mt-1">{errors.currentPassword.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      {...register("newPassword", {
                        minLength: {
                          value: 8,
                          message: "A senha deve ter no mínimo 8 caracteres"
                        }
                      })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-red-500 mt-1">{errors.newPassword.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirme Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      {...register("confirmPassword", {
                        validate: value => value === watchNewPassword || "As senhas não coincidem"
                      })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" className="bg-marsala hover:bg-marsala-700">
              <Save size={16} className="mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserProfileSettings;
