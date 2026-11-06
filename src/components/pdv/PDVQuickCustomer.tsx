import React, { useEffect, useState } from "react";
import { Search, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Customer = { id: string; name: string; document: string; phone?: string };

interface PDVQuickCustomerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: { name: string; document: string; phone?: string }) => void;
}

const PDVQuickCustomer: React.FC<PDVQuickCustomerProps> = ({ isOpen, onClose, onSelectCustomer }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [quickName, setQuickName] = useState("");
  const [quickDocument, setQuickDocument] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setSearchTerm("");
    setQuickName("");
    setQuickDocument("");
    setQuickPhone("");
    setShowQuickForm(false);
    setError("");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || showQuickForm) return;
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      const term = searchTerm.trim().slice(0, 70).replace(/[%,()]/g, "");
      let query = supabase.from("clients").select("id, full_name, document, phone")
        .order("full_name").limit(30);
      if (term) {
        query = /[a-zA-ZÀ-ÿ]/.test(term)
          ? query.ilike("full_name", `%${term}%`)
          : query.ilike("document", `%${term}%`);
      }
      const { data, error: loadError } = await query;
      if (!active) return;
      if (loadError) {
        setError("Não foi possível consultar clientes. Verifique sua conexão e as permissões.");
        setCustomers([]);
      } else {
        setCustomers((data ?? []).map(row => ({
          id: row.id, name: row.full_name, document: row.document ?? "", phone: row.phone ?? undefined,
        })));
      }
      setLoading(false);
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [isOpen, showQuickForm, searchTerm]);

  const handleQuickCreate = async () => {
    const name = quickName.trim();
    const document = quickDocument.trim();
    if (name.length < 2) {
      toast({ title: "Nome obrigatório", description: "Informe o nome completo do cliente.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (document) {
        const { data: found, error: lookupError } = await supabase.from("clients")
          .select("id, full_name, document, phone").eq("document", document).maybeSingle();
        if (lookupError) throw lookupError;
        if (found) {
          onSelectCustomer({ name: found.full_name, document: found.document ?? "", phone: found.phone ?? undefined });
          toast({ title: "Cliente existente selecionado" });
          onClose();
          return;
        }
      }
      const { data, error: saveError } = await supabase.from("clients").insert({
        full_name: name, document: document || null, phone: quickPhone.trim() || null,
      }).select("id, full_name, document, phone").single();
      if (saveError || !data) throw saveError ?? new Error("Cliente não retornado");
      onSelectCustomer({ name: data.full_name, document: data.document ?? "", phone: data.phone ?? undefined });
      toast({ title: "Cliente cadastrado", description: "Dados salvos no banco da loja." });
      onClose();
    } catch {
      toast({ title: "Não foi possível salvar", description: "O cadastro não foi concluído. Confira os dados e a conexão.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{showQuickForm ? "Cadastro rápido de cliente" : "Selecionar cliente"}</DialogTitle></DialogHeader>
        {showQuickForm ? (
          <div className="space-y-3">
            <div><Label htmlFor="quickName">Nome completo *</Label><Input id="quickName" value={quickName} onChange={e => setQuickName(e.target.value)} disabled={saving} /></div>
            <div><Label htmlFor="quickDocument">CPF/CNPJ (opcional)</Label><Input id="quickDocument" value={quickDocument} onChange={e => setQuickDocument(e.target.value)} disabled={saving} /></div>
            <div><Label htmlFor="quickPhone">Telefone (opcional)</Label><Input id="quickPhone" value={quickPhone} onChange={e => setQuickPhone(e.target.value)} disabled={saving} /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowQuickForm(false)} disabled={saving}>Voltar</Button>
              <Button onClick={handleQuickCreate} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar cliente
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Pesquisar nome ou documento" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-1" aria-live="polite">
              {loading ? <p className="p-4 text-sm text-muted-foreground">Consultando clientes...</p>
                : error ? <p className="p-4 text-sm text-destructive">{error}</p>
                : customers.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
                : customers.map(customer => (
                  <button key={customer.id} type="button" className="w-full rounded-lg border p-3 text-left hover:bg-muted"
                    onClick={() => { onSelectCustomer(customer); onClose(); }}>
                    <span className="block font-medium">{customer.name}</span>
                    <span className="block text-sm text-muted-foreground">{customer.phone || customer.document || "Sem telefone cadastrado"}</span>
                  </button>
                ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={() => setShowQuickForm(true)}><UserPlus className="mr-2 h-4 w-4" />Novo cliente</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
export default PDVQuickCustomer;
