import React from "react";
import { Badge } from "@/components/ui/badge";
import { useLiveClosetData } from "@/hooks/useLiveClosetData";

export default function SyncStatusIndicator() {
  const query=useLiveClosetData();
  if(query.isPending)return <Badge variant="outline">Consultando Supabase...</Badge>;
  if(query.error)return <Badge variant="destructive">Falha ao consultar dados</Badge>;
  return <Badge variant="outline" className="text-emerald-700">Dados consultados no Supabase</Badge>;
}
