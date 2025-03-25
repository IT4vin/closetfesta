
import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

// Helper function to generate dates for the current month
const getDaysInMonth = (year: number, month: number) => {
  const date = new Date(year, month, 1);
  const days = [];
  
  // Add previous month days to fill the first week
  const firstDay = date.getDay();
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      date: prevMonthLastDate - i,
      currentMonth: false,
      events: [],
    });
  }
  
  // Add current month days
  while (date.getMonth() === month) {
    days.push({
      date: date.getDate(),
      currentMonth: true,
      today: date.toDateString() === new Date().toDateString(),
      events: getEventsForDate(date), // This would fetch real events in a real app
    });
    date.setDate(date.getDate() + 1);
  }
  
  // Add next month days to fill the last week
  const lastDay = new Date(year, month + 1, 0).getDay();
  if (lastDay < 6) {
    for (let i = 1; i <= 6 - lastDay; i++) {
      days.push({
        date: i,
        currentMonth: false,
        events: [],
      });
    }
  }
  
  return days;
};

// Mock function to generate events for a date
const getEventsForDate = (date: Date) => {
  // In a real app, this would come from an API
  const day = date.getDate();
  const events = [];
  
  // Random events for demo purposes
  if (day % 5 === 0) {
    events.push({
      id: `event-${date.getTime()}-1`,
      title: "Casamento Silva",
      type: "rental",
      time: "18:00",
    });
  }
  
  if (day % 3 === 0) {
    events.push({
      id: `event-${date.getTime()}-2`,
      title: "Prova de Vestido",
      type: "fitting",
      time: "14:30",
    });
  }
  
  if (day % 7 === 0) {
    events.push({
      id: `event-${date.getTime()}-3`,
      title: "Formatura Santos",
      type: "rental",
      time: "19:00",
    });
  }
  
  return events;
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const Calendar = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  
  const days = getDaysInMonth(currentYear, currentMonth);
  
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  const handleDateClick = (day: (typeof days)[0], index: number) => {
    if (day.currentMonth) {
      setSelectedDate(new Date(currentYear, currentMonth, day.date));
    }
  };

  return (
    <div className="premium-card">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={prevMonth}
              className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={nextMonth}
              className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
            <button className="primary-button py-1.5 ml-2">
              <Plus size={16} />
              <span>Novo</span>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-neutral-500">
              {day}
            </div>
          ))}
          
          {days.map((day, index) => (
            <div 
              key={index}
              onClick={() => handleDateClick(day, index)}
              className={`
                min-h-[100px] p-2 border border-neutral-100 transition-all
                ${day.currentMonth ? "bg-white" : "bg-neutral-50 text-neutral-400"}
                ${day.today ? "border-marsala" : ""}
                ${selectedDate && day.currentMonth && day.date === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear() ? "ring-2 ring-marsala ring-opacity-50" : ""}
                ${day.currentMonth ? "hover:bg-neutral-50 cursor-pointer" : ""}
              `}
            >
              <div className="text-sm mb-1">{day.date}</div>
              
              <div className="space-y-1">
                {day.events.map((event) => (
                  <div 
                    key={event.id} 
                    className={`calendar-event ${event.type}`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="truncate">{event.title}</span>
                    </div>
                    <div className="text-xs opacity-70">{event.time}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
