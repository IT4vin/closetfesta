import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, FileText, Pencil, RefreshCw, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PermissionManager from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type ClientRow = {
  id: string; full_name: string; phone: string | null; email: string | null;
  document: string | null; birth_date: string | null; notes: string | null;
  address: unknown; acquisition_source: string | null; created_at: string;
};
type ContractRow = {
  id: string; contract_number: number; status: string; total: number;
  created_at: string;
};
type PaymentRow = {
  id: string; contract_id: string; amount: number; method: string;
  status: string; recorded_at: string;
};
type Form = {
  full_name: string; phone: string; email: string; document: string;
  birth_date: string; acquisition_source: string; notes: string;
  cep: string; street: string; number: string; complement: string;
  neighborhood: string; city: string; state: string;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const money = (amount: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
const date = (value: string) => new Date(value).toLocaleDateString("pt-BR");
const addressObject = (raw: unknown): Record<string, unknown> =>
  raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
const textField = (value: unknown) => typeof value === "string" ? value : "";
function toForm(client: ClientRow): Form {
  const a = addressObject(client.address);
  return {
    full_name: client.full_name, phone: client.phone || "", email: client.email || "",
    document: client.document || "", birth_date: client.birth_date || "",
    acquisition_source: client.acquisition_source || "", notes: client.notes || "",
    cep: textField(a.cep), street: textField(a.street), number: textField(a.number),
    complement: textField(a.complement), neighborhood: textField(a.neighborhood),
    city: textField(a.city), state: textField(a.state),
  };
}
const fields: { key: keyof Form; label: string; kind?: string }[] = [
  { key: "full_name", label: "Nome completo *" },
  { key: "phone", label: "Telefone" },
  { key: "email", label: "E-mail", kind: "email" },
  { key: "document", label: "CPF/CNPJ" },
  { key: "birth_date", label: "Data de nascimento", kind: "date" },
  { key: "acquisition_source", label: "Origem do cliente" },
  { key: "cep", label: "CEP" }, { key: "street", label: "Logradouro" },
  { key: "number", label: "Número" }, { key: "complement", label: "Complemento" },
  { key: "neighborhood", label: "Bairro" }, { key: "city", label: "Cidade" },
  { key: "state", label: "UF" },
];

export default function ClientDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [client, setClient] = useState<ClientRow | null>(null);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [paymentsError, setPaymentsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const canUpdate = PermissionManager.hasPermission("clients", "update");
  const canReadPayments = PermissionManager.hasPermission("payments", "read");

  useEffect(() => {
    let active = true;
    setLoading(true); setLoadError(""); setPaymentsError("");
    setClient(null); setContracts([]); setPayments([]);
    if (!id || !uuid.test(id)) {
      setLoadError("Identificador de cliente inválido."); setLoading(false);
      return () => { active = false; };
    }
    void (async () => {
      try {
        const db = supabase as any;
        const [clientResult, contractResult] = await Promise.all([
          db.from("clients").select("id,full_name,phone,email,document,birth_date,notes,address,acquisition_source,created_at")
            .eq("id", id).maybeSingle(),
          db.from("rental_contracts").select("id,contract_number,status,total,created_at")
            .eq("client_id", id).order("created_at", { ascending: false }).limit(100),
        ]);
        if (clientResult.error) throw new Error(clientResult.error.message);
        if (!clientResult.data) throw new Error("Cliente não encontrado ou sem acesso.");
        if (contractResult.error) throw new Error(contractResult.error.message);
        if (!active) return;
        setClient(clientResult.data as ClientRow);
        const related = (contractResult.data || []) as ContractRow[];
        setContracts(related);
        if (canReadPayments && related.length) {
          const pay = await db.from("rental_payments")
            .select("id,contract_id,amount,method,status,recorded_at")
            .in("contract_id", related.map((order) => order.id))
            .order("recorded_at", { ascending: false }).limit(200);
          if (!active) return;
          if (pay.error) setPaymentsError("Não foi possível consultar os recebimentos: " + pay.error.message);
          else setPayments((pay.data || []) as PaymentRow[]);
        }
      } catch (cause) {
        if (active) setLoadError(cause instanceof Error ? cause.message : "Erro ao consultar cadastro.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, refresh, canReadPayments]);

  const startEdit = () => {
    if (!client || !canUpdate) return;
    setForm(toForm(client)); setSaveError(""); setEdit(true);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!client || !form || !canUpdate || saving) return;
    if (form.full_name.trim().length < 2) {
      setSaveError("O nome deve ter pelo menos dois caracteres."); return;
    }
    setSaving(true); setSaveError("");
    try {
      const address = {
        ...addressObject(client.address),
        cep: form.cep.trim(), street: form.street.trim(), number: form.number.trim(),
        complement: form.complement.trim(), neighborhood: form.neighborhood.trim(),
        city: form.city.trim(), state: form.state.trim(),
      };
      const { data, error } = await supabase.from("clients").update({
        full_name: form.full_name.trim(), phone: form.phone.trim() || null,
        email: form.email.trim() || null, document: form.document.trim() || null,
        birth_date: form.birth_date || null, acquisition_source: form.acquisition_source.trim() || null,
        notes: form.notes.trim() || null, address,
      }).eq("id", client.id).select("id").single();
      if (error || !data) throw new Error(error?.message || "Gravação não confirmada pelo banco.");
      setEdit(false);
      setRefresh((current) => current + 1);
      toast({ title: "Cliente atualizado", description: "Cadastro confirmado no Supabase." });
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Não foi possível atualizar o cliente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="p-6 text-sm text-muted-foreground" role="status">Carregando cadastro real...</main>;
  if (loadError || !client) return <main className="space-y-4 p-6">
    <p role="alert" className="text-red-700">{loadError || "Cliente não encontrado."}</p>
    <Button variant="outline" asChild><Link to="/clients">Voltar aos clientes</Link></Button>
    <Button variant="outline" onClick={() => setRefresh((current) => current + 1)}>Tentar novamente</Button>
  </main>;

  const paid = payments.filter((payment) => payment.status !== "reversed")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const contracted = contracts.filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.total), 0);
  const a = addressObject(client.address);
  const location = [a.street, a.number, a.complement, a.neighborhood, a.city, a.state, a.cep]
    .map(textField).filter(Boolean).join(", ");

  return <main className="page-transition space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <Button variant="ghost" size="sm" asChild><Link to="/clients"><ArrowLeft className="mr-2 h-4 w-4" />Clientes</Link></Button>
        <h1 className="mt-2 text-3xl font-semibold">{client.full_name}</h1>
        <p className="text-sm text-muted-foreground">Cadastro desde {date(client.created_at)}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setRefresh((current) => current + 1)}>
          <RefreshCw className="mr-2 h-4 w-4" />Atualizar
        </Button>
        {canUpdate && <Button onClick={startEdit} className="bg-marsala hover:bg-marsala-700">
          <Pencil className="mr-2 h-4 w-4" />Editar cadastro
        </Button>}
        <Button variant="outline" asChild><Link to="/pdv">Nova locação no PDV</Link></Button>
      </div>
    </header>
    <div className="grid gap-4 md:grid-cols-3">
      <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Contratos registrados</p>
        <p className="mt-1 text-2xl font-semibold">{contracts.length}</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Valor contratado (até 100 recentes)</p>
        <p className="mt-1 text-2xl font-semibold">{money(contracted)}</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Recebimentos consultados</p>
        <p className="mt-1 text-2xl font-semibold">{canReadPayments && !paymentsError ? money(paid) : "Restrito"}</p>
      </CardContent></Card>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-base">Dados pessoais e contato</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p><strong>Documento:</strong> {client.document || "Não informado"}</p>
          <p><strong>Telefone:</strong> {client.phone || "Não informado"}</p>
          <p><strong>E-mail:</strong> {client.email || "Não informado"}</p>
          <p><strong>Nascimento:</strong> {client.birth_date ? client.birth_date.split("-").reverse().join("/") : "Não informado"}</p>
          <p><strong>Origem:</strong> {client.acquisition_source || "Não informada"}</p>
          <p><strong>Endereço:</strong> {location || "Não informado"}</p>
          <p className="whitespace-pre-wrap"><strong>Observações:</strong> {client.notes || "Nenhuma"}</p>
        </CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4" />Histórico de locações</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {contracts.length === 0 && <p className="text-sm text-muted-foreground">Nenhum contrato registrado para este cliente.</p>}
          {contracts.map((order) => <Link key={order.id} to={"/pdv/pedidos/" + order.id}
            className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm hover:border-marsala-300">
            <span><FileText className="mr-2 inline h-4 w-4" />Contrato nº {order.contract_number}
              <small className="ml-2 text-muted-foreground">{date(order.created_at)}</small></span>
            <span className="text-right"><strong>{money(Number(order.total))}</strong>
              <small className="block text-muted-foreground">{order.status}</small></span>
          </Link>)}
        </CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Wallet className="h-4 w-4" />Histórico de pagamentos</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {!canReadPayments && <p className="text-sm text-muted-foreground">Seu perfil não permite consultar recebimentos.</p>}
        {paymentsError && <p role="alert" className="text-sm text-red-700">{paymentsError}</p>}
        {canReadPayments && !paymentsError && payments.length === 0 && <p className="text-sm text-muted-foreground">Nenhum recebimento registrado.</p>}
        {payments.map((payment) => <div className="flex flex-wrap justify-between gap-2 rounded-md border p-3 text-sm" key={payment.id}>
          <span>{date(payment.recorded_at)} · {payment.method} · {payment.status}</span>
          <strong>{money(Number(payment.amount))}</strong>
        </div>)}
      </CardContent></Card>
    <p className="text-xs text-muted-foreground">São exibidos até 100 contratos recentes e 200 recebimentos. Recebimentos manuais não equivalem a conciliação bancária.</p>
    <Sheet open={edit} onOpenChange={(open) => { if (!saving) setEdit(open); }}>
      <SheetContent side="right" className="w-[95vw] overflow-y-auto sm:max-w-xl">
        <SheetHeader><SheetTitle>Editar cliente</SheetTitle></SheetHeader>
        {form && <form onSubmit={(event) => void save(event)} className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map(({key,label,kind}) => <div key={key} className="space-y-1">
              <Label htmlFor={"edit-client-" + key}>{label}</Label>
              <Input id={"edit-client-" + key} type={kind || "text"} value={form[key]}
                disabled={saving} required={key === "full_name"}
                onChange={(event) => setForm((old) => old && ({...old, [key]: event.target.value}))} />
            </div>)}
          </div>
          <div className="space-y-1"><Label htmlFor="edit-client-notes">Observações</Label>
            <Textarea id="edit-client-notes" rows={4} value={form.notes} disabled={saving}
              onChange={(event) => setForm((old) => old && ({...old, notes: event.target.value}))} />
          </div>
          {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={saving} onClick={() => setEdit(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-marsala hover:bg-marsala-700">
              {saving ? "Salvando..." : "Salvar no Supabase"}
            </Button>
          </div>
        </form>}
      </SheetContent>
    </Sheet>
  </main>;
}
