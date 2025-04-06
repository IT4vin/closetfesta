
import React from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface PeriodSelectorDropdownProps {
  timeRange: string;
  setTimeRange: (value: string) => void;
}

const PeriodSelectorDropdown = ({ timeRange, setTimeRange }: PeriodSelectorDropdownProps) => {
  return (
    <Select 
      value={timeRange}
      onValueChange={(value) => setTimeRange(value)}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Período" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="week">Última Semana</SelectItem>
        <SelectItem value="month">Último Mês</SelectItem>
        <SelectItem value="quarter">Último Trimestre</SelectItem>
        <SelectItem value="year">Último Ano</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default PeriodSelectorDropdown;
