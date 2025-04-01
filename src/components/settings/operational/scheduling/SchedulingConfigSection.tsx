
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash } from "lucide-react";

const SchedulingConfigSection = () => {
  return (
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
  );
};

export default SchedulingConfigSection;
