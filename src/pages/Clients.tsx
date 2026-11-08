import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, RefreshCw, Search } from "lucide-react";
import ClientRegistrationForm from "@/components/clients/ClientRegistrationForm";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import PermissionManager from "@/lib/permissions";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Client = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  acquisition_source: string | null;
  created_at: string;
};

const PAGE_SIZE = 30;

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [originSaving, setOriginSaving] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const canUpdate = PermissionManager.hasPermission("clients", "update");

  useEffect(() => {
    const timeout = setTimeout(() => { setSearchTerm(search.trim()); setPage(0); }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  const loadClients = async () => {
    setLoading(true);
    setError("");
    const term = searchTerm.slice(0, 70).replace(/[%,()]/g, "");
    let query = supabase.from("clients")
      .select("id, full_name, email, phone, document, acquisition_source, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (term) {
      query = /[a-zA-ZÀ-ÿ]/.test(term) ? query.ilike("full_name", `%${term}%`) : query.ilike("document", `%${term}%`);
    }
    const { data, error: queryError, count } = await query;
    if (queryError) {
      setError("Não foi possível carregar os clientes. Confirme sua conexão e as permissões.");
      setClients([]);
    } else {
      setClients((data ?? []) as Client[]);
      setTotal(count ?? 0);
    }
    setLoading(false);
  };

  useEffect(() => { void loadClients(); }, [page, searchTerm]);

  const clientSaved=async()=>{
    toast({title:"Cliente salvo",description:"Cadastro completo registrado no Supabase."});
    setDialogOpen(false);setPage(0);
    await queryClient.invalidateQueries({queryKey:["closet-live-operations"]});
    await loadClients();
  };

  const updateOrigin = async (id: string, origin: string) => {
    if (!canUpdate || originSaving) return;
    setOriginSaving(id);
    try {
      const { data, error: updateError } = await supabase.from("clients")
        .update({ acquisition_source: origin || null })
        .eq("id", id).select("id").single();
      if (updateError || !data?.id) throw updateError || new Error("Alteração não confirmada");
      setClients(current => current.map(client => client.id===id
        ? { ...client, acquisition_source: origin || null } : client));
      await queryClient.invalidateQueries({ queryKey: ["closet-live-operations"] });
      toast({ title: "Origem atualizada", description: "Alteração salva no Supabase." });
    } catch {
      toast({ title: "Erro ao atualizar", description: "A origem não foi alterada no banco.", variant: "destructive" });
    } finally { setOriginSaving(null); }
  };

  return (
    <div className="page-transition w-full space-y-5">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div><h1 className="text-2xl md:text-3xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">Cadastros e detalhes reais do Supabase, com histórico de contratos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadClients()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Atualizar</Button>
          <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Novo cliente</Button>
        </div>
      </header>
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou documento" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="text-sm text-muted-foreground">{total} cadastro(s) encontrado(s)</div>
      {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Carregando clientes...</p> :
        error ? <div role="alert" className="rounded-lg border border-destructive p-4 text-destructive">{error}</div> :
        clients.length === 0 ? <div className="rounded-lg border p-8 text-center text-muted-foreground">Nenhum cliente encontrado.</div> :
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map(client => (
            <div key={client.id} className="rounded-lg border bg-card p-4 space-y-1">
              <p className="font-semibold">{client.full_name}</p>
              {client.phone && <p className="text-sm text-muted-foreground">{client.phone}</p>}
              {client.email && <p className="text-sm text-muted-foreground break-words">{client.email}</p>}
              {client.document && <p className="text-xs text-muted-foreground">Documento: {client.document}</p>}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground" htmlFor={`client-source-${client.id}`}>Origem do cliente</label>
                {canUpdate ? <select id={`client-source-${client.id}`} className="h-9 w-full rounded border bg-background px-2 text-xs"
                  value={client.acquisition_source || ""} disabled={originSaving === client.id}
                  onChange={e => void updateOrigin(client.id,e.target.value)}>
                  <option value="">Não informado</option>
                  {["Instagram","Indicação","Google","Shopping","WhatsApp","Outros"].map(o=>
                    <option key={o} value={o}>{o}</option>)}
                </select> : <p className="text-xs">{client.acquisition_source || "Não informado"}</p>}
              </div>
              <p className="text-xs text-muted-foreground">Cadastro: {new Date(client.created_at).toLocaleDateString("pt-BR")}</p>
              <Button variant="outline" size="sm" className="mt-2 w-full" asChild><Link to={"/clients/" + client.id}>Ver cadastro e histórico</Link></Button>
            </div>
          ))}
        </div>}
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">Página {page + 1} de {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPage(n => Math.max(0, n - 1))} disabled={loading || page === 0}>Anterior</Button>
          <Button variant="outline" onClick={() => setPage(n => n + 1)} disabled={loading || (page + 1) * PAGE_SIZE >= total}>Próxima</Button>
        </div>
      </div>
      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent side="right" className="flex w-[96vw] flex-col p-0 sm:max-w-[740px]">
          <SheetHeader className="shrink-0 border-b bg-marsala-50/30 px-6 py-5 text-left">
            <SheetTitle className="text-xl text-marsala-900">Novo cliente</SheetTitle>
            <p className="text-sm text-muted-foreground">Dados completos para contratos, atendimento e futuras provas.</p>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {dialogOpen&&<ClientRegistrationForm onSaved={clientSaved}
              onCancel={()=>setDialogOpen(false)}/>}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
export default ClientsPage;
