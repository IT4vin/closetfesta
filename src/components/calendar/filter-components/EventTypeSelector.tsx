
import React from "react";
import { Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { EVENT_TYPES } from "../types/filterTypes";

interface EventTypeSelectorProps {
  selectedTypes: string[];
  onTypeChange: (type: string) => void;
}

const EventTypeSelector = ({ selectedTypes, onTypeChange }: EventTypeSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">Tipo de Evento</Label>
      <div className="flex flex-wrap gap-2">
        {EVENT_TYPES.map(type => (
          <div 
            key={type.id}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-colors flex items-center gap-1",
              selectedTypes.includes(type.id)
                ? "bg-marsala text-white border-marsala"
                : "bg-white text-neutral-700 border-neutral-300 hover:border-marsala"
            )}
            onClick={() => onTypeChange(type.id)}
          >
            {selectedTypes.includes(type.id) && <Check size={14} />}
            {type.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventTypeSelector;
