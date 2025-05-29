import React, { useState } from "react";
import { 
  Bell, 
  BellRing, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  X,
  Eye,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAlerts } from "@/hooks/useAlerts";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const NotificationCenter = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    alerts,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    getUrgentAlerts,
    getOverdueAlerts,
    getPickupReminders,
    getReturnReminders,
    refetch
  } = useAlerts({ 
    autoRefresh: true, 
    refreshInterval: 60000 // Refresh every minute
  });

  const urgentAlerts = getUrgentAlerts();
  const overdueAlerts = getOverdueAlerts();
  const pickupReminders = getPickupReminders();
  const returnReminders = getReturnReminders();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'pickup_reminder':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'return_reminder':
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'overdue':
        return 'border-l-red-500 bg-red-50 dark:bg-red-950/20';
      case 'pickup_reminder':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20';
      case 'return_reminder':
        return 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getAlertPriority = (type: string, date: string) => {
    const alertDate = new Date(date);
    const now = new Date();
    const diffHours = (alertDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (type === 'overdue') return 'high';
    if (diffHours <= 24) return 'high';
    if (diffHours <= 72) return 'medium';
    return 'low';
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível marcar a notificação como lida.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast({
        title: "Sucesso",
        description: "Todas as notificações foram marcadas como lidas.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível marcar todas as notificações como lidas.",
        variant: "destructive",
      });
    }
  };

  // Group alerts by priority
  const groupedAlerts = {
    high: alerts.filter(alert => getAlertPriority(alert.alert_type, alert.scheduled_date) === 'high'),
    medium: alerts.filter(alert => getAlertPriority(alert.alert_type, alert.scheduled_date) === 'medium'),
    low: alerts.filter(alert => getAlertPriority(alert.alert_type, alert.scheduled_date) === 'low'),
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notificações</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={loading}
                >
                  <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Quick stats */}
            {alerts.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="text-center p-2 bg-red-50 dark:bg-red-950/20 rounded">
                  <p className="text-xs text-red-600 dark:text-red-400">Em Atraso</p>
                  <p className="font-bold text-red-700 dark:text-red-300">{overdueAlerts.length}</p>
                </div>
                <div className="text-center p-2 bg-amber-50 dark:bg-amber-950/20 rounded">
                  <p className="text-xs text-amber-600 dark:text-amber-400">Urgentes</p>
                  <p className="font-bold text-amber-700 dark:text-amber-300">{urgentAlerts.length}</p>
                </div>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="p-0">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Nenhuma notificação</p>
                <p className="text-xs text-gray-500">Você está em dia!</p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-1 p-4">
                  {/* High priority alerts */}
                  {groupedAlerts.high.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-red-600">Urgente</span>
                      </div>
                      {groupedAlerts.high.map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-3 rounded-lg border-l-4 ${getAlertColor(alert.alert_type)} ${
                            !alert.is_read ? 'border-l-4' : 'border-l-2 opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              {getAlertIcon(alert.alert_type)}
                              <div className="flex-1">
                                <p className="text-sm font-medium">{alert.message}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDistanceToNow(new Date(alert.scheduled_date), { 
                                    addSuffix: true, 
                                    locale: ptBR 
                                  })}
                                </p>
                              </div>
                            </div>
                            {!alert.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(alert.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {(groupedAlerts.medium.length > 0 || groupedAlerts.low.length > 0) && (
                        <Separator className="my-3" />
                      )}
                    </>
                  )}

                  {/* Medium priority alerts */}
                  {groupedAlerts.medium.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium text-amber-600">Importante</span>
                      </div>
                      {groupedAlerts.medium.map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-3 rounded-lg border-l-4 ${getAlertColor(alert.alert_type)} ${
                            !alert.is_read ? 'border-l-4' : 'border-l-2 opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              {getAlertIcon(alert.alert_type)}
                              <div className="flex-1">
                                <p className="text-sm font-medium">{alert.message}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDistanceToNow(new Date(alert.scheduled_date), { 
                                    addSuffix: true, 
                                    locale: ptBR 
                                  })}
                                </p>
                              </div>
                            </div>
                            {!alert.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(alert.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {groupedAlerts.low.length > 0 && <Separator className="my-3" />}
                    </>
                  )}

                  {/* Low priority alerts */}
                  {groupedAlerts.low.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Bell className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-600">Informativo</span>
                      </div>
                      {groupedAlerts.low.map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-3 rounded-lg border-l-4 ${getAlertColor(alert.alert_type)} ${
                            !alert.is_read ? 'border-l-4' : 'border-l-2 opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              {getAlertIcon(alert.alert_type)}
                              <div className="flex-1">
                                <p className="text-sm font-medium">{alert.message}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDistanceToNow(new Date(alert.scheduled_date), { 
                                    addSuffix: true, 
                                    locale: ptBR 
                                  })}
                                </p>
                              </div>
                            </div>
                            {!alert.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(alert.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter; 