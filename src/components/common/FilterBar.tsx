
import React from "react";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
  selectFilters?: {
    name: string;
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
  }[];
  dateFilter?: {
    name: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
  };
  onFilterClick?: () => void;
  showFilterButton?: boolean;
  onClearSearch?: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchPlaceholder = "Buscar...",
  onSearchChange,
  searchValue = "",
  selectFilters = [],
  dateFilter,
  onFilterClick,
  showFilterButton = true,
  onClearSearch,
}) => {
  return (
    <div className="premium-card p-4 mb-6">
      <div className="flex flex-col space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-10 pr-10"
            value={searchValue}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
          {searchValue && onClearSearch && (
            <button 
              onClick={onClearSearch}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-neutral-800"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Select filters */}
          {selectFilters.map((filter) => (
            <div key={filter.name}>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                {filter.label}
              </label>
              <select
                name={filter.name}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="input-field w-full"
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Date filter */}
          {dateFilter && (
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                {dateFilter.label}
              </label>
              <input
                type="date"
                name={dateFilter.name}
                value={dateFilter.value}
                onChange={(e) => dateFilter.onChange(e.target.value)}
                className="input-field w-full"
              />
            </div>
          )}

          {/* Filter button */}
          {showFilterButton && (
            <div className="flex items-end">
              <Button
                onClick={onFilterClick}
                className="bg-marsala hover:bg-marsala-700 w-full"
              >
                <Filter className="mr-2 h-4 w-4" /> Filtrar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
