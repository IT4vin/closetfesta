import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, RotateCcw, Save } from "lucide-react";
import UserAccessSettings from "@/components/settings/UserAccessSettings";
import { loadClosetSettings, saveClosetSettings, type ClosetSettingsSection, type ClosetSettingValues } from "@/lib/closetSettings";

type FieldType = "text" | "email" | "number" | "time" | "url" | "textarea" | "boolean";
type Field = {
  key: string; title: string; type?: FieldType; hint?: string;
  min?: number; max?: number; placeholder?: string; required?: boolean;
};
type Group = { title: string; description?: string; advanced?: boolean; fields: Field[] };
type Definition = { title: string; notice?: string; groups: Group[] };
const definitions: Record<Exclude<ClosetSettingsSection, "permissions">, Definition> = {
  company: {
    title: "Dados e funcionamento da loja",
    notice: "As informações cadastradas ficam salvas no Supabase. A impressão e outros módulos utilizarão estes dados após a integração específica de cada fluxo.",
    groups: [
      { title: "Identificação", fields: [
        {key:"trading_name",title:"Nome fantasia",required:true,placeholder:"Closet Festa"},
        {key:"legal_name",title:"Razão social"},
        {key:"cnpj",title:"CNPJ",hint:"Informe apenas o CNPJ real da empresa"},
        {key:"municipal_registration",title:"Inscrição municipal"},
        {key:"logo_url",title:"Endereço da imagem do logotipo",type:"url"},
      ]},
      { title: "Endereço", fields: [
        {key:"street",title:"Logradouro"}, {key:"number",title:"Número"},
        {key:"complement",title:"Complemento / localização na loja"},
        {key:"neighborhood",title:"Bairro"}, {key:"city",title:"Cidade"},
        {key:"state",title:"UF",placeholder:"RJ"}, {key:"zip",title:"CEP"}
      ]},
      { title: "Contato", fields: [
        {key:"phone",title:"Telefone"}, {key:"whatsapp",title:"WhatsApp"},
        {key:"email",title:"E-mail",type:"email"},
        {key:"instagram",title:"Instagram"}, {key:"website",title:"Site",type:"url"},
      ]},
      { title: "Horários de atendimento", fields: [
        {key:"store_open",title:"Abertura da loja",type:"time"},
        {key:"store_close",title:"Fechamento da loja",type:"time"},
        {key:"sewing_open",title:"Início da costura",type:"time"},
        {key:"sewing_close",title:"Fim da costura",type:"time"},
        {key:"fitting_open",title:"Início das provas",type:"time"},
        {key:"fitting_close",title:"Fim das provas",type:"time"},
        {key:"pickup_close",title:"Limite para retiradas",type:"time"},
        {key:"return_close",title:"Limite para devoluções",type:"time"},
      ]},
    ],
  },
  operations: {
    title: "Regras operacionais",
    notice: "A duração, os bloqueios de data, a antecedência e o limite de atendimentos são utilizados na tela de agendamentos. Outras regras exigem validações adicionais nos fluxos de locação.",
    groups: [
      { title: "Agenda", fields: [
        {key:"fitting_minutes",title:"Duração da prova (minutos)",type:"number",min:5,max:480},
        {key:"pickup_minutes",title:"Duração da retirada (minutos)",type:"number",min:5,max:480},
        {key:"return_minutes",title:"Duração da devolução (minutos)",type:"number",min:5,max:480},
        {key:"interval_minutes",title:"Intervalo entre atendimentos (minutos)",type:"number",min:0,max:240},
        {key:"min_notice_hours",title:"Antecedência mínima (horas)",type:"number",min:0,max:8760},
        {key:"max_per_slot",title:"Atendimentos simultâneos por horário",type:"number",min:1,max:100},
        {key:"blocked_dates",title:"Datas bloqueadas",hint:"Datas separadas por vírgula no formato AAAA-MM-DD. Ex.: 2026-12-25, 2027-01-01",type:"textarea"},
      ]},
      { title: "Pedidos e locação", advanced:true, fields: [
        {key:"allow_same_day_fitting_pickup",title:"Permitir prova e retirada no mesmo dia",type:"boolean"},
        {key:"min_deposit_percent",title:"Sinal mínimo (% do pedido)",type:"number",min:0,max:100},
        {key:"quote_expiration_days",title:"Validade da proposta (dias)",type:"number",min:1,max:365},
        {key:"late_daily_fee",title:"Cobrança por atraso (R$ por dia)",type:"number",min:0,max:100000},
        {key:"laundry_buffer_days",title:"Intervalo de lavanderia (dias)",type:"number",min:0,max:365}
      ]},
    ],
  },
  payments: {
    title: "Recebimentos e parcelamento",
    notice: "Métodos habilitados, limite de parcelas e faixas de valor são aplicados no fechamento do PDV. Taxas de adquirência são apenas controle interno e não são repassadas automaticamente ao cliente. A validação de permissões permanece no banco.",
    groups: [
      { title: "Meios de recebimento", fields: [
        {key:"pix_enabled",title:"Permitir Pix",type:"boolean"},
        {key:"cash_enabled",title:"Permitir dinheiro",type:"boolean"},
        {key:"debit_enabled",title:"Permitir débito",type:"boolean"},
        {key:"credit_enabled",title:"Permitir crédito",type:"boolean"},
        {key:"max_installments",title:"Máximo de parcelas",type:"number",min:1,max:24},
        {key:"tier_1_max",title:"Faixa 1: valor máximo (R$)",type:"number",min:0,max:1000000},
        {key:"tier_1_installments",title:"Faixa 1: parcelas permitidas",type:"number",min:1,max:24},
        {key:"tier_2_max",title:"Faixa 2: valor máximo (R$)",type:"number",min:0,max:1000000},
        {key:"tier_2_installments",title:"Faixa 2: parcelas permitidas",type:"number",min:1,max:24},
        {key:"tier_3_max",title:"Faixa 3: valor máximo (R$)",type:"number",min:0,max:1000000},
        {key:"tier_3_installments",title:"Faixa 3: parcelas permitidas",type:"number",min:1,max:24},
        {key:"tier_4_max",title:"Faixa 4: valor máximo (R$)",type:"number",min:0,max:1000000},
        {key:"tier_4_installments",title:"Faixa 4: parcelas permitidas",type:"number",min:1,max:24},
        {key:"tier_5_installments",title:"Acima da faixa 4: parcelas permitidas",type:"number",min:1,max:24},
        {key:"minimum_installment",title:"Valor mínimo da parcela (R$)",type:"number",min:0,max:100000},
      ]},
      { title: "Taxas da adquirente (somente controle interno)", advanced:true, fields: [
        {key:"visa_master_credit_fee_1",title:"Visa/Mastercard crédito 1x (%)",type:"number",min:0,max:100},
        {key:"visa_master_credit_fee_2",title:"Visa/Mastercard crédito 2x (%)",type:"number",min:0,max:100},
        {key:"visa_master_credit_fee_3",title:"Visa/Mastercard crédito 3x (%)",type:"number",min:0,max:100},
        {key:"visa_master_credit_fee_5",title:"Visa/Mastercard crédito 5x (%)",type:"number",min:0,max:100},
        {key:"visa_master_credit_fee_6",title:"Visa/Mastercard crédito 6x (%)",type:"number",min:0,max:100},
        {key:"visa_master_credit_fee_10",title:"Visa/Mastercard crédito 10x (%)",type:"number",min:0,max:100},
        {key:"elo_debit_fee",title:"Elo débito (%)",type:"number",min:0,max:100},
        {key:"visa_master_debit_fee",title:"Visa/Mastercard débito (%)",type:"number",min:0,max:100},
      ]},
      { title: "Regras avançadas", advanced:true, fields: [
        {key:"pix_key_hint",title:"Identificação da chave Pix",hint:"Não informe senhas, tokens ou credenciais"},
        {key:"receiving_days",title:"Prazo de recebimento (dias úteis)",type:"number",min:0,max:365},
        {key:"early_payment_discount",title:"Desconto máximo para pagamento antecipado (%)",type:"number",min:0,max:100},
      ]},
    ],
  },
  documents: {
    title: "Modelos de documentos",
    notice: "Este cadastro guarda textos de referência; a geração e o versionamento definitivo de contratos ainda precisam ser conectados ao emissor. Documentos já emitidos não são alterados.",
    groups: [
      { title: "Textos configuráveis", fields: [
        {key:"contract_title",title:"Título do contrato"},
        {key:"contract_footer",title:"Rodapé para novos documentos",type:"textarea"},
        {key:"pickup_guidance",title:"Orientações de retirada",type:"textarea"},
        {key:"return_guidance",title:"Orientações de devolução",type:"textarea"},
      ]},
    ],
  },
  messages: {
    title: "Avisos e mensagens",
    notice: "Modelos para uso manual. Salvar um texto NÃO ativa disparos automáticos nem envia mensagens. WhatsApp e e-mail requerem provedores conectados.",
    groups: [
      { title: "Modelos de atendimento", fields: [
        {key:"fitting_confirmation",title:"Confirmação de prova",type:"textarea",hint:"Variáveis sugeridas: {{cliente_nome}}, {{data_prova}}"},
        {key:"pickup_confirmation",title:"Confirmação de retirada",type:"textarea"},
        {key:"return_reminder",title:"Lembrete de devolução",type:"textarea"},
        {key:"late_return",title:"Devolução em atraso",type:"textarea"},
        {key:"pending_payment",title:"Pagamento pendente",type:"textarea"},
        {key:"location_notice",title:"Mudança de endereço",type:"textarea"},
      ]},
    ],
  },
  goals: {
    title: "Metas comerciais",
    notice: "As metas ficam registradas no banco. A apuração automática de contratos, recebimentos, cancelamentos e comissões será integrada aos relatórios posteriormente.",
    groups: [
      { title: "Metas mensais", fields: [
        {key:"monthly_contracts_amount",title:"Valor total contratado (R$)",type:"number",min:0},
        {key:"monthly_received_amount",title:"Valor recebido no mês (R$)",type:"number",min:0},
        {key:"monthly_contract_count",title:"Quantidade de contratos",type:"number",min:0},
        {key:"average_ticket",title:"Ticket médio desejado (R$)",type:"number",min:0},
      ]},
    ],
  },
  tax: {
    title: "Parâmetros fiscais",
    notice: "Apenas cadastro administrativo. Nenhuma nota é emitida e nenhum imposto é calculado automaticamente; valide o enquadramento com a contabilidade e configure uma integração emissora antes de emitir documentos.",
    groups: [
      { title: "Cadastro fiscal", fields: [
        {key:"municipal_registration",title:"Inscrição municipal"},
        {key:"service_code",title:"Código de serviço validado pela contabilidade"},
        {key:"tax_notes",title:"Observações fiscais",type:"textarea"},
      ]},
      { title: "Emissor — integração ainda não disponível", advanced:true, fields: [
        {key:"issuer_name",title:"Nome do provedor emissor (referência)"},
        {key:"environment",title:"Ambiente previsto (homologação / produção)"},
      ]},
    ],
  },
};

function validate(section: ClosetSettingsSection, values: ClosetSettingValues): string | null {
  if (section === "permissions") return null;
  for (const group of definitions[section].groups) {
    for (const field of group.fields) {
      const value = values[field.key];
      if (field.required && !String(value ?? "").trim()) return "Preencha: " + field.title + ".";
      if (value === undefined || value === "") continue;
      if (field.type === "number" && (typeof value !== "number" || !Number.isFinite(value) ||
        (field.min !== undefined && value < field.min) ||
        (field.max !== undefined && value > field.max))) return "Verifique o valor de " + field.title + ".";
      if (field.type === "email" && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(String(value))) return "E-mail inválido.";
      if (field.type === "url" && value && !/^https:\/\//.test(String(value))) return field.title + " deve começar com https://";
    }
  }
  if (section === "payments") {
    const brackets = [1,2,3,4].map(n => Number(values["tier_"+n+"_max"]));
    if (brackets.some((v,i) => Number.isFinite(v) && i>0 &&
      values["tier_"+(i+1)+"_max"]!==undefined && values["tier_"+i+"_max"]!==undefined && v<=brackets[i-1]))
      return "As faixas de parcelamento devem estar em ordem crescente.";
  }
  if (section === "operations" && values.blocked_dates) {
    const dates = String(values.blocked_dates).split(",").map(x => x.trim());
    if (dates.some(date => !/^\\d{4}-\\d{2}-\\d{2}$/.test(date) ||
      Number.isNaN(new Date(date + "T12:00:00").getTime()))) return "Confira as datas bloqueadas (AAAA-MM-DD, separadas por vírgula).";
  }
  return null;
}


export default function ClosetSettingsEditor({
  section, onDirtyChange,
}: { section: ClosetSettingsSection; onDirtyChange?: (dirty: boolean) => void }) {
  const [draft, setDraft] = useState<ClosetSettingValues>({});
  const [original, setOriginal] = useState<ClosetSettingValues>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(original), [draft, original]);

  useEffect(() => { onDirtyChange?.(isDirty); }, [isDirty, onDirtyChange]);
  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  useEffect(() => {
    if (section === "permissions") return;
    let cancelled = false;
    setLoading(true); setError(""); setMessage("");
    void loadClosetSettings(section).then(values => {
      if (!cancelled) { setDraft(values); setOriginal(values); setLoading(false); }
    }).catch(err => {
      if (!cancelled) { setError(err instanceof Error ? err.message : "Erro no carregamento"); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [section, reload]);

  if (section === "permissions") return <UserAccessSettings />;
  const definition = definitions[section];

  const update = (field: Field, next: string | boolean) => {
    const value = field.type === "number" ? (next === "" ? "" : Number(next)) : next;
    setDraft(previous => ({ ...previous, [field.key]: value }));
    setMessage(""); setError("");
  };
  const save = async () => {
    const validationError = validate(section, draft);
    if (validationError) { setError(validationError); return; }
    setSaving(true); setError(""); setMessage("");
    try {
      const data = await saveClosetSettings(section, draft);
      setDraft(data); setOriginal(data);
      setMessage("Configurações gravadas e confirmadas pelo Supabase.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally { setSaving(false); }
  };

  return <div className="space-y-5">
    <div><h3 className="text-lg font-semibold">{definition.title}</h3>
      {definition.notice && <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <AlertTriangle className="mr-2 inline h-4 w-4"/>{definition.notice}
      </p>}
    </div>
    {loading && <p role="status" className="text-sm text-muted-foreground">Carregando configurações do banco...</p>}
    {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</p>}
    {!loading && definition.groups.map(group => {
      const form = <Card key={group.title} className="border-marsala-100">
        <CardHeader><CardTitle className="text-base">{group.title}</CardTitle>
          {group.description && <CardDescription>{group.description}</CardDescription>}
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          {group.fields.map(field => <div key={field.key} className={field.type === "textarea" ? "space-y-2 sm:col-span-2" : "space-y-2"}>
            {field.type === "boolean" ?
              <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <Label htmlFor={field.key}>{field.title}</Label>
                <Switch id={field.key} checked={draft[field.key] === true}
                  onCheckedChange={checked => update(field, checked)} />
              </div> :
              <><Label htmlFor={field.key}>{field.title}{field.required ? " *" : ""}</Label>
                {field.type === "textarea" ?
                  <Textarea id={field.key} rows={3} value={String(draft[field.key] ?? "")}
                    onChange={e => update(field, e.target.value)} placeholder={field.placeholder} /> :
                  <Input id={field.key} type={field.type ?? "text"} min={field.min} max={field.max}
                    step={field.type === "number" ? "any" : undefined}
                    value={draft[field.key] === undefined ? "" : String(draft[field.key])}
                    onChange={e => update(field, e.target.value)} placeholder={field.placeholder} />}
              </>}
            {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
          </div>)}
        </CardContent>
      </Card>;
      return group.advanced ? <details key={group.title} className="rounded-md border p-3">
        <summary className="cursor-pointer font-medium text-marsala-700">Configurações avançadas — {group.title}</summary>
        <div className="pt-3">{form}</div>
      </details> : form;
    })}
    {!loading && <div className="flex flex-wrap items-center justify-end gap-2">
      <Button variant="outline" disabled={saving} onClick={() => {
        if (isDirty && !window.confirm("Descartar alterações não salvas?")) return;
        setDraft(original); setError(""); setMessage("");
      }}>Descartar alterações</Button>
      <Button variant="outline" disabled={saving || isDirty} onClick={() => setReload(v => v + 1)}>
        <RotateCcw className="mr-2 h-4 w-4"/> Recarregar
      </Button>
      <Button className="bg-marsala-600 hover:bg-marsala-700" disabled={saving || !isDirty} onClick={() => void save()}>
        <Save className="mr-2 h-4 w-4"/>{saving ? "Salvando..." : "Salvar alterações"}
      </Button>
    </div>}
  </div>;
}
