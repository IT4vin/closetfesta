
import React from "react";
import { EventFilters } from "./types/filterTypes";
import { useEventFilter } from "./hooks/useEventFilter";
import FilterHeader from "./filter-components/FilterHeader";
import SearchField from "./filter-components/SearchField";
import EventTypeSelector from "./filter-components/EventTypeSelector";
import DateRangeSelector from "./filter-components/DateRangeSelector";
import ProductField from "./filter-components/ProductField";
import StatusSelector from "./filter-components/StatusSelector";
import FilterActions from "./filter-components/FilterActions";

interface EventFilterFormProps {
  onClose: () => void;
  onApplyFilters: (filters: EventFilters) => void;
  initialFilters?: EventFilters;
}

const EventFilterForm = ({ onClose, onApplyFilters, initialFilters }: EventFilterFormProps) => {
  const {
    filters,
    handleEventTypeChange,
    handleStatusChange,
    handleInputChange,
    handleDateChange,
    handleReset,
    getFilterCount
  } = useEventFilter(initialFilters);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };
  
  const filterCount = getFilterCount();

  return (
    <div className="py-4 space-y-6">
      <FilterHeader
        filterCount={filterCount}
        onReset={handleReset}
        onClose={onClose}
      />

      <div className="space-y-5">
        <SearchField
          value={filters.client}
          onChange={handleInputChange}
        />
        
        <EventTypeSelector
          selectedTypes={filters.eventType}
          onTypeChange={handleEventTypeChange}
        />

        <DateRangeSelector
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          onDateChange={handleDateChange}
        />

        <ProductField
          value={filters.product}
          onChange={handleInputChange}
        />

        <StatusSelector
          selectedStatuses={filters.status}
          onStatusChange={handleStatusChange}
        />
      </div>

      <FilterActions
        onReset={handleReset}
        onApply={handleApply}
      />
    </div>
  );
};

export default EventFilterForm;
