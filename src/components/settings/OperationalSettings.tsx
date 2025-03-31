
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DollarSign, 
  Calendar, 
  Clock, 
  Plus,
  Trash,
  CreditCard,
  BankTransfer,
  Wallet,
  QrCode,
  PiggyBank
} from "lucide-react";

const OperationalSettings = () => {
  const [lateFeePercentage, setLateFeePercentage] = useState(10);
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, method: "Cartão de Crédito", enabled: true },
    { id: 2, method: "Cartão de Débito", enabled: true },
    { id: 3, method: "Dinheiro", enabled: true },
    { id: 4, method: "Pix", enabled: true },
    { id: 5, method: "Transferência Bancária", enabled: false },
  ]);
  
  // Horários de funcionamento
  const [workingHours, setWorkingHours] = useState({
    sunday: { open: false, start: "09:00", end: "18:00" },
    monday: { open: true, start: "09:00", end: "18:00" },
    tuesday: { open: true, start: "09:00", end: "18:00" },
    wednesday: { open: true, start: "09:00", end: "18:00" },
    thursday: { open: true, start: "09:00", end: "18:00" },
    friday: { open: true, start: "09:00", end: "18:00" },
    saturday: { open: true, start: "09:00", end: "14:00" },
  });
  
  const handleTogglePaymentMethod = (id: number) => {
    setPaymentMethods(methods => 
      methods.map(method => 
        method.id === id ? { ...method, enabled: !method.enabled } : method
      )
    );
  };
  
  const handleWorkingHourChange = (day: string, field: string, value: string | boolean) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value
      }
    }));
  };
  
  const PaymentMethodIcon = ({ method }: { method: string }) => {
    switch (method) {
      case "Cartão de Crédito":
        return <CreditCard size={18} />;
      case "Cartão de Débito":
        return <CreditCard size={18} />;
      case "Dinheiro":
        return <Wallet size={18} />;
      case "Pix":
        return <QrCode size={18} />;
      case "Transferência Bancária":
        return <BankTransfer size={18} />;
      default:
        return <DollarSign size={18} />;
    }
  };
  
  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle>Configurações Operacionais</CardTitle>
        <CardDescription>
          Defina os parâmetros operacionais do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="financial" className="w-full">
          <TabsList className="mb-6 grid grid-cols-2">
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <DollarSign size={16} />
              Financeiro
            </TabsTrigger>
            <TabsTrigger value="scheduling" className="flex items-center gap-2">
              <Calendar size={16} />
              Agendamento
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="financial" className="space-y-6">
            <div className="space-y-6">
              <div className="grid gap-6">
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <PiggyBank size={18} className="mr-2" />
                    Configuração de Multas e Taxas
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="late-fee">Percentual de multa por atraso (%)</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          id="late-fee"
                          type="number"
                          min="0"
                          max="100"
                          value={lateFeePercentage}
                          onChange={(e) => setLateFeePercentage(Number(e.target.value))}
                          className="w-24"
                        />
                        <span className="text-sm text-gray-500">% do valor do aluguel por dia</span>
                      </div>
                    </div>
                    
                    <div className="pt-2 pb-2 border-t border-b">
                      <div className="text-sm text-gray-500 mt-2 mb-3">
                        <strong>Exemplo:</strong> Para um vestido com aluguel de R$ 500,00, a multa por atraso seria de R$ {((500 * lateFeePercentage) / 100).toFixed(2)} por dia.
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cleaning-fee">Taxa de limpeza padrão (R$)</Label>
                      <Input 
                        id="cleaning-fee"
                        type="number"
                        min="0"
                        defaultValue="50"
                        className="w-full"
                      />
                      <p className="text-sm text-gray-500">Valor cobrado pela limpeza do vestido após devolução</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="damage-fee">Percentual para danos (%)</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          id="damage-fee"
                          type="number"
                          min="0"
                          max="100"
                          defaultValue="30"
                          className="w-24"
                        />
                        <span className="text-sm text-gray-500">% do valor do vestido</span>
                      </div>
                      <p className="text-sm text-gray-500">Porcentagem cobrada em caso de danos ao vestido</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="deposit">Caução padrão (R$)</Label>
                      <Input 
                        id="deposit"
                        type="number"
                        min="0"
                        defaultValue="200"
                        className="w-full"
                      />
                      <p className="text-sm text-gray-500">Valor retido como caução e devolvido na entrega do vestido em perfeito estado</p>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <CreditCard size={18} className="mr-2" />
                    Formas de Pagamento
                  </h3>
                  
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PaymentMethodIcon method={method.method} />
                          <span>{method.method}</span>
                        </div>
                        <Switch 
                          checked={method.enabled}
                          onCheckedChange={() => handleTogglePaymentMethod(method.id)}
                        />
                      </div>
                    ))}
                    
                    <Button variant="outline" className="w-full mt-4">
                      <Plus size={16} className="mr-2" />
                      Adicionar Nova Forma de Pagamento
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <BankTransfer size={18} className="mr-2" />
                    Dados Bancários
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bank-name">Banco</Label>
                      <Input 
                        id="bank-name"
                        placeholder="Nome do banco"
                        defaultValue="Banco do Brasil"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="agency">Agência</Label>
                        <Input 
                          id="agency"
                          placeholder="Número da agência"
                          defaultValue="1234"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="account">Conta</Label>
                        <Input 
                          id="account"
                          placeholder="Número da conta"
                          defaultValue="56789-0"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="account-holder">Titular</Label>
                      <Input 
                        id="account-holder"
                        placeholder="Nome do titular da conta"
                        defaultValue="Empresa de Vestidos Ltda."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input 
                        id="cnpj"
                        placeholder="CNPJ da empresa"
                        defaultValue="12.345.678/0001-90"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="scheduling" className="space-y-6">
            <div className="space-y-6">
              <div className="grid gap-6">
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Clock size={18} className="mr-2" />
                    Horário de Funcionamento
                  </h3>
                  
                  <div className="space-y-4">
                    {Object.entries(workingHours).map(([day, hours]) => {
                      const dayNames: Record<string, string> = {
                        sunday: "Domingo",
                        monday: "Segunda-feira",
                        tuesday: "Terça-feira",
                        wednesday: "Quarta-feira",
                        thursday: "Quinta-feira",
                        friday: "Sexta-feira",
                        saturday: "Sábado"
                      };
                      
                      return (
                        <div key={day} className="flex items-center justify-between">
                          <div className="w-1/3">
                            <div className="font-medium">{dayNames[day]}</div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={hours.open}
                              onCheckedChange={(checked) => 
                                handleWorkingHourChange(day, 'open', checked)
                              }
                            />
                            <span className={hours.open ? "" : "text-gray-400"}>
                              {hours.open ? "Aberto" : "Fechado"}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Input 
                              type="time"
                              value={hours.start}
                              onChange={(e) => 
                                handleWorkingHourChange(day, 'start', e.target.value)
                              }
                              className="w-24"
                              disabled={!hours.open}
                            />
                            <span className={hours.open ? "" : "text-gray-400"}>até</span>
                            <Input 
                              type="time"
                              value={hours.end}
                              onChange={(e) => 
                                handleWorkingHourChange(day, 'end', e.target.value)
                              }
                              className="w-24"
                              disabled={!hours.open}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">Configurações de Agendamento</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fitting-duration">Duração padrão para provas (minutos)</Label>
                      <Select defaultValue="60">
                        <SelectTrigger id="fitting-duration" className="w-full">
                          <SelectValue placeholder="Selecione a duração" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutos</SelectItem>
                          <SelectItem value="45">45 minutos</SelectItem>
                          <SelectItem value="60">60 minutos</SelectItem>
                          <SelectItem value="90">90 minutos</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500">Tempo reservado para cada sessão de prova</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pickup-duration">Duração padrão para retiradas (minutos)</Label>
                      <Select defaultValue="30">
                        <SelectTrigger id="pickup-duration" className="w-full">
                          <SelectValue placeholder="Selecione a duração" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutos</SelectItem>
                          <SelectItem value="30">30 minutos</SelectItem>
                          <SelectItem value="45">45 minutos</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500">Tempo reservado para retirada de vestidos</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="return-duration">Duração padrão para devoluções (minutos)</Label>
                      <Select defaultValue="15">
                        <SelectTrigger id="return-duration" className="w-full">
                          <SelectValue placeholder="Selecione a duração" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutos</SelectItem>
                          <SelectItem value="30">30 minutos</SelectItem>
                          <SelectItem value="45">45 minutos</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500">Tempo reservado para devolução de vestidos</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="interval">Intervalo entre agendamentos (minutos)</Label>
                      <Select defaultValue="15">
                        <SelectTrigger id="interval" className="w-full">
                          <SelectValue placeholder="Selecione o intervalo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Sem intervalo</SelectItem>
                          <SelectItem value="5">5 minutos</SelectItem>
                          <SelectItem value="10">10 minutos</SelectItem>
                          <SelectItem value="15">15 minutos</SelectItem>
                          <SelectItem value="30">30 minutos</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500">Tempo livre entre cada agendamento</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="max-daily">Máximo de agendamentos por dia</Label>
                      <Input 
                        id="max-daily"
                        type="number"
                        min="1"
                        defaultValue="10"
                        className="w-full"
                      />
                      <p className="text-sm text-gray-500">Limite de agendamentos por dia</p>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">Datas Bloqueadas</h4>
                      <div className="space-y-2">
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span>01/01/2024</span>
                            <Button variant="ghost" size="sm" className="text-red-600 h-8 px-2">
                              <Trash size={16} />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-500">Ano Novo</p>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span>12/02/2024 - 14/02/2024</span>
                            <Button variant="ghost" size="sm" className="text-red-600 h-8 px-2">
                              <Trash size={16} />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-500">Carnaval</p>
                        </div>
                        
                        <Button variant="outline" className="w-full">
                          <Plus size={16} className="mr-2" />
                          Adicionar Data Bloqueada
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>Salvar Configurações</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default OperationalSettings;
