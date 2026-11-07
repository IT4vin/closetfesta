import React, { useEffect, useState } from "react";
import { Plus, RefreshCw, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  const [saving, setSaving] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", phone: "", email: "", document: "", origin: "" });

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

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newClient.name.trim().length < 2) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (newClient.document.trim()) {
        const { data: existing, error: checkError } = await supabase.from("clients")
          .select("id").eq("document", newClient.document.trim()).maybeSingle();
        if (checkError) throw checkError;
        if (existing) {
          toast({ title: "Cliente já cadastrado", description: "Já existe um cadastro para este documento.", variant: "destructive" });
          return;
        }
      }
      const { error: insertError } = await supabase.from("clients").insert({
        full_name: newClient.name.trim(),
        phone: newClient.phone.trim() || null,
        email: newClient.email.trim() || null,
        document: newClient.document.trim() || null,
        acquisition_source: newClient.origin.trim() || null,
      });
      if (insertError) throw insertError;
      toast({ title: "Cliente salvo", description: "Cadastro registrado no banco de dados." });
      setNewClient({ name: "", phone: "", email: "", document: "", origin: "" });
      setDialogOpen(false);
      setPage(0);
      void loadClients();
    } catch {
      toast({ title: "Erro ao salvar", description: "Os dados não foram registrados. Tente novamente.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-transition w-full space-y-5">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div><h1 className="text-2xl md:text-3xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">Cadastros reais do Supabase. Histórico de locações em implementação.</p>
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
              <p className="text-xs text-muted-foreground">Origem: {client.acquisition_source || "Não informado"}</p>
              <p className="text-xs text-muted-foreground">Cadastro: {new Date(client.created_at).toLocaleDateString("pt-BR")}</p>
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
      <Sheet open={dialogOpen} onOpenChange={open => !saving && setDialogOpen(open)}>
        <SheetContent side="right" className="w-[90vw] sm:max-w-[450px] overflow-y-auto">
          <SheetHeader><SheetTitle>Novo cliente</SheetTitle></SheetHeader>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div><Label htmlFor="client-name">Nome completo *</Label>
              <Input id="client-name" value={newClient.name} onChange={e => setNewClient(s => ({ ...s, name: e.target.value }))} required /></div>
            <div><Label htmlFor="client-phone">Telefone</Label>
              <Input id="client-phone" value={newClient.phone} onChange={e => setNewClient(s => ({ ...s, phone: e.target.value }))} /></div>
            <div><Label htmlFor="client-email">E-mail</Label>
              <Input id="client-email" type="email" value={newClient.email} onChange={e => setNewClient(s => ({ ...s, email: e.target.value }))} /></div>
            <div><Label htmlFor="client-doc">CPF/CNPJ</Label>
              <Input id="client-doc" value={newClient.document} onChange={e => setNewClient(s => ({ ...s, document: e.target.value }))} /></div>
            <div><Label htmlFor="client-origin">Como conheceu a loja?</Label>
              <select id="client-origin" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={newClient.origin}
                onChange={e => setNewClient(s => ({ ...s, origin: e.target.value }))}>
                <option value="">Não informado</option>
                <option value="Instagram">Instagram</option><option value="Indicação">Indicação</option>
                <option value="Google">Google</option><option value="Shopping">Shopping</option>
                <option value="WhatsApp">WhatsApp</option><option value="Outros">Outros</option>
              </select></div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar cliente
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
};
export default ClientsPage;
