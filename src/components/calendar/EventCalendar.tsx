import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Package,
  AlertTriangle,
  CheckCircle,
  Eye
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addMonths, 
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalendarEvent {
  id: string;
  title: string;
  type: 'try_on' | 'pickup' | 'event' | 'return' | 'overdue';
  date: string;
  time?: string;
  customer_name: string;
  product_name: string;
  order_id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  color: string;
}

interface EventCalendarProps {
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onCreateEvent?: (date: Date) => void;
}

const EventCalendar: React.FC<EventCalendarProps> = ({
  events = [],
  onEventClick,
  onDateClick,
  onCreateEvent
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows = [];

  let days = [];
  let day = startDate;
  let formattedDate = "";

  // Build calendar rows
  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      
      // Get events for this day
      const dayEvents = events.filter(event => 
        isSameDay(parseISO(event.date), day)
      );

      days.push(
        <div
          key={day.toString()}
          className={`
            min-h-24 p-1 border-r border-b cursor-pointer hover:bg-gray-50 transition-colors
            ${!isSameMonth(day, monthStart) ? 'text-gray-400 bg-gray-50' : ''}
            ${isSameDay(day, selectedDate || new Date()) ? 'bg-blue-50' : ''}
            ${isToday(day) ? 'bg-yellow-50 border-yellow-200' : ''}
          `}
          onClick={() => {
            setSelectedDate(cloneDay);
            onDateClick?.(cloneDay);
          }}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-medium ${isToday(day) ? 'text-yellow-700' : ''}`}>
              {formattedDate}
            </span>
            {dayEvents.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {dayEvents.length}
              </Badge>
            )}
          </div>
          
          {/* Events for this day */}
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className={`
                  text-xs p-1 rounded text-white cursor-pointer hover:opacity-80 truncate
                  ${event.color}
                `}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick?.(event);
                }}
                title={`${event.title} - ${event.customer_name}`}
              >
                {event.time && (
                  <span className="font-medium">{event.time}</span>
                )} {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500 pl-1">
                +{dayEvents.length - 3} mais
              </div>
            )}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div key={day.toString()} className="grid grid-cols-7">
        {days}
      </div>
    );
    days = [];
  }

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'try_on':
        return <Eye className="h-3 w-3" />;
      case 'pickup':
        return <Package className="h-3 w-3" />;
      case 'event':
        return <CalendarIcon className="h-3 w-3" />;
      case 'return':
        return <CheckCircle className="h-3 w-3" />;
      case 'overdue':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels = {
      try_on: 'Prova',
      pickup: 'Retirada',
      event: 'Evento',
      return: 'Devolução',
      overdue: 'Em Atraso'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getEventsByDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(parseISO(event.date), date)
    );
  };

  const selectedDateEvents = selectedDate ? getEventsByDate(selectedDate) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Agenda de Eventos
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                >
                  Hoje
                </Button>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <h2 className="text-lg font-semibold px-4 min-w-48 text-center">
                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                  </h2>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextMonth}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {/* Calendar header */}
            <div className="grid grid-cols-7 border-b">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="p-2 text-center font-medium text-gray-600 border-r">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar body */}
            <div>{rows}</div>
          </CardContent>
        </Card>
      </div>

      {/* Side panel */}
      <div className="space-y-4">
        {/* Event Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Legenda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm">Provas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm">Retiradas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span className="text-sm">Eventos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-sm">Devoluções</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm">Em Atraso</span>
            </div>
          </CardContent>
        </Card>

        {/* Today's Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hoje</CardTitle>
            <p className="text-sm text-gray-600">
              {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </CardHeader>
          <CardContent>
            {getEventsByDate(new Date()).length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum evento hoje</p>
            ) : (
              <div className="space-y-2">
                {getEventsByDate(new Date()).map((event) => (
                  <div 
                    key={event.id}
                    className="p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => onEventClick?.(event)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {getEventTypeIcon(event.type)}
                      <span className="font-medium text-sm">
                        {getEventTypeLabel(event.type)}
                      </span>
                      {event.time && (
                        <Badge variant="outline" className="text-xs">
                          {event.time}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{event.customer_name}</p>
                    <p className="text-xs text-gray-500">{event.product_name}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Date Events */}
        {selectedDate && !isSameDay(selectedDate, new Date()) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-2">Nenhum evento</p>
                  {onCreateEvent && (
                    <Button
                      size="sm"
                      onClick={() => onCreateEvent(selectedDate)}
                    >
                      Criar Evento
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDateEvents.map((event) => (
                    <div 
                      key={event.id}
                      className="p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => onEventClick?.(event)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getEventTypeIcon(event.type)}
                        <span className="font-medium text-sm">
                          {getEventTypeLabel(event.type)}
                        </span>
                        {event.time && (
                          <Badge variant="outline" className="text-xs">
                            {event.time}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{event.customer_name}</p>
                      <p className="text-xs text-gray-500">{event.product_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estatísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Total de Eventos</span>
              <Badge variant="secondary">{events.length}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Hoje</span>
              <Badge variant="default">
                {getEventsByDate(new Date()).length}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Em Atraso</span>
              <Badge variant="destructive">
                {events.filter(e => e.type === 'overdue').length}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Próximos 7 dias</span>
              <Badge variant="outline">
                {events.filter(e => {
                  const eventDate = parseISO(e.date);
                  const nextWeek = addDays(new Date(), 7);
                  return eventDate <= nextWeek && eventDate >= new Date();
                }).length}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventCalendar; 