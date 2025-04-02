
import React from "react";
import MainLayout from "../components/layout/MainLayout";
import CalendarComponent from "../components/calendar/Calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import ScheduleForm from "@/components/dashboard/ScheduleForm";
import EventFilterForm from "@/components/calendar/EventFilterForm";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import FilterDisplay from "@/components/calendar/FilterDisplay";
import TodayEvents from "@/components/calendar/TodayEvents";
import { useCalendarState } from "@/hooks/useCalendarState";

const CalendarPage = () => {
  const {
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
  } = useCalendarState();

  return (
    <MainLayout>
      <div className="page-transition">
        <CalendarHeader 
          onOpenFilter={() => setIsFilterOpen(true)}
          onOpenSchedule={() => setIsScheduleOpen(true)}
          isFiltering={isFiltering}
          filterCount={getActiveFilterCount()}
        />
        
        {isFiltering && (
          <FilterDisplay 
            filters={activeFilters} 
            onClearFilters={handleClearFilters} 
          />
        )}
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-2/3">
            <CalendarComponent />
          </div>
          
          <div className="w-full lg:w-1/3">
            <TodayEvents 
              events={todayEvents}
              onAddEvent={() => setIsScheduleOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Agendar</DialogTitle>
          </DialogHeader>
          <ScheduleForm onClose={() => setIsScheduleOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Filter Sheet */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent side="right" className="sm:max-w-[500px] w-[90vw] overflow-y-auto">
          <EventFilterForm 
            onClose={() => setIsFilterOpen(false)} 
            onApplyFilters={handleApplyFilters}
            initialFilters={activeFilters}
          />
        </SheetContent>
      </Sheet>
    </MainLayout>
  );
};

export default CalendarPage;
