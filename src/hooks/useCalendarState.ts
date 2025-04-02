
import { useState, useEffect } from "react";
import { EventFilters } from "@/components/calendar/types/filterTypes";

interface TodayEvent {
  id: string;
  title: string;
  type: string;
  typeColor: string;
  time: string;
  location: string;
  client: string;
}

export const useCalendarState = () => {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<EventFilters>({
    eventType: [],
    client: "",
    product: "",
    dateFrom: undefined,
    dateTo: undefined,
    status: []
  });
  const [isFiltering, setIsFiltering] = useState(false);
  const [todayEvents, setTodayEvents] = useState<TodayEvent[]>([
    {
      id: "event-1",
      title: "Casamento Silva",
      type: "Aluguel",
      typeColor: "marsala",
      time: "18:00",
      location: "Casa de Festas Elegance",
      client: "Ana Silva"
    },
    {
      id: "event-2",
      title: "Prova de Vestido",
      type: "Prova",
      typeColor: "blue",
      time: "14:30",
      location: "Loja Central",
      client: "Maria Oliveira"
    },
    {
      id: "event-3",
      title: "Ajuste Final",
      type: "Ajuste",
      typeColor: "amber",
      time: "10:00",
      location: "Atelier",
      client: "Carla Mendes"
    }
  ]);

  useEffect(() => {
    // In a real app, this would fetch today's events from an API
    console.log("Fetching today's events with filters:", activeFilters);
  }, [activeFilters]);

  const handleApplyFilters = (filters: EventFilters) => {
    console.log("Applied filters:", filters);
    setActiveFilters(filters);
    setIsFiltering(
      filters.eventType.length > 0 || 
      !!filters.client || 
      !!filters.product || 
      !!filters.dateFrom || 
      !!filters.dateTo || 
      filters.status.length > 0
    );
  };

  const handleClearFilters = () => {
    setActiveFilters({
      eventType: [],
      client: "",
      product: "",
      dateFrom: undefined,
      dateTo: undefined,
      status: []
    });
    setIsFiltering(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (activeFilters.eventType.length > 0) count++;
    if (activeFilters.client) count++;
    if (activeFilters.product) count++;
    if (activeFilters.dateFrom || activeFilters.dateTo) count++;
    if (activeFilters.status.length > 0) count++;
    return count;
  };

  return {
    isScheduleOpen,
    setIsScheduleOpen,
    isFilterOpen,
    setIsFilterOpen,
    activeFilters,
    isFiltering,
    todayEvents,
    handleApplyFilters,
    handleClearFilters,
    getActiveFilterCount
  };
};
