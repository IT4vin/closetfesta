import React from "react";
import SystemManagement from "@/components/pdv/SystemManagement";

// Não mostrar CPU, uptime, número de usuários ou reinicializações simuladas.
export default function SystemSettings() {
  return <SystemManagement />;
}
