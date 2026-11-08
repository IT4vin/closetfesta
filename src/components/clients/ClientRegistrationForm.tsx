import React, {useState} from "react";
import { UserRound, Phone, MapPin, Ruler, StickyNote, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { blankClientRegistration,createRegisteredClient,validateClientRegistration,
  type ClientRegistration } from "@/lib/clientRegistration";

const sources=["Instagram","Indicação","Google","Shopping","WhatsApp","Facebook","Site","Passou na loja","Outros"];
const sections=[
  {title:"Dados pessoais",description:"Identificação e data de nascimento",Icon:UserRound},
  {title:"Contato e origem",description:"Como podemos falar com o cliente",Icon:Phone},
  {title:"Endereço",description:"Endereço completo para cadastro e contratos",Icon:MapPin},
  {title:"Medidas do cliente",description:"Opcionais, em centímetros, para facilitar futuras provas",Icon:Ruler},
  {title:"Observações",description:"Informações úteis para o atendimento",Icon:StickyNote},
] as const;
const formFieldClass="space-y-1.5";
const selectClass="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marsala/40";

const ClientFormSection=({index,children}: {index:number;children:React.ReactNode})=>{
  const {title,description,Icon}=sections[index];
  return <section className="overflow-hidden rounded-xl border border-border bg-card">
    <header className="flex items-center gap-3 border-b border-marsala-100 bg-marsala-50/50 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-marsala-800 shadow-sm">
        <Icon className="h-4 w-4"/>
      </span>
      <div><h3 className="text-sm font-semibold text-marsala-900">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p></div>
    </header>
    <div className="p-4">{children}</div>
  </section>;
};

export default function ClientRegistrationForm({
  onSaved,onCancel,compact=false,
}:{
  onSaved:(client:{id:string;name:string;document:string;phone:string})=>Promise<void>|void;
  onCancel:()=>void;
  compact?:boolean;
}){
  const [data,setData]=useState<ClientRegistration>(blankClientRegistration);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const field=(key:keyof ClientRegistration,value:string)=>{
    setData(prev=>({...prev,[key]:value}));
    setError("");
  };
  const fieldInput=(key:keyof ClientRegistration,label:string,extra:React.InputHTMLAttributes<HTMLInputElement>={})=>
    <div className={formFieldClass}>
      <Label htmlFor={"new-client-"+key}>{label}</Label>
      <Input id={"new-client-"+key} value={data[key]} disabled={saving}
        onChange={e=>field(key,e.target.value)} {...extra}/>
    </div>;
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(saving)return;
    const issue=validateClientRegistration(data);
    if(issue){setError(issue);return;}
    setSaving(true);setError("");
    try{
      const client=await createRegisteredClient(data);
      await onSaved(client);
    }catch(cause){
      setError(cause instanceof Error?cause.message:"Cadastro não confirmado no Supabase.");
    }finally{setSaving(false);}
  };
  const cols=compact?"grid gap-3 sm:grid-cols-2":"grid gap-4 sm:grid-cols-2";
  return <form onSubmit={e=>void submit(e)} className="space-y-4">
    <div className="rounded-lg border-l-4 border-marsala-700 bg-marsala-50/50 px-4 py-3">
      <p className="text-sm font-semibold text-marsala-900">Cadastro completo de cliente</p>
      <p className="text-xs text-muted-foreground">Os campos opcionais podem ser preenchidos depois.
        As informações serão utilizadas nos contratos e atendimentos da loja.</p>
    </div>
    <ClientFormSection index={0}>
      <div className={cols}>
        <div className="sm:col-span-2">{fieldInput("full_name","Nome completo *",{
          required:true,maxLength:160,autoComplete:"name",placeholder:"Nome e sobrenome",
        })}</div>
        {fieldInput("document","CPF ou CNPJ",{inputMode:"numeric",maxLength:20,placeholder:"Somente números ou formatado"})}
        {fieldInput("birth_date","Data de nascimento",{type:"date",max:"9999-12-31"})}
      </div>
    </ClientFormSection>
    <ClientFormSection index={1}>
      <div className={cols}>
        {fieldInput("phone","Celular / WhatsApp",{type:"tel",autoComplete:"tel",placeholder:"(21) 99999-9999"})}
        {fieldInput("secondary_phone","Telefone alternativo",{type:"tel",placeholder:"(21) 99999-9999"})}
        {fieldInput("email","E-mail",{type:"email",autoComplete:"email",placeholder:"cliente@exemplo.com"})}
        <div className={formFieldClass}>
          <Label htmlFor="new-client-acquisition_source">Como conheceu a loja?</Label>
          <select id="new-client-acquisition_source" disabled={saving} className={selectClass}
            value={data.acquisition_source} onChange={e=>field("acquisition_source",e.target.value)}>
            <option value="">Não informado</option>
            {sources.map(source=><option value={source} key={source}>{source}</option>)}
          </select>
        </div>
      </div>
    </ClientFormSection>
    <ClientFormSection index={2}>
      <div className={cols}>
        {fieldInput("cep","CEP",{inputMode:"numeric",autoComplete:"postal-code",placeholder:"00000-000"})}
        <div className="hidden sm:block"/>
        <div className="sm:col-span-2">{fieldInput("street","Rua / avenida",{autoComplete:"street-address"})}</div>
        {fieldInput("number","Número",{placeholder:"Nº"})}
        {fieldInput("complement","Complemento",{placeholder:"Apartamento, bloco, referência"})}
        {fieldInput("neighborhood","Bairro")}
        {fieldInput("city","Cidade",{placeholder:"Rio de Janeiro"})}
        {fieldInput("state","UF",{maxLength:2,placeholder:"RJ"})}
      </div>
    </ClientFormSection>
    <ClientFormSection index={3}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {fieldInput("bust","Busto (cm)",{inputMode:"decimal",placeholder:"Ex.: 92"})}
        {fieldInput("waist","Cintura (cm)",{inputMode:"decimal",placeholder:"Ex.: 74"})}
        {fieldInput("hips","Quadril (cm)",{inputMode:"decimal",placeholder:"Ex.: 102"})}
        {fieldInput("height","Altura (cm)",{inputMode:"decimal",placeholder:"Ex.: 165"})}
      </div>
    </ClientFormSection>
    <ClientFormSection index={4}>
      <div className={formFieldClass}>
        <Label htmlFor="new-client-notes">Observações internas</Label>
        <Textarea id="new-client-notes" rows={3} maxLength={3000}
          placeholder="Preferências de atendimento e informações importantes para a locação"
          disabled={saving} value={data.notes} onChange={e=>field("notes",e.target.value)}/>
        <p className="text-xs text-muted-foreground">{data.notes.length}/3000 caracteres</p>
      </div>
    </ClientFormSection>
    {error&&<p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      {error}
    </p>}
    <footer className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t bg-background/95 py-3 backdrop-blur">
      <p className="text-xs text-muted-foreground">* Campo obrigatório</p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="bg-marsala hover:bg-marsala-700" disabled={saving}>
          {saving?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Save className="mr-2 h-4 w-4"/>}
          {saving?"Salvando...":"Salvar cliente"}
        </Button>
      </div>
    </footer>
  </form>;
}
