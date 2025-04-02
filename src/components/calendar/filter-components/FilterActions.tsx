
import React from "react";
import { Button } from "@/components/ui/button";

interface FilterActionsProps {
  onReset: () => void;
  onApply: () => void;
}

const FilterActions = ({ onReset, onApply }: FilterActionsProps) => {
  return (
    <div className="flex justify-between gap-4 pt-4 border-t border-neutral-200">
      <Button 
        variant="outline" 
        onClick={onReset}
      >
        Limpar Filtros
      </Button>
      <Button 
        className="bg-marsala hover:bg-marsala-700 text-white" 
        onClick={onApply}
      >
        Aplicar Filtros
      </Button>
    </div>
  );
};

export default FilterActions;
