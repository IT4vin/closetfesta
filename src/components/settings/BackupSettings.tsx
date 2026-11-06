import React from "react";
import SystemManagement from "@/components/pdv/SystemManagement";

// Backup de PostgreSQL e Storage somente pelos provedores oficiais.
// Os antigos botões de backup local simulavam sucesso sem proteger dados.
export default function BackupSettings() {
  return <SystemManagement />;
}
