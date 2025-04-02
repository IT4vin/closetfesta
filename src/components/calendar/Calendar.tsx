
import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogFooter,
  AlertDialogCancel
} from "@/components/ui/alert-dialog";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import ScheduleForm from "@/components/dashboard/ScheduleForm";

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
      client: "Ana Silva",
      status: "confirmado"
    });
  }
  
  if (day % 3 === 0) {
    events.push({
      id: `event-${date.getTime()}-2`,
      title: "Prova de Vestido",
      type: "fitting",
      time: "14:30",
      client: "Maria Oliveira",
      status: "agendado"
    });
  }
  
  if (day % 7 === 0) {
    events.push({
      id: `event-${date.getTime()}-3`,
      title: "Formatura Santos",
      type: "rental",
      time: "19:00",
      client: "Pedro Santos",
      status: "confirmado"
    });
  }
  
  if (day % 9 === 0) {
    events.push({
      id: `event-${date.getTime()}-4`,
      title: "Ajuste de Vestido",
      type: "adjustment",
      time: "10:00",
      client: "Laura Mendes",
      status: "confirmado"
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
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [isDeleteEventOpen, setIsDeleteEventOpen] = useState(false);
  const { toast } = useToast();
  
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
      
      // If the day has events, show them
      if (day.events.length > 0) {
        // Could open a drawer with events list
      } else if(day.currentMonth) {
        // Could open scheduling form pre-selecting this date
        setIsScheduleOpen(true);
      }
    }
  };
  
  const handleEventClick = (event: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
  };
  
  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today);
  };
  
  const handleDeleteEvent = () => {
    // In a real app, this would call an API to delete the event
    toast({
      title: "Evento excluído",
      description: "O evento foi excluído com sucesso.",
    });
    setIsDeleteEventOpen(false);
    setIsEventDetailsOpen(false);
  };

  return (
    <div className="premium-card">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={goToToday}
              className="text-sm"
            >
              <CalendarIcon size={16} className="mr-1" />
              Hoje
            </Button>
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
            <Button 
              className="bg-marsala hover:bg-marsala-700 text-white py-1.5 ml-2"
              onClick={() => setIsScheduleOpen(true)}
            >
              <Plus size={16} />
              <span>Novo</span>
            </Button>
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
              <div className="text-sm font-medium mb-1">{day.date}</div>
              
              <div className="space-y-1">
                {day.events.map((event) => (
                  <div 
                    key={event.id} 
                    onClick={(e) => handleEventClick(event, e)}
                    className={`
                      calendar-event p-1 rounded text-xs cursor-pointer transition-colors
                      ${event.type === 'rental' ? 'bg-marsala-100 text-marsala-800 hover:bg-marsala-200' : 
                       event.type === 'fitting' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : 
                       event.type === 'adjustment' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 
                       'bg-green-100 text-green-800 hover:bg-green-200'}
                    `}
                  >
                    <div className="flex items-center gap-1 font-medium truncate">
                      <Clock size={10} className="shrink-0" />
                      <span>{event.time}</span>
                      <span className="truncate">{event.title}</span>
                    </div>
                    <div className="text-[10px] opacity-70 truncate">{event.client}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Schedule Dialog */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Agendar</DialogTitle>
          </DialogHeader>
          <ScheduleForm 
            onClose={() => setIsScheduleOpen(false)} 
            initialDate={selectedDate || undefined}
          />
        </DialogContent>
      </Dialog>
      
      {/* Event Details Dialog */}
      {selectedEvent && (
        <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold">{selectedEvent.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-8">
                <div className="space-y-1 flex-1">
                  <div className="text-sm text-neutral-500">Cliente</div>
                  <div className="font-medium">{selectedEvent.client}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-neutral-500">Horário</div>
                  <div className="font-medium flex items-center">
                    <Clock size={14} className="mr-1" />
                    {selectedEvent.time}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-neutral-500">Tipo</div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium inline-block
                    ${selectedEvent.type === 'rental' ? 'bg-marsala-100 text-marsala-800' : 
                     selectedEvent.type === 'fitting' ? 'bg-blue-100 text-blue-800' : 
                     selectedEvent.type === 'adjustment' ? 'bg-amber-100 text-amber-800' : 
                     'bg-green-100 text-green-800'}
                  ">
                    {selectedEvent.type === 'rental' ? 'Aluguel' : 
                     selectedEvent.type === 'fitting' ? 'Prova' : 
                     selectedEvent.type === 'adjustment' ? 'Ajuste' : 
                     'Consultoria'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-neutral-500">Status</div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium inline-block
                    ${selectedEvent.status === 'agendado' ? 'bg-blue-100 text-blue-800' : 
                     selectedEvent.status === 'confirmado' ? 'bg-green-100 text-green-800' : 
                     selectedEvent.status === 'cancelado' ? 'bg-red-100 text-red-800' : 
                     'bg-neutral-100 text-neutral-800'}
                  ">
                    {selectedEvent.status === 'agendado' ? 'Agendado' : 
                     selectedEvent.status === 'confirmado' ? 'Confirmado' : 
                     selectedEvent.status === 'cancelado' ? 'Cancelado' : 
                     'Concluído'}
                  </div>
                </div>
              </div>
              
              <div className="space-y-1 pt-2">
                <div className="text-sm text-neutral-500">Observações</div>
                <div className="text-sm">
                  {selectedEvent.notes || "Nenhuma observação adicionada."}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between gap-4 pt-4 border-t border-neutral-200">
              <Button 
                variant="outline" 
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                onClick={() => {
                  setIsDeleteEventOpen(true);
                }}
              >
                Excluir
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setIsEventDetailsOpen(false)}
                >
                  Fechar
                </Button>
                <Button 
                  className="bg-marsala hover:bg-marsala-700 text-white"
                >
                  Editar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Event Confirmation */}
      <AlertDialog open={isDeleteEventOpen} onOpenChange={setIsDeleteEventOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Evento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Calendar;
