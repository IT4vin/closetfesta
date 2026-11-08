import React,{useState,type ReactNode} from "react";
import {
  ClipboardList, Shirt, CalendarDays, BadgeDollarSign, ReceiptText,
  NotebookPen, Images, ChevronDown,
} from "lucide-react";

interface FormSectionProps {
  title:string;icon?:string;children:ReactNode;className?:string;
  bgColor?: "gray"|"blue"|"green"|"purple"|"yellow"|"red"|"marsala";
  collapsible?:boolean;defaultCollapsed?:boolean;id?:string;description?:string;
}
const icons:Record<string,React.ElementType>={
  "Informações Básicas":ClipboardList,
  "Características Físicas":Shirt,
  "Tipos de Evento":CalendarDays,
  "Valores Financeiros":BadgeDollarSign,
  "Códigos Fiscais":ReceiptText,
  "Informações Adicionais":NotebookPen,
  "Imagens do Produto":Images,
};
const defaultDescriptions:Record<string,string>={
  "Informações Básicas":"Identificação, tipo e controle de exemplares",
  "Características Físicas":"Tamanho, cor, modelo e marca",
  "Tipos de Evento":"Ocasiões em que o traje pode ser oferecido",
  "Valores Financeiros":"Preços e custos cadastrados para locação",
  "Códigos Fiscais":"Informações opcionais para integração fiscal",
  "Informações Adicionais":"Detalhes e observações do produto",
  "Imagens do Produto":"Fotografias que serão exibidas no catálogo",
};
export default function FormSection({
  title,children,className="",collapsible=false,defaultCollapsed=false,id,description,
}:FormSectionProps){
  const [collapsed,setCollapsed]=useState(defaultCollapsed);
  const Icon=icons[title]||ClipboardList;
  const titleMarkup=<>
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-marsala-50 text-marsala-800">
      <Icon className="h-5 w-5"/>
    </span>
    <span className="min-w-0 flex-1">
      <strong className="block text-sm font-semibold text-marsala-900">{title}</strong>
      <span className="mt-1 block text-xs font-normal leading-relaxed text-muted-foreground">
        {description||defaultDescriptions[title]||"Informações do cadastro"}
      </span>
    </span>
  </>;
  return <section id={id} className={"scroll-mt-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm "+className}>
    {collapsible?
      <button type="button" aria-expanded={!collapsed} onClick={()=>setCollapsed(current=>!current)}
        className="flex w-full items-center gap-3 border-b border-marsala-100 bg-marsala-50/40 px-4 py-4 text-left transition-colors hover:bg-marsala-50 sm:px-5">
        {titleMarkup}
        <span className="ml-auto inline-flex items-center gap-1 whitespace-nowrap text-xs text-marsala-800">
          {collapsed?"Expandir":"Recolher"}
          <ChevronDown className={"h-4 w-4 transition-transform "+(!collapsed?"rotate-180":"")}/>
        </span>
      </button>:
      <header className="flex items-center gap-3 border-b border-marsala-100 bg-marsala-50/40 px-4 py-4 sm:px-5">
        {titleMarkup}
      </header>}
    {!collapsed&&<div className="p-4 sm:p-5">{children}</div>}
  </section>;
}
