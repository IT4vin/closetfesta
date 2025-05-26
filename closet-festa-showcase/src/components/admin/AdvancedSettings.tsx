
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Palette, Shield, Bell, Globe, Database } from 'lucide-react';
import { toast } from 'sonner';

const AdvancedSettings = () => {
  const [settings, setSettings] = useState({
    // Configurações de Aparência
    primaryColor: '#800000',
    secondaryColor: '#D4AF37',
    fontFamily: 'Poppins',
    logoPosition: 'left',
    headerStyle: 'modern',
    
    // Configurações de SEO
    metaTitle: 'Closet Festa - Aluguel de Vestidos',
    metaDescription: 'Alugue vestidos elegantes para suas ocasiões especiais',
    metaKeywords: 'aluguel, vestidos, festa, eventos, casamento',
    
    // Configurações de Notificações
    emailNotifications: true,
    smsNotifications: false,
    whatsappNotifications: true,
    orderNotifications: true,
    stockNotifications: true,
    
    // Configurações de Segurança
    requireEmailVerification: false,
    enableTwoFactor: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    
    // Configurações de Negócio
    minRentalDays: 1,
    maxRentalDays: 7,
    advanceBookingDays: 30,
    cancellationWindow: 24,
    
    // Configurações de Pagamento
    acceptCreditCard: true,
    acceptDebitCard: true,
    acceptPix: true,
    acceptCash: true,
    requireDeposit: true,
    depositPercentage: 30,
    
    // Configurações de Entrega
    deliveryZones: ['Centro', 'Zona Sul', 'Zona Norte'],
    deliveryFee: 15.00,
    freeDeliveryMinimum: 100.00,
    pickupAvailable: true,
    
    // Configurações de Sistema
    backupFrequency: 'daily',
    enableAnalytics: true,
    enableChat: true,
    maintenanceMode: false
  });

  const [activeTab, setActiveTab] = useState('appearance');

  const handleSave = () => {
    // Aqui você salvaria as configurações no backend
    toast.success('Configurações salvas com sucesso!');
  };

  const tabs = [
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'seo', label: 'SEO', icon: Globe },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'business', label: 'Negócio', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-marsala">Configurações Avançadas</h2>
        <Button onClick={handleSave} className="bg-marsala hover:bg-marsala-dark">
          <Save className="w-4 h-4 mr-2" />
          Salvar Todas
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar de Navegação */}
        <div className="lg:w-64">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-marsala text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1">
          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Aparência</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cor Principal</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-20"
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                        placeholder="#800000"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Cor Secundária</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="w-20"
                      />
                      <Input
                        value={settings.secondaryColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        placeholder="#D4AF37"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Família da Fonte</Label>
                    <Select value={settings.fontFamily} onValueChange={(value) => setSettings(prev => ({ ...prev, fontFamily: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Poppins">Poppins</SelectItem>
                        <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Posição do Logo</Label>
                    <Select value={settings.logoPosition} onValueChange={(value) => setSettings(prev => ({ ...prev, logoPosition: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Esquerda</SelectItem>
                        <SelectItem value="center">Centro</SelectItem>
                        <SelectItem value="right">Direita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Estilo do Cabeçalho</Label>
                  <Select value={settings.headerStyle} onValueChange={(value) => setSettings(prev => ({ ...prev, headerStyle: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Moderno</SelectItem>
                      <SelectItem value="classic">Clássico</SelectItem>
                      <SelectItem value="minimal">Minimalista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'seo' && (
            <Card>
              <CardHeader>
                <CardTitle>Configurações de SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Título da Página (Meta Title)</Label>
                  <Input
                    value={settings.metaTitle}
                    onChange={(e) => setSettings(prev => ({ ...prev, metaTitle: e.target.value }))}
                    placeholder="Título que aparece no Google"
                  />
                </div>
                <div>
                  <Label>Descrição da Página (Meta Description)</Label>
                  <Textarea
                    value={settings.metaDescription}
                    onChange={(e) => setSettings(prev => ({ ...prev, metaDescription: e.target.value }))}
                    placeholder="Descrição que aparece no Google"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Palavras-chave (Meta Keywords)</Label>
                  <Input
                    value={settings.metaKeywords}
                    onChange={(e) => setSettings(prev => ({ ...prev, metaKeywords: e.target.value }))}
                    placeholder="palavras, separadas, por, vírgulas"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Notificações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificações por Email</Label>
                      <p className="text-sm text-gray-600">Receber notificações por email</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificações por SMS</Label>
                      <p className="text-sm text-gray-600">Receber notificações por SMS</p>
                    </div>
                    <Switch
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smsNotifications: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificações por WhatsApp</Label>
                      <p className="text-sm text-gray-600">Receber notificações por WhatsApp</p>
                    </div>
                    <Switch
                      checked={settings.whatsappNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, whatsappNotifications: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificações de Pedidos</Label>
                      <p className="text-sm text-gray-600">Notificar sobre novos pedidos</p>
                    </div>
                    <Switch
                      checked={settings.orderNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, orderNotifications: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificações de Estoque</Label>
                      <p className="text-sm text-gray-600">Notificar sobre estoque baixo</p>
                    </div>
                    <Switch
                      checked={settings.stockNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, stockNotifications: checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Segurança</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Verificação de Email Obrigatória</Label>
                      <p className="text-sm text-gray-600">Exigir verificação de email para novos usuários</p>
                    </div>
                    <Switch
                      checked={settings.requireEmailVerification}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireEmailVerification: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Autenticação de Dois Fatores</Label>
                      <p className="text-sm text-gray-600">Habilitar 2FA para administradores</p>
                    </div>
                    <Switch
                      checked={settings.enableTwoFactor}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableTwoFactor: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Timeout de Sessão (minutos)</Label>
                      <Input
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 60 }))}
                      />
                    </div>
                    <div>
                      <Label>Máximo de Tentativas de Login</Label>
                      <Input
                        type="number"
                        value={settings.maxLoginAttempts}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) || 5 }))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'business' && (
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Negócio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Configurações de Aluguel</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Mínimo de Dias de Aluguel</Label>
                      <Input
                        type="number"
                        value={settings.minRentalDays}
                        onChange={(e) => setSettings(prev => ({ ...prev, minRentalDays: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                    <div>
                      <Label>Máximo de Dias de Aluguel</Label>
                      <Input
                        type="number"
                        value={settings.maxRentalDays}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxRentalDays: parseInt(e.target.value) || 7 }))}
                      />
                    </div>
                    <div>
                      <Label>Antecedência para Reserva (dias)</Label>
                      <Input
                        type="number"
                        value={settings.advanceBookingDays}
                        onChange={(e) => setSettings(prev => ({ ...prev, advanceBookingDays: parseInt(e.target.value) || 30 }))}
                      />
                    </div>
                    <div>
                      <Label>Prazo para Cancelamento (horas)</Label>
                      <Input
                        type="number"
                        value={settings.cancellationWindow}
                        onChange={(e) => setSettings(prev => ({ ...prev, cancellationWindow: parseInt(e.target.value) || 24 }))}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-4">Configurações de Pagamento</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={settings.acceptCreditCard}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, acceptCreditCard: checked }))}
                        />
                        <Label>Cartão de Crédito</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={settings.acceptDebitCard}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, acceptDebitCard: checked }))}
                        />
                        <Label>Cartão de Débito</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={settings.acceptPix}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, acceptPix: checked }))}
                        />
                        <Label>PIX</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={settings.acceptCash}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, acceptCash: checked }))}
                        />
                        <Label>Dinheiro</Label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={settings.requireDeposit}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireDeposit: checked }))}
                        />
                        <Label>Exigir Caução</Label>
                      </div>
                      <div>
                        <Label>Percentual da Caução (%)</Label>
                        <Input
                          type="number"
                          value={settings.depositPercentage}
                          onChange={(e) => setSettings(prev => ({ ...prev, depositPercentage: parseInt(e.target.value) || 30 }))}
                          disabled={!settings.requireDeposit}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-4">Configurações de Entrega</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Zonas de Entrega</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {settings.deliveryZones.map((zone, index) => (
                          <Badge key={index} variant="secondary">{zone}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Taxa de Entrega (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={settings.deliveryFee}
                          onChange={(e) => setSettings(prev => ({ ...prev, deliveryFee: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <Label>Frete Grátis a partir de (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={settings.freeDeliveryMinimum}
                          onChange={(e) => setSettings(prev => ({ ...prev, freeDeliveryMinimum: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.pickupAvailable}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, pickupAvailable: checked }))}
                      />
                      <Label>Permitir Retirada no Local</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettings;
