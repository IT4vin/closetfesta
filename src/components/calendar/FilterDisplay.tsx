
import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventFilters } from "./EventFilterForm";

interface FilterDisplayProps {
  filters: EventFilters;
  onClearFilters: () => void;
}

const FilterDisplay = ({ filters, onClearFilters }: FilterDisplayProps) => {
  return (
    <div className="mb-6 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Filtros aplicados:</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-neutral-500 hover:text-neutral-700"
          onClick={onClearFilters}
        >
          <X size={16} className="mr-1" />
          Limpar todos
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {filters.eventType.map(type => (
          <Badge key={type} variant="outline" className="bg-white">
            Tipo: {type === 'prova' ? 'Prova' : 
                   type === 'evento' ? 'Evento' : 
                   type === 'ajuste' ? 'Ajuste' : 'Consultoria'}
          </Badge>
        ))}
        {filters.client && (
          <Badge variant="outline" className="bg-white">
            Cliente: {filters.client}
          </Badge>
        )}
        {filters.product && (
          <Badge variant="outline" className="bg-white">
            Produto: {filters.product}
          </Badge>
        )}
        {filters.dateFrom && (
          <Badge variant="outline" className="bg-white">
            De: {filters.dateFrom.toLocaleDateString()}
          </Badge>
        )}
        {filters.dateTo && (
          <Badge variant="outline" className="bg-white">
            Até: {filters.dateTo.toLocaleDateString()}
          </Badge>
        )}
        {filters.status.map(status => (
          <Badge key={status} variant="outline" className="bg-white">
            Status: {status === 'agendado' ? 'Agendado' : 
                    status === 'confirmado' ? 'Confirmado' : 
                    status === 'cancelado' ? 'Cancelado' : 'Concluído'}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default FilterDisplay;
