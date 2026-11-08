import React from "react";
import { Link } from "react-router-dom";
import { CalendarDays, CreditCard, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import LiveOperationsDashboard from "@/components/dashboard/LiveOperationsDashboard";

export default function Index() {
  return <main className="space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Closet Festa</h1>
        <p className="text-muted-foreground">Gestão baseada em clientes, contratos, agenda e pagamentos reais.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild><Link to="/calendar"><CalendarDays className="mr-2 h-4 w-4"/> Agenda</Link></Button>
        <Button variant="outline" asChild><Link to="/products"><PackageCheck className="mr-2 h-4 w-4"/> Produtos</Link></Button>
        <Button asChild className="bg-rose-900 text-white hover:bg-rose-800"><Link to="/pdv"><CreditCard className="mr-2 h-4 w-4"/> Abrir PDV</Link></Button>
      </div>
    </header>
    <LiveOperationsDashboard />
  </main>;
}
