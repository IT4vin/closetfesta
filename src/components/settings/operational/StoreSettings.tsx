
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Store, Shield, Palette, CreditCard } from "lucide-react";
import StoreDataSection from "./store/StoreDataSection";
import StoreSecuritySection from "./store/StoreSecuritySection";
import StorePersonalizationSection from "./store/StorePersonalizationSection";
import StoreIntegrationSection from "./store/StoreIntegrationSection";

const StoreSettings = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="data" className="w-full">
        <TabsList className="flex flex-wrap mb-6">
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Store size={16} />
            Dados Cadastrais
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield size={16} />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="personalization" className="flex items-center gap-2">
            <Palette size={16} />
            Personalização
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <CreditCard size={16} />
            Integrações
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="data" className="space-y-6">
          <StoreDataSection />
        </TabsContent>
        
        <TabsContent value="security" className="space-y-6">
          <StoreSecuritySection />
        </TabsContent>
        
        <TabsContent value="personalization" className="space-y-6">
          <StorePersonalizationSection />
        </TabsContent>
        
        <TabsContent value="integrations" className="space-y-6">
          <StoreIntegrationSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StoreSettings;
