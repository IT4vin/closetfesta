import React,{useMemo,useState} from "react";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import {BadgeCheck,CalendarClock,Check,ClipboardList,KeyRound,
  Eye,EyeOff,Mail,Plus,RefreshCcw,Search,Shield,ShieldAlert,UserCheck,UserRound,
  UserRoundX,Users} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card,CardContent,CardHeader,CardTitle} from "@/components/ui/card";
import {Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle}
 from "@/components/ui/dialog";
import {useAuth} from "@/stores/authStore";
import {hasRolePermission} from "@/lib/accessControl";
import {
 changeEmployeeRole,createEmployeeWithCredentials,employeeRoleDetails,employeeRoleLabels,
 inviteEmployee,listEmployees,newEmployeeDraft,updateEmployee,setEmployeeUsername,
 setEmployeePassword,validateEmployeePassword,validateEmployeeUsername,
 validateEmployeeDraft,type EmployeeDraft,type EmployeeRole,type EmployeeRow,
} from "@/lib/employeeManagement";

type EditorMode="create"|"edit"|null;
const rolesForInvitation:EmployeeRole[]=["staff","cashier","manager"];
const rolesForManagement:EmployeeRole[]=["staff","cashier","manager","admin","inactive"];
const permissionRows=[
 {name:"PDV e contratos",resource:"orders",action:"create",description:"Abrir locações e registrar pedidos"},
 {name:"Editar pedidos",resource:"orders",action:"update",description:"Atualizações operacionais dos contratos"},
 {name:"Clientes",resource:"clients",action:"read",description:"Consultar fichas de clientes"},
 {name:"Cadastrar clientes",resource:"clients",action:"create",description:"Registrar novos clientes"},
 {name:"Catálogo de produtos",resource:"products",action:"read",description:"Consultar produtos"},
 {name:"Editar produtos",resource:"products",action:"update",description:"Gerenciar catálogo e exemplares"},
 {name:"Agenda",resource:"schedule",action:"read",description:"Provas, retiradas e devoluções"},
 {name:"Caixa",resource:"cash",action:"read",description:"Consultar operações de caixa"},
 {name:"Financeiro",resource:"financial",action:"read",description:"Consultar informações financeiras"},
 {name:"Relatórios",resource:"reports",action:"read",description:"Acessar relatórios"},
 {name:"Bater Ponto",resource:"timeClock",action:"punch",description:"Registrar entrada, almoço e saída"},
 {name:"Gerenciar Ponto",resource:"timeClock",action:"manage",description:"Ajustar marcações e imprimir QR"},
 {name:"Configurações",resource:"settings",action:"update",description:"Alterar parâmetros do sistema"},
 {name:"Funcionários e permissões",resource:"users",action:"update",description:"Administrar perfis de acesso"},
] as const;
function RolePreview({role}:{role:EmployeeRole}){
 const allowed=(resource:string,action:string)=>
  role!=="inactive"&&hasRolePermission(role,resource,action);
 return <section className="space-y-3 rounded-xl border border-[#E8E5E1] bg-[#FDFCFB] p-4">
  <div className="flex items-start gap-2">
   <Shield className="mt-0.5 h-5 w-5 shrink-0 text-marsala-800"/>
   <div>
    <p className="text-sm font-semibold text-marsala-950">
     Permissões do perfil: {employeeRoleLabels[role]}
    </p>
    <p className="mt-1 text-xs text-muted-foreground">{employeeRoleDetails[role]}</p>
   </div>
  </div>
  <div className="grid gap-2 sm:grid-cols-2">
   {permissionRows.map(p=>{
     const grant=allowed(p.resource,p.action);
     return <div key={p.name} className="flex items-center gap-2 rounded-lg border bg-white p-2.5 text-xs"
       title={p.description}>
      <span className={"flex h-6 w-6 shrink-0 items-center justify-center rounded-full "+
        (grant?"bg-emerald-50 text-emerald-700":"bg-neutral-100 text-muted-foreground")}>
       {grant?<Check className="h-3.5 w-3.5"/>:"—"}
      </span>
      <span className={grant?"font-medium text-foreground":"text-muted-foreground"}>{p.name}</span>
     </div>;
   })}
  </div>
  <p className="text-xs leading-relaxed text-muted-foreground">
   As permissões seguem os perfis efetivamente implementados no PDV e no Supabase.
   Cada funcionário recebe um perfil próprio; controles individuais por ação
   exigem regras específicas em todos os módulos e não são simulados nesta tela.
  </p>
 </section>;
}
function EmployeeFields({form,setForm,disabled,isCreate,credentialsMode}:{
 form:EmployeeDraft;setForm:React.Dispatch<React.SetStateAction<EmployeeDraft>>;
 disabled:boolean;isCreate:boolean;credentialsMode:boolean;
}){
 const change=(key:keyof EmployeeDraft,value:string)=>
  setForm(prev=>({...prev,[key]:value}));
 return <div className="grid gap-4 sm:grid-cols-2">
  <div className="space-y-1.5 sm:col-span-2">
   <Label htmlFor="employee-name">Nome completo *</Label>
   <Input id="employee-name" required minLength={2} maxLength={140}
    autoComplete="name" value={form.full_name} disabled={disabled}
    placeholder="Nome e sobrenome"
    onChange={e=>change("full_name",e.target.value)}/>
  </div>
  <div className="space-y-1.5">
   <Label htmlFor="employee-email">{credentialsMode?"E-mail de contato (opcional)":"E-mail de acesso *"}</Label>
   <Input id="employee-email" type="email" autoComplete="email" required={isCreate&&!credentialsMode}
    readOnly={!isCreate} disabled={disabled} value={form.email}
    placeholder="funcionario@exemplo.com"
    onChange={e=>change("email",e.target.value)}/>
   {!isCreate&&<p className="text-xs text-muted-foreground">
    Para alterar o e-mail de login, o titular deve confirmar a troca em seu perfil.
   </p>}
  </div>
  <div className="space-y-1.5">
   <Label htmlFor="employee-phone">Telefone / WhatsApp</Label>
   <Input id="employee-phone" type="tel" autoComplete="tel" disabled={disabled}
    placeholder="(21) 99999-9999" value={form.phone}
    onChange={e=>change("phone",e.target.value)}/>
  </div>
  <div className="space-y-1.5">
   <Label htmlFor="employee-department">Setor</Label>
   <Input id="employee-department" maxLength={100} disabled={disabled}
    placeholder="Ex.: Atendimento, caixa, costura" value={form.department}
    onChange={e=>change("department",e.target.value)}/>
  </div>
  <div className="space-y-1.5">
   <Label htmlFor="employee-job-title">Cargo / função</Label>
   <Input id="employee-job-title" maxLength={100} disabled={disabled}
    placeholder="Ex.: Consultora de vendas" value={form.job_title}
    onChange={e=>change("job_title",e.target.value)}/>
  </div>
  <div className="space-y-1.5">
   <Label htmlFor="employee-hired-on">Data de admissão</Label>
   <Input id="employee-hired-on" type="date" disabled={disabled}
    value={form.hired_on} onChange={e=>change("hired_on",e.target.value)}/>
  </div>
 </div>;
}
export default function EmployeeManager(){
 const {user}=useAuth();
 const admin=user?.role?.id==="admin";
 const cache=useQueryClient();
 const [search,setSearch]=useState("");
 const [mode,setMode]=useState<EditorMode>(null);
 const [selected,setSelected]=useState<EmployeeRow|null>(null);
 const [form,setForm]=useState<EmployeeDraft>(newEmployeeDraft);
 const [createMethod,setCreateMethod]=useState<"credentials"|"invite">("credentials");
 const [initialUsername,setInitialUsername]=useState("");
 const [initialPassword,setInitialPassword]=useState("");
 const [initialPasswordConfirm,setInitialPasswordConfirm]=useState("");
 const [usernameDraft,setUsernameDraft]=useState("");
 const [roleDraft,setRoleDraft]=useState<EmployeeRole>("staff");
 const [passwordTarget,setPasswordTarget]=useState<EmployeeRow|null>(null);
 const [passwordDraft,setPasswordDraft]=useState("");
 const [passwordConfirm,setPasswordConfirm]=useState("");
 const [passwordVisible,setPasswordVisible]=useState(false);
 const [passwordError,setPasswordError]=useState("");
 const [busy,setBusy]=useState("");
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const employees=useQuery({
   queryKey:["settings","employees"],
   queryFn:listEmployees,enabled:admin,staleTime:15000,
 });
 const filtered=useMemo(()=>employees.data?.filter(m=>
   [m.full_name,m.username,m.email,m.job_title,m.department].join(" ").toLowerCase()
     .includes(search.trim().toLowerCase()))??[],[employees.data,search]);
 const roleSummary=useMemo(()=>{
   const rows=employees.data??[];
   return {total:rows.length,active:rows.filter(m=>m.role!=="inactive").length,
     pending:rows.filter(m=>!m.email_confirmed).length};
 },[employees.data]);
 const clearCreateCredentials=()=>{
  setInitialUsername("");setInitialPassword("");setInitialPasswordConfirm("");
 };
 const close=()=>{setMode(null);setSelected(null);setError("");clearCreateCredentials();};
 const openInvite=()=>{
  setMode("create");setSelected(null);setForm(newEmployeeDraft());
  setCreateMethod("credentials");clearCreateCredentials();
  setRoleDraft("staff");setError("");setNotice("");
 };
 const openEdit=(employee:EmployeeRow)=>{
  setMode("edit");setSelected(employee);setRoleDraft(employee.role);
  setForm({full_name:employee.full_name,email:employee.email,phone:employee.phone??"",
   department:employee.department??"",job_title:employee.job_title??"",
   hired_on:employee.hired_on??"",role:employee.role});
  setError("");setNotice("");
 };
 const refresh=async()=>{
  await cache.invalidateQueries({queryKey:["settings","employees"]});
 };
 const closePasswordEditor=()=>{
  if(busy)return;
  setPasswordTarget(null);setPasswordDraft("");setPasswordConfirm("");
  setPasswordVisible(false);setPasswordError("");setUsernameDraft("");
 };
 const openPasswordEditor=(employee:EmployeeRow)=>{
  if(busy||!admin)return;
  setPasswordTarget(employee);
  setUsernameDraft(employee.username??"");
  setPasswordDraft("");setPasswordConfirm("");
  setPasswordVisible(false);setPasswordError("");setError("");
 };
 const submitPassword=async(e:React.FormEvent)=>{
  e.preventDefault();
  if(!admin||busy||!passwordTarget)return;
  const issue=validateEmployeePassword(passwordDraft);
  if(issue){setPasswordError(issue);return;}
  if(passwordDraft!==passwordConfirm){
   setPasswordError("As senhas digitadas não coincidem.");
   return;
  }
  if(!window.confirm(
   "Confirma a alteração da senha de login de "+passwordTarget.full_name+
   " ("+passwordTarget.email+")? A senha antiga deixará de funcionar no próximo login."))return;
  setBusy("password");setPasswordError("");setError("");
  try{
   const result=await setEmployeePassword(passwordTarget.id,passwordDraft);
   setNotice(result.audit_confirmed
    ?"Senha de login de "+passwordTarget.full_name+" atualizada com sucesso."
    :"Senha atualizada. Verifique o registro de auditoria no Supabase.");
   setPasswordTarget(null);
   await refresh();
  }catch(cause){
   setPasswordError(cause instanceof Error?cause.message:"Não foi possível redefinir a senha.");
  }finally{
   // Não manter a senha em memória após uma tentativa, inclusive se ela falhar.
   setPasswordDraft("");setPasswordConfirm("");setPasswordVisible(false);setBusy("");
  }
 };
 const submitUsername=async()=>{
  if(!admin||busy||!passwordTarget)return;
  const issue=validateEmployeeUsername(usernameDraft);
  if(issue){setPasswordError(issue);return;}
  if(usernameDraft.trim().toLowerCase()===passwordTarget.username)return;
  if(!window.confirm("Alterar o login de "+passwordTarget.full_name+"? O identificador de acesso anterior deixará de funcionar."))return;
  setBusy("username");setPasswordError("");
  try{
   const response=await setEmployeeUsername(passwordTarget.id,usernameDraft);
   setPasswordTarget({...passwordTarget,username:response.username,
    login_email:response.username+"@closetmanager.local"});
   setNotice(response.audit_confirmed?"Usuário de login atualizado.":"Login atualizado; confirme a auditoria.");
   await refresh();
  }catch(cause){
   setPasswordError(cause instanceof Error?cause.message:"Não foi possível alterar o usuário.");
  }finally{setBusy("");}
 };
 const submitDetails=async(e:React.FormEvent)=>{
  e.preventDefault();
  if(busy||!admin)return;
  const isCredentials=mode==="create"&&createMethod==="credentials";
  const issue=validateEmployeeDraft(form,mode==="create"&&!isCredentials);
  if(issue){setError(issue);return;}
  if(isCredentials){
   const credentialIssue=validateEmployeeUsername(initialUsername)||
      validateEmployeePassword(initialPassword);
   if(credentialIssue){setError(credentialIssue);return;}
   if(initialPassword!==initialPasswordConfirm){
    setError("As senhas digitadas não coincidem.");return;
   }
  }
  setError("");setNotice("");setBusy("save");
  try{
   if(mode==="create"){
    if(isCredentials){
     await createEmployeeWithCredentials(form,initialUsername,initialPassword);
     setNotice("Funcionário cadastrado. O usuário e a senha escolhidos já podem ser usados no login.");
    }else{
     const confirmation=window.confirm(
      "Enviar convite de acesso para "+form.email+" como "+employeeRoleLabels[form.role]+
      "? A senha será definida pelo próprio funcionário.");
     if(!confirmation)return;
     const result=await inviteEmployee(form);
     setNotice("Convite enviado para "+result.email+
       ". O funcionário define a senha pelo e-mail recebido.");
    }
    close();
   }else if(mode==="edit"&&selected){
    await updateEmployee(selected.id,form);
    setNotice("Dados de "+form.full_name+" salvos no Supabase com histórico de edição.");
    close();
   }
   await refresh();
  }catch(cause){
   setError(cause instanceof Error?cause.message:"Não foi possível concluir.");
   await refresh();
  }finally{setBusy("");setInitialPassword("");setInitialPasswordConfirm("");}
 };
 const saveRole=async()=>{
  if(!admin||busy||!selected||selected.id===user?.id||
     selected.role===roleDraft)return;
  const label=employeeRoleLabels[roleDraft];
  const message=roleDraft==="inactive"
    ?"Retirar o acesso de "+selected.full_name+
       "? O funcionário não conseguirá entrar no PDV com este perfil, mas o histórico será preservado."
    :"Alterar o perfil de "+selected.full_name+" para "+label+
       "? As permissões são aplicadas no servidor.";
  if(!window.confirm(message))return;
  setBusy("role");setError("");setNotice("");
  try{
   await changeEmployeeRole(selected.id,roleDraft);
   setSelected({...selected,role:roleDraft});
   setForm(current=>({...current,role:roleDraft}));
   setNotice("Permissões atualizadas e registradas na auditoria.");
   await refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Falha na atualização do perfil.");}
  finally{setBusy("");}
 };
 if(!admin)return <div role="alert" className="rounded-lg border p-5 text-sm text-muted-foreground">
  Apenas administradores podem cadastrar funcionários e alterar perfis de acesso.
 </div>;
 return <div className="space-y-5">
  <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-marsala-100 bg-gradient-to-r from-marsala-50 to-white p-4 sm:p-5">
   <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-marsala-800">
     Equipe e controle de acesso
    </p>
    <h3 className="mt-1 text-xl font-semibold text-marsala-950">Cadastro de Funcionários</h3>
    <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">
     Cadastre usuários e senhas próprios ou envie convites. Defina o
     perfil de acesso e preserve os históricos de operação e ponto.
    </p>
   </div>
   <Button onClick={openInvite} className="bg-marsala hover:bg-marsala-700">
    <Plus className="mr-2 h-4 w-4"/>Novo funcionário
   </Button>
  </header>
  <div className="grid gap-3 sm:grid-cols-3">
   {([
    {label:"Funcionários cadastrados",value:roleSummary.total,Icon:Users},
    {label:"Com acesso",value:roleSummary.active,Icon:UserCheck},
    {label:"E-mails não confirmados",value:roleSummary.pending,Icon:Mail},
   ] as const).map(item=><div key={item.label}
      className="flex items-center justify-between rounded-xl border p-4">
    <div><p className="text-xs text-muted-foreground">{item.label}</p>
     <p className="mt-1 text-2xl font-semibold tabular-nums">{item.value}</p>
    </div><item.Icon className="h-5 w-5 text-marsala-700"/>
   </div>)}
  </div>
  {notice&&<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
  {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
  {mode&&<Card className="border-marsala-200 shadow-sm">
   <CardHeader className="border-b">
    <CardTitle className="flex items-center gap-2 text-base">
     <UserRound className="h-5 w-5 text-marsala-800"/>
     {mode==="create"?"Cadastrar funcionário":"Editar cadastro do funcionário"}
    </CardTitle>
    <p className="text-xs leading-relaxed text-muted-foreground">
     {mode==="create"
      ?"Escolha entre login com usuário e senha determinados pelo administrador ou convite por e-mail."
      :"As informações serão atualizadas no cadastro vinculado ao login existente."}
    </p>
   </CardHeader>
   <CardContent className="space-y-5 p-4 sm:p-5">
    <form onSubmit={e=>void submitDetails(e)} className="space-y-5">
     {mode==="create"&&<div className="flex flex-wrap gap-2">
      <Button type="button" variant={createMethod==="credentials"?"default":"outline"}
       onClick={()=>setCreateMethod("credentials")} disabled={Boolean(busy)}>
       <KeyRound className="mr-2 h-4 w-4"/>Definir usuário e senha
      </Button>
      <Button type="button" variant={createMethod==="invite"?"default":"outline"}
       onClick={()=>setCreateMethod("invite")} disabled={Boolean(busy)}>
       <Mail className="mr-2 h-4 w-4"/>Convidar por e-mail
      </Button>
     </div>}
     <EmployeeFields form={form} setForm={setForm} disabled={Boolean(busy)}
      isCreate={mode==="create"} credentialsMode={mode==="create"&&createMethod==="credentials"}/>
     {mode==="create"&&createMethod==="credentials"&&<div className="grid gap-3 rounded-xl border border-marsala-200 p-4">
      <div className="space-y-1.5">
       <Label htmlFor="employee-username">Usuário de login *</Label>
       <Input id="employee-username" required minLength={3} maxLength={32}
        autoComplete="off" placeholder="ex.: maria.vendas"
        value={initialUsername} disabled={Boolean(busy)}
        onChange={e=>setInitialUsername(e.target.value.toLowerCase())}/>
      </div>
      <div className="space-y-1.5">
       <Label htmlFor="employee-initial-password">Senha inicial (12 a 72 caracteres) *</Label>
       <Input id="employee-initial-password" type="password" autoComplete="new-password"
        minLength={12} maxLength={72} required value={initialPassword}
        disabled={Boolean(busy)} onChange={e=>setInitialPassword(e.target.value)}/>
      </div>
      <div className="space-y-1.5">
       <Label htmlFor="employee-initial-password-confirm">Confirmar senha *</Label>
       <Input id="employee-initial-password-confirm" type="password"
        autoComplete="new-password" minLength={12} maxLength={72} required
        value={initialPasswordConfirm} disabled={Boolean(busy)}
        onChange={e=>setInitialPasswordConfirm(e.target.value)}/>
      </div>
      <p className="text-xs text-muted-foreground">
       Use uma senha com letras e números; a senha não será guardada na ficha do funcionário.
      </p>
     </div>}
     {mode==="create"&&<div className="space-y-2">
      <Label htmlFor="employee-invite-role">Perfil inicial de acesso *</Label>
      <select id="employee-invite-role" value={form.role} disabled={Boolean(busy)}
       onChange={e=>setForm(current=>({...current,role:e.target.value as EmployeeRole}))}
       className="h-11 w-full rounded-md border bg-background px-3 text-sm">
       {rolesForInvitation.map(role=><option value={role} key={role}>
        {employeeRoleLabels[role]}
       </option>)}
      </select>
      <RolePreview role={form.role}/>
     </div>}
     <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
      <Button type="button" variant="outline" disabled={Boolean(busy)}
       onClick={close}>Cancelar</Button>
      <Button type="submit" disabled={Boolean(busy)} className="bg-marsala hover:bg-marsala-700">
       {busy?"Salvando...":mode==="create"?
        createMethod==="credentials"?<><KeyRound className="mr-2 h-4 w-4"/>Criar acesso</>:
        <><Mail className="mr-2 h-4 w-4"/>Enviar convite</>:
        <><BadgeCheck className="mr-2 h-4 w-4"/>Salvar dados</>}
      </Button>
     </div>
    </form>
    {mode==="edit"&&selected&&<>
     <div className="border-t pt-5">
      <h4 className="flex items-center gap-2 font-semibold text-marsala-950">
       <KeyRound className="h-4 w-4"/>Permissões deste funcionário
      </h4>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
       Perfis são aplicados de forma individual e auditada pelo servidor.
       Não alteramos o seu próprio perfil de administrador.
      </p>
     </div>
     <div className="space-y-2">
      <Label htmlFor="employee-change-role">Selecionar perfil</Label>
      <select id="employee-change-role"
       value={roleDraft} disabled={Boolean(busy)||selected.id===user?.id}
       onChange={e=>setRoleDraft(e.target.value as EmployeeRole)}
       className="h-11 w-full rounded-md border bg-background px-3 text-sm">
       {rolesForManagement.map(role=><option key={role} value={role}>
        {employeeRoleLabels[role]}
       </option>)}
      </select>
      {selected.id===user?.id&&<p className="text-xs text-amber-800">
       Seu perfil de administrador não pode ser alterado por você mesmo.
      </p>}
     </div>
     <RolePreview role={roleDraft}/>
     <Button type="button" disabled={Boolean(busy)||selected.id===user?.id||
       selected.role===roleDraft} onClick={()=>void saveRole()}
       className={roleDraft==="inactive"?"bg-red-700 hover:bg-red-800":"bg-marsala hover:bg-marsala-700"}>
      {roleDraft==="inactive"?
       <><UserRoundX className="mr-2 h-4 w-4"/>Desativar acesso</>:
       <><Shield className="mr-2 h-4 w-4"/>Salvar permissões</>}
     </Button>
     <p className="text-xs text-muted-foreground">
      Desativar retira os perfis de acesso; não exclui a conta ou seus
      registros de contrato, pagamentos e ponto.
     </p>
     <div className="border-t pt-5 space-y-2">
      <h4 className="flex items-center gap-2 font-semibold text-marsala-950">
       <KeyRound className="h-4 w-4"/>Senha de login
      </h4>
      <p className="text-xs text-muted-foreground">
       Defina uma senha nova para este usuário, inclusive se ele ainda estiver em primeiro acesso.
       A senha atual não pode ser consultada e a alteração é registrada sem guardar credenciais.
      </p>
      <Button type="button" variant="outline" disabled={Boolean(busy)}
       onClick={()=>openPasswordEditor(selected)}
       className="border-marsala-200 text-marsala-900">
       <KeyRound className="mr-2 h-4 w-4"/>Definir ou alterar senha
      </Button>
     </div>
    </>}
   </CardContent>
  </Card>}
  <Card className="shadow-sm">
   <CardHeader>
    <div className="flex flex-wrap items-center justify-between gap-3">
     <CardTitle className="text-base">Funcionários do sistema</CardTitle>
     <Button type="button" size="sm" variant="outline" disabled={employees.isFetching}
      onClick={()=>void refresh()}>
      <RefreshCcw className={"mr-2 h-4 w-4 "+(employees.isFetching?"animate-spin":"")}/>
      Atualizar
     </Button>
    </div>
    <div className="relative mt-2">
     <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/>
     <Input aria-label="Buscar funcionários" value={search} className="pl-9"
      placeholder="Pesquisar por nome, e-mail, cargo ou setor"
      onChange={e=>setSearch(e.target.value)}/>
    </div>
   </CardHeader>
   <CardContent className="space-y-2">
    {employees.isPending&&<p role="status" className="py-5 text-sm text-muted-foreground">
      Carregando funcionários do Supabase...</p>}
    {employees.isError&&<p role="alert" className="rounded-lg border border-red-200 p-3 text-sm text-red-800">
      {employees.error instanceof Error?employees.error.message:"Não foi possível carregar a equipe."}
     </p>}
    {employees.isSuccess&&filtered.length===0&&<p className="py-6 text-center text-sm text-muted-foreground">
     Nenhum funcionário encontrado.</p>}
    {filtered.map(employee=><div key={employee.id}
      className="flex flex-col justify-between gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center">
     <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-marsala-50 text-marsala-800">
       <UserRound className="h-5 w-5"/>
      </div>
      <div className="min-w-0">
       <p className="break-words text-sm font-semibold">{employee.full_name||"Sem nome"}</p>
       <p className="break-words text-xs text-muted-foreground">
        {employee.username?"Usuário: "+employee.username:employee.email}
       </p>
       {employee.username&&employee.email&&employee.email!==employee.login_email&&
         <p className="break-words text-xs text-muted-foreground">Contato: {employee.email}</p>}
       {employee.job_title&&<p className="mt-1 text-xs text-muted-foreground">{employee.job_title}</p>}
      </div>
     </div>
     <div className="flex flex-wrap items-center gap-2 sm:justify-end">
      <Badge variant="outline" className={employee.role==="inactive"?
        "border-red-200 bg-red-50 text-red-800":"border-[#E8E5E1] bg-[#FDFCFB] text-marsala-900"}>
       {employeeRoleLabels[employee.role]||employee.role}
      </Badge>
      {!employee.email_confirmed&&<Badge variant="outline" className="border-amber-200 text-amber-800">
       Convite pendente
      </Badge>}
      <Button variant="outline" size="sm" disabled={Boolean(busy)}
       onClick={()=>openPasswordEditor(employee)}
       aria-label={"Definir ou alterar a senha de "+employee.full_name}>
       <KeyRound className="mr-2 h-4 w-4"/>Senha
      </Button>
      <Button variant="outline" size="sm" disabled={Boolean(busy)} onClick={()=>openEdit(employee)}>
       <Shield className="mr-2 h-4 w-4"/>Gerenciar
      </Button>
     </div>
    </div>)}
   </CardContent>
  </Card>
  <div className="flex items-start gap-2 rounded-lg border border-[#E8E5E1] bg-[#FDFCFB] p-4 text-xs text-muted-foreground">
   <ShieldAlert className="h-4 w-4 shrink-0 text-marsala-700"/>
   Somente administradores podem convidar funcionários, definir senhas,
   alterar perfis e desativar acessos. Cada funcionário usa seu próprio login.
   Registros anteriores são mantidos para auditoria.
  </div>
  <Dialog open={Boolean(passwordTarget)} onOpenChange={open=>{
   if(!open)closePasswordEditor();
  }}>
   <DialogContent className="sm:max-w-lg">
    <DialogHeader>
     <DialogTitle className="flex items-center gap-2 text-marsala-950">
      <KeyRound className="h-5 w-5 text-marsala-800"/>Definir senha de login
     </DialogTitle>
     <DialogDescription>
      Esta operação altera a senha de acesso do usuário no Supabase Auth.
      A senha anterior não fica visível nem será recuperada.
     </DialogDescription>
    </DialogHeader>
    {passwordTarget&&<form onSubmit={e=>void submitPassword(e)} className="space-y-4">
     <div className="rounded-lg border border-[#E8E5E1] bg-[#FDFCFB] p-3 text-sm">
      <p className="font-semibold">{passwordTarget.full_name}</p>
      <p className="break-all text-xs text-muted-foreground">{passwordTarget.email}</p>
      {!passwordTarget.email_confirmed&&<p className="mt-2 text-xs text-amber-800">
       O e-mail ainda não foi confirmado. Definir uma senha não dispensa a confirmação necessária para acessar a conta.
      </p>}
     </div>
     <div className="space-y-1.5">
      <Label htmlFor="admin-employee-username">Nome de usuário</Label>
      <div className="flex gap-2">
       <Input id="admin-employee-username" type="text" autoComplete="off"
        maxLength={32} value={usernameDraft} disabled={Boolean(busy)}
        placeholder="ex.: maria.vendas" onChange={e=>setUsernameDraft(e.target.value.toLowerCase())}/>
       <Button type="button" variant="outline" disabled={Boolean(busy)||!usernameDraft.trim()}
        onClick={()=>void submitUsername()}>Alterar</Button>
      </div>
      <p className="text-xs text-muted-foreground">Alterar o usuário modifica o identificador de login.</p>
     </div>
     <div className="space-y-1.5">
      <Label htmlFor="admin-new-password">Nova senha (mínimo 12 caracteres) *</Label>
      <div className="relative">
       <Input id="admin-new-password" type={passwordVisible?"text":"password"}
        autoComplete="new-password" minLength={12} maxLength={72}
        required value={passwordDraft} disabled={Boolean(busy)}
        className="pr-12"
        onChange={e=>{setPasswordDraft(e.target.value);setPasswordError("");}}/>
       <Button type="button" variant="ghost" size="icon"
        aria-label={passwordVisible?"Ocultar nova senha":"Mostrar nova senha"}
        disabled={Boolean(busy)}
        onClick={()=>setPasswordVisible(v=>!v)}
        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
        {passwordVisible?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}
       </Button>
      </div>
      <p className="text-xs text-muted-foreground">Use de 12 a 72 caracteres, com letras e números. Prefira uma senha única para cada funcionário.</p>
     </div>
     <div className="space-y-1.5">
      <Label htmlFor="admin-confirm-password">Confirmar nova senha *</Label>
      <Input id="admin-confirm-password" type={passwordVisible?"text":"password"}
       autoComplete="new-password" minLength={12} maxLength={72}
       required value={passwordConfirm} disabled={Boolean(busy)}
       onChange={e=>{setPasswordConfirm(e.target.value);setPasswordError("");}}/>
     </div>
     {passwordError&&<p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
      {passwordError}
     </p>}
     <p className="text-xs text-muted-foreground">
      A senha será atualizada diretamente no serviço de autenticação, sem ser armazenada no cadastro.
      Sessões já abertas podem permanecer ativas até serem encerradas.
     </p>
     <DialogFooter>
      <Button type="button" variant="outline" disabled={Boolean(busy)}
       onClick={closePasswordEditor}>Cancelar</Button>
      <Button type="submit" disabled={Boolean(busy)||!passwordDraft||!passwordConfirm}
       className="bg-marsala hover:bg-marsala-700">
       {busy==="password"?"Atualizando...":"Salvar nova senha"}
      </Button>
     </DialogFooter>
    </form>}
   </DialogContent>
  </Dialog>
 </div>;
}
