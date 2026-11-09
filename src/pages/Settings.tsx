import React, { useState } from "react";
import { Building2, CalendarDays, CreditCard, FileText, Shield, Bell, Target, Receipt, Search, Settings as SettingsIcon, Database, Users } from "lucide-react";
import { useAuth } from "@/stores/authStore";
import PermissionManager from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ClosetSettingsEditor from "@/components/settings/ClosetSettingsEditor";
import EmployeeManager from "@/components/settings/EmployeeManager";
import CurrentUserProfileEditor from "@/components/settings/CurrentUserProfileEditor";
import type { ClosetSettingsSection } from "@/lib/closetSettings";

const sections = [
  { id:"company", label:"Informações da loja", description:"Dados cadastrais, contatos e horários", icon:Building2 },
  { id:"operations", label:"Operações", description:"Agenda, atendimento, pedidos e estoque", icon:CalendarDays },
  { id:"payments", label:"Métodos de pagamento", description:"Recebimentos e parcelamento", icon:CreditCard },
  { id:"documents", label:"Documentos e contratos", description:"Textos, modelos e orientações", icon:FileText },
  { id:"employees", label:"Funcionários", description:"Cadastrar equipe e gerenciar acessos", icon:Users },
  { id:"permissions", label:"Permissões", description:"Acesso por perfil e usuários", icon:Shield },
  { id:"messages", label:"Avisos e mensagens", description:"Modelos de comunicação", icon:Bell },
  { id:"goals", label:"Metas", description:"Objetivos e indicadores comerciais", icon:Target },
  { id:"tax", label:"Nota fiscal", description:"Cadastro e parâmetros fiscais", icon:Receipt },
] as const;

export default function Settings() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<ClosetSettingsSection | "employees">("company");
  const [search, setSearch] = useState("");
  const [unsaved, setUnsaved] = useState(false);
  const canRead = PermissionManager.hasPermission("settings", "read");
  const isAdmin = user?.role?.id === "admin";
  const matching = sections.filter(section =>
    (section.id !== "employees" || isAdmin) &&
    (section.label + " " + section.description).toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")));
  const current = sections.find(section => section.id === activeSection) ?? sections[0];
  const Icon = current.icon;
  const changeSection = (section: ClosetSettingsSection | "employees") => {
    if (section === activeSection) return;
    if (unsaved && !window.confirm("Há alterações não salvas. Deseja descartá-las e trocar de seção?")) return;
    setUnsaved(false);
    setActiveSection(section);
  };
  return <div className="page-transition space-y-8">
    <div className="flex flex-col gap-6 border-b border-gray-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="mb-2 bg-gradient-to-r from-marsala-600 to-marsala-800 bg-clip-text text-4xl font-bold text-transparent">
          Configurações do Sistema
        </h1>
        <p className="flex items-center gap-2 text-lg text-gray-600">
          <SettingsIcon className="h-5 w-5 text-marsala-500" />
          Personalize o funcionamento do Closet Festa
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="border-marsala-300 bg-marsala-50 px-4 py-2 text-marsala-700">
          {user?.full_name ?? "Usuário"}
        </Badge>
        <Badge variant="outline">{user?.role.name ?? "Sem perfil"}</Badge>
      </div>
    </div>
    {!canRead ? <CurrentUserProfileEditor/> :
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
      <div className="lg:col-span-1">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <SettingsIcon className="h-5 w-5 text-marsala-600"/> Configurações
            </CardTitle>
            <CardDescription>Escolha a categoria que deseja configurar</CardDescription>
            <div className="relative pt-2">
              <Search className="absolute left-3 top-5 h-4 w-4 text-muted-foreground" />
              <Input aria-label="Buscar configurações" placeholder="Buscar configuração..."
                value={search} onChange={e=>setSearch(e.target.value)} className="pl-9"/>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <nav aria-label="Categorias de configurações" className="space-y-1">
              {matching.map(section => {
                const SectionIcon = section.icon;
                const selected = section.id === activeSection;
                return <button type="button" key={section.id}
                  onClick={() => changeSection(section.id)}
                  aria-current={selected ? "page" : undefined}
                  className={"group flex w-full items-center gap-3 rounded-lg p-4 text-left transition-all duration-200 " +
                    (selected ? "border-l-4 border-marsala-600 bg-marsala-50 text-marsala-700" :
                      "text-gray-700 hover:bg-gray-50")}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-marsala-600">
                    <SectionIcon className="h-4 w-4 text-white"/>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{section.label}</div>
                    <div className="truncate text-xs text-gray-500">{section.description}</div>
                  </div>
                </button>;
              })}
              {matching.length===0 && <p className="p-4 text-sm text-muted-foreground">Nenhuma configuração encontrada.</p>}
            </nav>
          </CardContent>
        </Card>
        <Card className="mt-6"><CardContent className="flex gap-3 p-4 text-sm text-muted-foreground">
          <Database className="h-5 w-5 shrink-0 text-marsala-600"/>
          As configurações são carregadas do Supabase. O sistema confirma cada salvamento.
        </CardContent></Card>
      </div>
      <div className="lg:col-span-3">
        <Card className="min-h-[600px]">
          <CardHeader><div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-marsala-600">
              <Icon className="h-5 w-5 text-white"/>
            </div>
            <div><CardTitle className="text-2xl">{current.label}</CardTitle>
              <CardDescription>{current.description}</CardDescription>
            </div>
          </div></CardHeader>
          <CardContent className="p-6">
            {activeSection === "employees" ? (isAdmin ? <EmployeeManager/> : null) :
              <ClosetSettingsEditor key={activeSection} section={activeSection} onDirtyChange={setUnsaved}/>}
            {activeSection==="company" && <div className="mt-6"><CurrentUserProfileEditor/></div>}
          </CardContent>
        </Card>
      </div>
    </div>}
  </div>;
}
