
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Clock } from "lucide-react";

const WorkingHoursSection = () => {
  const [workingHours, setWorkingHours] = useState({
    sunday: { open: false, start: "09:00", end: "18:00" },
    monday: { open: true, start: "09:00", end: "18:00" },
    tuesday: { open: true, start: "09:00", end: "18:00" },
    wednesday: { open: true, start: "09:00", end: "18:00" },
    thursday: { open: true, start: "09:00", end: "18:00" },
    friday: { open: true, start: "09:00", end: "18:00" },
    saturday: { open: true, start: "09:00", end: "14:00" },
  });
  
  const handleWorkingHourChange = (day: string, field: string, value: string | boolean) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value
      }
    }));
  };
  
  return (
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
  );
};

export default WorkingHoursSection;
