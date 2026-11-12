import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Loader2, KeyRound, Pencil, Plus, RefreshCw, Search, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";

type EmployeeRole = "admin" | "manager" | "staff" | "cashier" | "inactive";
type EditableRole = "manager" | "staff" | "cashier";
type CreationMode = "credentials" | "invitation";

interface Employee {
  id: string;
  full_name: string;
  email: string | null;
  login_email: string | null;
  username: string | null;
  phone: string | null;
  role: EmployeeRole;
  department: string | null;
  job_title: string | null;
  hired_on: string | null;
  email_confirmed: boolean;
  created_at: string;
}

interface EmployeeDetails {
  full_name: string;
  phone: string;
  department: string;
  job_title: string;
  hired_on: string;
  role: EmployeeRole;
}

const labels: Record<EmployeeRole, string> = {
  admin: "Administrador", manager: "Gerente", staff: "Vendedor / atendimento",
  cashier: "Caixa", inactive: "Sem acesso"
};
const roles: EditableRole[] = ["manager", "staff", "cashier"];
const emptyDetails: EmployeeDetails = {
  full_name: "", phone: "", department: "", job_title: "", hired_on: "", role: "staff"
};
const usernamePattern = /^[a-z0-9][a-z0-9._-]{2,31}$/;
const passwordValid = (password: string) =>
  password.length >= 12 && password.length <= 72 &&
  new TextEncoder().encode(password).byteLength <= 72 &&
  /\p{L}/u.test(password) && /\d/u.test(password);

async function secureInvoke(functionName: string, body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) {
    let description = error.message;
    try {
      const responseBody = await (error as { context?: Response }).context?.json();
      if (responseBody?.error) description = String(responseBody.error);
    } catch { /* Keep network error if response is not JSON. */ }
    throw new Error(description);
  }
  if (data?.error) throw new Error(String(data.error));
  return data;
}

const UserManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.role?.id === "admin";
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState<CreationMode>("credentials");
  const [details, setDetails] = useState<EmployeeDetails>(emptyDetails);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [selected, setSelected] = useState<Employee | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const loadEmployees = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any).rpc("closet_employee_directory");
      if (error) throw error;
      setEmployees(Array.isArray(data) ? (data as Employee[]) : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar funcionários.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { void loadEmployees(); }, [loadEmployees]);

  const filtered = useMemo(() => employees.filter((employee) =>
    [employee.full_name, employee.username, employee.email, employee.department, employee.job_title]
      .some((value) => (value ?? "").toLowerCase().includes(search.toLowerCase()))
  ), [employees, search]);

  const resetFields = () => {
    setDetails(emptyDetails);
    setNewUsername("");
    setNewPassword("");
    setContactEmail("");
  };

  const openCreate = () => {
    resetFields();
    setCreateMode("credentials");
    setShowCreate(true);
  };
  const openCredentials = (employee: Employee) => {
    setSelected(employee);
    setNewUsername(employee.username ?? "");
    setNewPassword("");
    setShowCredentials(true);
  };
  const openEdit = (employee: Employee) => {
    setSelected(employee);
    setDetails({
      full_name: employee.full_name ?? "",
      phone: employee.phone ?? "",
      department: employee.department ?? "",
      job_title: employee.job_title ?? "",
      hired_on: employee.hired_on ?? "",
      role: employee.role
    });
    setShowEdit(true);
  };

  const createEmployee = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (details.full_name.trim().length < 2) return toast.error("Informe o nome completo.");
    if (createMode === "credentials") {
      if (!usernamePattern.test(newUsername.trim().toLowerCase()))
        return toast.error("Usuário precisa de 3 a 32 caracteres (letras, números, ponto, hífen ou _).");
      if (!passwordValid(newPassword))
        return toast.error("A senha precisa de 12 a 72 caracteres, incluindo letras e números.");
    } else if (!contactEmail.includes("@")) {
      return toast.error("Informe um e-mail válido para enviar o convite.");
    }
    setSubmitting(true);
    try {
      if (createMode === "credentials") {
        await secureInvoke("closet-admin-manage-employee", {
          action: "create", full_name: details.full_name.trim(),
          username: newUsername.trim().toLowerCase(), password: newPassword,
          contact_email: contactEmail.trim().toLowerCase(),
          role: details.role, phone: details.phone,
          department: details.department, job_title: details.job_title,
          hired_on: details.hired_on || null
        });
        toast.success("Funcionário criado. O usuário e a senha já podem ser usados no login.");
      } else {
        await secureInvoke("closet-invite-employee", {
          full_name: details.full_name.trim(), email: contactEmail.trim().toLowerCase(),
          role: details.role, phone: details.phone,
          department: details.department, job_title: details.job_title,
          hired_on: details.hired_on || null
        });
        toast.success("Convite enviado para o e-mail do funcionário.");
      }
      setShowCreate(false);
      resetFields();
      await loadEmployees();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao cadastrar funcionário.");
    } finally { setSubmitting(false); }
  };

  const changePassword = async () => {
    if (!selected || submitting) return;
    if (!passwordValid(newPassword))
      return toast.error("A senha precisa de 12 a 72 caracteres, incluindo letras e números.");
    setSubmitting(true);
    try {
      const result = await secureInvoke("closet-admin-set-employee-password",{
        target_id: selected.id, password: newPassword
      });
      setNewPassword("");
      if (result?.updated !== true) throw new Error("O servidor não confirmou a alteração.");
      if (result?.audit_confirmed === false) {
        toast.warning("Senha atualizada. Verifique a conclusão da auditoria.");
      } else {
        toast.success("Senha redefinida no Supabase Auth.");
      }
      setShowCredentials(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível redefinir a senha.");
    } finally { setSubmitting(false); }
  };

  const changeUsername = async () => {
    if (!selected || submitting) return;
    const username = newUsername.trim().toLowerCase();
    if (!usernamePattern.test(username))
      return toast.error("Usuário precisa de 3 a 32 caracteres, sem espaços.");
    if (username === selected.username) return toast.info("Esse já é o usuário atual.");
    setSubmitting(true);
    try {
      const result = await secureInvoke("closet-admin-manage-employee", {
        action: "set_username", target_id: selected.id, username
      });
      if (result?.updated !== true) throw new Error("O servidor não confirmou a alteração.");
      if (result?.audit_confirmed === false) toast.warning("Usuário alterado. Verifique a auditoria.");
      else toast.success("Usuário alterado. O login anterior deixa de funcionar.");
      setShowCredentials(false);
      await loadEmployees();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível alterar o usuário.");
    } finally { setSubmitting(false); }
  };

  const updateEmployee = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || submitting) return;
    if (selected.id === user?.id && details.role !== selected.role)
      return toast.error("Por segurança, não é possível mudar o próprio perfil.");
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).rpc("closet_employee_update", {
        p_target: selected.id, p_full_name: details.full_name.trim(),
        p_phone: details.phone || null, p_department: details.department || null,
        p_job_title: details.job_title || null, p_hired_on: details.hired_on || null
      });
      if (error) throw error;
      if (details.role !== selected.role) {
        const { error: roleError } = await (supabase as any).rpc("closet_assign_user_role", {
          p_target: selected.id,
          p_role: details.role === "inactive" ? null : details.role
        });
        if (roleError) throw roleError;
      }
      toast.success("Dados e permissões do funcionário atualizados.");
      setShowEdit(false);
      await loadEmployees();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar os dados.");
      await loadEmployees();
    } finally { setSubmitting(false); }
  };

  if (!isAdmin) return (
    <Card><CardHeader><CardTitle>Funcionários</CardTitle>
      <CardDescription>Somente administradores podem gerenciar contas e senhas.</CardDescription>
    </CardHeader></Card>
  );

  const formFields = (
    <>
      <div className="space-y-2">
        <Label htmlFor="employee-name">Nome completo</Label>
        <Input id="employee-name" value={details.full_name} required
          onChange={(e) => setDetails((d) => ({ ...d, full_name: e.target.value }))} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="employee-phone">Telefone (opcional)</Label>
          <Input id="employee-phone" value={details.phone}
            onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employee-hired">Data de admissão</Label>
          <Input id="employee-hired" type="date" value={details.hired_on}
            onChange={(e) => setDetails((d) => ({ ...d, hired_on: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employee-dept">Departamento</Label>
          <Input id="employee-dept" value={details.department}
            onChange={(e) => setDetails((d) => ({ ...d, department: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employee-title">Cargo</Label>
          <Input id="employee-title" value={details.job_title}
            onChange={(e) => setDetails((d) => ({ ...d, job_title: e.target.value }))} />
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div><h2 className="text-2xl font-semibold text-marsala-800">Funcionários e acessos</h2>
          <p className="text-sm text-muted-foreground">Contas reais do Supabase Auth, com permissões por perfil.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadEmployees()} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
          <Button className="bg-marsala-700 hover:bg-marsala-800" onClick={openCreate}>
            <UserPlus className="h-4 w-4 mr-2" /> Novo funcionário
          </Button>
        </div>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" value={search} placeholder="Buscar funcionário, usuário ou setor"
          onChange={(e) => setSearch(e.target.value)} />
      </div>
      {loading ? <div className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando funcionários...
      </div> : filtered.length === 0 ? <Card><CardContent className="py-8 text-muted-foreground">
        Nenhum funcionário encontrado.
      </CardContent></Card> :
      <div className="grid gap-3">
        {filtered.map((employee) => (
          <Card key={employee.id} className="border-marsala-100">
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold">{employee.full_name}</div>
                  <Badge variant="secondary">{labels[employee.role] ?? employee.role}</Badge>
                  {employee.id === user?.id && <Badge variant="outline">Você</Badge>}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {employee.username ? <span>Usuário: <strong>{employee.username}</strong></span>
                    : <span>Login por e-mail: {employee.login_email}</span>}
                </div>
                {(employee.email && employee.email !== employee.login_email) && (
                  <div className="text-sm text-muted-foreground">Contato: {employee.email}</div>
                )}
                {(employee.department || employee.job_title) &&
                  <div className="text-sm text-muted-foreground">
                    {[employee.department, employee.job_title].filter(Boolean).join(" • ")}
                  </div>}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => openEdit(employee)}>
                  <Pencil className="h-4 w-4 mr-1" /> Dados e perfil
                </Button>
                {employee.id !== user?.id && <Button variant="outline" size="sm" onClick={() => openCredentials(employee)}>
                  <KeyRound className="h-4 w-4 mr-1" /> Usuário e senha
                </Button>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>}

      <Dialog open={showCreate} onOpenChange={(open) => { if (!submitting) {
        setShowCreate(open); if (!open) resetFields(); } }}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo funcionário</DialogTitle>
            <DialogDescription>Crie o acesso com usuário e senha definidos por você ou envie um convite.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void createEmployee(event)} className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button type="button" variant={createMode === "credentials" ? "default" : "outline"}
                onClick={() => setCreateMode("credentials")}>Definir usuário e senha</Button>
              <Button type="button" variant={createMode === "invitation" ? "default" : "outline"}
                onClick={() => setCreateMode("invitation")}>Convidar por e-mail</Button>
            </div>
            {formFields}
            <div className="space-y-2">
              <Label>Perfil de acesso</Label>
              <Select value={details.role} onValueChange={(role) =>
                setDetails((d) => ({...d, role: role as EditableRole}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{roles.map((role) =>
                  <SelectItem key={role} value={role}>{labels[role]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {createMode === "credentials" && <div className="space-y-2">
              <Label htmlFor="create-username">Nome de usuário para entrar no sistema</Label>
              <Input id="create-username" autoComplete="off" required value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                placeholder="Ex.: maria.vendas" />
            </div>}
            <div className="space-y-2">
              <Label htmlFor="contact-email">{createMode === "invitation" ? "E-mail para o convite" : "E-mail de contato (opcional)"}</Label>
              <Input id="contact-email" type="email" value={contactEmail}
                required={createMode === "invitation"} autoComplete="off"
                onChange={(e) => setContactEmail(e.target.value)} placeholder="pessoa@exemplo.com" />
            </div>
            {createMode === "credentials" && <div className="space-y-2">
              <Label htmlFor="create-password">Senha inicial (mínimo 12 caracteres, letras e números)</Label>
              <Input id="create-password" type="password" autoComplete="new-password"
                required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>}
            <DialogFooter>
              <Button type="submit" disabled={submitting} className="bg-marsala-700 hover:bg-marsala-800">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {createMode === "credentials" ? "Criar acesso" : "Enviar convite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showCredentials} onOpenChange={(open) => { if (!submitting) {
        setShowCredentials(open); if (!open) setNewPassword(""); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Usuário e senha</DialogTitle>
            <DialogDescription>{selected?.full_name}: configure as credenciais de acesso sem precisar de e-mail de recuperação.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Nome de usuário</Label>
              <div className="flex gap-2">
                <Input id="edit-username" value={newUsername} autoComplete="off"
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                  placeholder="Ex.: joao.caixa" />
                <Button type="button" variant="outline" disabled={submitting}
                  onClick={() => void changeUsername()}>Alterar</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Alterar o usuário substitui o e-mail de login anterior por um identificador interno.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-password">Nova senha (12 a 72 caracteres, letras e números)</Label>
              <Input id="reset-password" type="password" autoComplete="new-password"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <Button type="button" className="w-full bg-marsala-700 hover:bg-marsala-800"
                disabled={submitting} onClick={() => void changePassword()}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> :
                  <ShieldCheck className="h-4 w-4 mr-2" />}
                Salvar nova senha
              </Button>
              <p className="text-xs text-muted-foreground">
                Senhas nunca são exibidas novamente nem gravadas na ficha do funcionário.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEdit} onOpenChange={(open) => { if (!submitting) setShowEdit(open); }}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar funcionário</DialogTitle>
            <DialogDescription>Dados e perfil de acesso do Supabase.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void updateEmployee(event)}>
            {formFields}
            <div className="space-y-2">
              <Label>Permissões por perfil</Label>
              <Select value={details.role} disabled={selected?.id === user?.id}
                onValueChange={(role) => setDetails((d) => ({...d, role: role as EmployeeRole}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["admin", "manager", "staff", "cashier", "inactive"] as EmployeeRole[])
                    .map((role) => <SelectItem value={role} key={role}>{labels[role]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter><Button type="submit" disabled={submitting}
              className="bg-marsala-700 hover:bg-marsala-800">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar alterações
            </Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
