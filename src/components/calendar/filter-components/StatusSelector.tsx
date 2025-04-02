
import React from "react";
import { Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { STATUS_OPTIONS } from "../types/filterTypes";

interface StatusSelectorProps {
  selectedStatuses: string[];
  onStatusChange: (status: string) => void;
}

const StatusSelector = ({ selectedStatuses, onStatusChange }: StatusSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">Status</Label>
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map(status => (
          <div 
            key={status.id}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-colors flex items-center gap-1",
              selectedStatuses.includes(status.id)
                ? "bg-marsala text-white border-marsala"
                : "bg-white text-neutral-700 border-neutral-300 hover:border-marsala"
            )}
            onClick={() => onStatusChange(status.id)}
          >
            {selectedStatuses.includes(status.id) && <Check size={14} />}
            {status.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusSelector;
