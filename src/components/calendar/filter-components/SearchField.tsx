
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SearchField = ({ value, onChange }: SearchFieldProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
      <Input 
        name="client"
        value={value}
        onChange={onChange}
        placeholder="Buscar por cliente..."
        className="pl-9"
      />
    </div>
  );
};

export default SearchField;
