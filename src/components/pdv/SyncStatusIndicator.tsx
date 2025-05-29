import React from "react";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Wifi, 
  WifiOff 
} from "lucide-react";
import { useOrders } from "@/hooks/useOrders";

const SyncStatusIndicator = () => {
  const { syncStatus } = useOrders();

  if (syncStatus.sync_in_progress) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="h-3 w-3 animate-spin" />
        Sincronizando...
      </Badge>
    );
  }

  if (syncStatus.last_error) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <WifiOff className="h-3 w-3" />
        Offline
      </Badge>
    );
  }

  if (syncStatus.pending_orders > 0) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3 text-orange-500" />
        {syncStatus.pending_orders} pendente{syncStatus.pending_orders > 1 ? 's' : ''}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="flex items-center gap-1 text-green-600">
      <Wifi className="h-3 w-3" />
      Online
    </Badge>
  );
};

export default SyncStatusIndicator; 