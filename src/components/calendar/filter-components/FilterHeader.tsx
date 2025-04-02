
import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FilterHeaderProps {
  filterCount: number;
  onReset: () => void;
  onClose: () => void;
}

const FilterHeader = ({ filterCount, onReset, onClose }: FilterHeaderProps) => {
  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">Filtrar Eventos</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="text-neutral-500"
        >
          <X size={18} />
        </Button>
      </div>

      {filterCount > 0 && (
        <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium flex items-center gap-1">
              <Badge variant="default" className="bg-marsala text-white">
                {filterCount}
              </Badge>
              Filtros aplicados
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs text-neutral-500"
              onClick={onReset}
            >
              Limpar todos
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default FilterHeader;
