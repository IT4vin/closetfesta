
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import EmployeeForm from "./EmployeeForm";
import UserPermissions from "./UserPermissions";

const UserManagement = () => {
  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle>Gerenciamento de Usuários</CardTitle>
        <CardDescription>
          Cadastre funcionários e gerencie permissões de acesso ao sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="employees" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="employees">Cadastro de Funcionários</TabsTrigger>
            <TabsTrigger value="permissions">Permissões e Acessos</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="max-h-[600px]">
            <TabsContent value="employees" className="pr-2">
              <EmployeeForm />
            </TabsContent>
            
            <TabsContent value="permissions" className="pr-2">
              <UserPermissions />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
