
import { useState } from "react";
import { EventFilters } from "../types/filterTypes";

export const useEventFilter = (initialFilters?: EventFilters) => {
  const [filters, setFilters] = useState<EventFilters>(initialFilters || {
    eventType: [],
    client: "",
    product: "",
    dateFrom: undefined,
    dateTo: undefined,
    status: []
  });

  const handleEventTypeChange = (type: string) => {
    setFilters(prev => {
      const types = prev.eventType.includes(type) 
        ? prev.eventType.filter(t => t !== type)
        : [...prev.eventType, type];
      
      return { ...prev, eventType: types };
    });
  };

  const handleStatusChange = (status: string) => {
    setFilters(prev => {
      const statuses = prev.status.includes(status) 
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status];
      
      return { ...prev, status: statuses };
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (field: 'dateFrom' | 'dateTo', date: Date | undefined) => {
    setFilters(prev => ({ ...prev, [field]: date }));
  };

  const handleReset = () => {
    setFilters({
      eventType: [],
      client: "",
      product: "",
      dateFrom: undefined,
      dateTo: undefined,
      status: []
    });
  };

  const getFilterCount = () => {
    let count = 0;
    if (filters.eventType.length > 0) count++;
    if (filters.client) count++;
    if (filters.product) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.status.length > 0) count++;
    return count;
  };

  return {
    filters,
    handleEventTypeChange,
    handleStatusChange,
    handleInputChange,
    handleDateChange,
    handleReset,
    getFilterCount
  };
};
