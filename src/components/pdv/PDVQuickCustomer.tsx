import React, { useEffect, useState } from "react";
import { Search, UserPlus, ArrowLeft } from "lucide-react";
import ClientRegistrationForm from "@/components/clients/ClientRegistrationForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Customer = { id: string; name: string; document: string; phone?: string };

interface PDVQuickCustomerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: { id?: string; name: string; document: string; phone?: string }) => void;
}

const PDVQuickCustomer: React.FC<PDVQuickCustomerProps> = ({ isOpen, onClose, onSelectCustomer }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setSearchTerm("");
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


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={"flex max-h-[92vh] flex-col overflow-hidden p-0 "+
        (showQuickForm?"w-[96vw] max-w-[900px]":"w-[94vw] max-w-[560px]")}>
        <DialogHeader className="shrink-0 border-b px-6 py-5 text-left">
          <DialogTitle className="text-marsala-900">
            {showQuickForm ? "Cadastrar novo cliente" : "Selecionar cliente"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {showQuickForm?"Dados completos para a locação e futuros atendimentos."
              :"Pesquise o cadastro existente ou registre um novo cliente."}
          </p>
        </DialogHeader>
        {showQuickForm ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            <Button type="button" variant="ghost" size="sm" className="mb-3 text-marsala-800"
              onClick={()=>setShowQuickForm(false)}>
              <ArrowLeft className="mr-2 h-4 w-4"/>Voltar à busca
            </Button>
            <ClientRegistrationForm
              onCancel={()=>setShowQuickForm(false)}
              onSaved={client=>{
                onSelectCustomer(client);
                toast({title:"Cliente cadastrado",description:"Informações completas salvas no Supabase."});
                onClose();
              }}
            />
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
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
              <Button className="bg-marsala hover:bg-marsala-700" onClick={() => setShowQuickForm(true)}><UserPlus className="mr-2 h-4 w-4" />Cadastrar cliente completo</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
export default PDVQuickCustomer;
