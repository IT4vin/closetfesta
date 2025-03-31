
import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import UserManagement from "./UserManagement";
import SecuritySettings from "./SecuritySettings";
import SystemPersonalization from "./SystemPersonalization";
import OperationalSettings from "./OperationalSettings";
import { User, Shield, Palette, Settings } from "lucide-react";

const SettingsTabs = () => {
  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList className="grid grid-cols-4 mb-8">
        <TabsTrigger value="users" className="flex items-center gap-2">
          <User size={16} />
          <span className="hidden sm:inline">Usuários</span>
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-2">
          <Shield size={16} />
          <span className="hidden sm:inline">Segurança</span>
        </TabsTrigger>
        <TabsTrigger value="personalization" className="flex items-center gap-2">
          <Palette size={16} />
          <span className="hidden sm:inline">Personalização</span>
        </TabsTrigger>
        <TabsTrigger value="operational" className="flex items-center gap-2">
          <Settings size={16} />
          <span className="hidden sm:inline">Operacional</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="users" className="space-y-6">
        <UserManagement />
      </TabsContent>
      
      <TabsContent value="security" className="space-y-6">
        <SecuritySettings />
      </TabsContent>
      
      <TabsContent value="personalization" className="space-y-6">
        <SystemPersonalization />
      </TabsContent>
      
      <TabsContent value="operational" className="space-y-6">
        <OperationalSettings />
      </TabsContent>
    </Tabs>
  );
};

export default SettingsTabs;
