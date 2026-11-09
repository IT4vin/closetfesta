import {beforeEach,describe,expect,it,vi} from "vitest";
const {rpc,invoke}=vi.hoisted(()=>({rpc:vi.fn(),invoke:vi.fn()}));
vi.mock("@/integrations/supabase/client",()=>({
 supabase:{rpc,functions:{invoke}},
}));
import {
 newEmployeeDraft,validateEmployeeDraft,employeeRoleLabels,employeeRoleDetails,
 listEmployees,updateEmployee,changeEmployeeRole,inviteEmployee,
 setEmployeePassword,validateEmployeePassword,checkEmployeePasswordService,
} from "@/lib/employeeManagement";
import {hasRolePermission} from "@/lib/accessControl";
const employeeId="11111111-1111-4111-8111-111111111111";
const form={...newEmployeeDraft(),full_name:"Funcionário Exemplo",
 email:"funcionario@exemplo.com",phone:"(21) 99999-9999",
 role:"staff" as const,department:"Atendimento",job_title:"Consultora de vendas",
 hired_on:"2026-11-08"};
beforeEach(()=>{rpc.mockReset();invoke.mockReset();});
describe("gerenciamento de funcionários em configurações",()=>{
 it("valida o convite sem expor senhas ou permitir convite direto admin",()=>{
  expect(validateEmployeeDraft(form,true)).toBeNull();
  expect(validateEmployeeDraft({...form,email:"invalid"},true)).toMatch(/e-mail/);
  expect(validateEmployeeDraft({...form,role:"admin"},true)).toMatch(/administradores/);
  expect(validateEmployeeDraft({...form,phone:"123"},true)).toMatch(/telefone/);
  expect(validateEmployeeDraft({...form,hired_on:"2026-02-30"},true)).toMatch(/admissão/);
 });
 it("cadastra novo login exclusivamente via Edge Function autenticada",async()=>{
  invoke.mockResolvedValue({data:{invited:true,user_id:employeeId,email:form.email,
   message:"Convite enviado"},error:null});
  await inviteEmployee(form);
  expect(invoke).toHaveBeenCalledWith("closet-invite-employee",{
   body:expect.objectContaining({email:form.email,role:"staff",
    full_name:form.full_name,department:form.department}),
  });
  expect(rpc).not.toHaveBeenCalled();
 });
 it("consulta lista real com RPC protegida e edita cadastro auditado",async()=>{
  rpc.mockResolvedValueOnce({data:[{id:employeeId,full_name:form.full_name}],error:null})
    .mockResolvedValueOnce({data:{saved:true},error:null});
  const list=await listEmployees();
  expect(list[0].id).toBe(employeeId);
  expect(rpc).toHaveBeenCalledWith("closet_employee_directory");
  await updateEmployee(employeeId,form);
  expect(rpc).toHaveBeenCalledWith("closet_employee_update",expect.objectContaining({
   p_target:employeeId,p_full_name:form.full_name,p_hired_on:form.hired_on,
  }));
 });
 it("atribui perfil ou revoga acesso usando a auditoria já existente",async()=>{
  rpc.mockResolvedValue({data:null,error:null});
  await changeEmployeeRole(employeeId,"cashier");
  await changeEmployeeRole(employeeId,"inactive");
  expect(rpc).toHaveBeenNthCalledWith(1,"closet_assign_user_role",{
   p_target:employeeId,p_role:"cashier",
  });
  expect(rpc).toHaveBeenNthCalledWith(2,"closet_assign_user_role",{
   p_target:employeeId,p_role:null,
  });
 });
 it("valida senhas individuais fortes sem enviá-las ao banco de funcionarios",()=>{
  expect(validateEmployeePassword("123456")).toMatch(/12 a 72/);
  expect(validateEmployeePassword("semnumeroalgum")).toMatch(/letras e números/);
  expect(validateEmployeePassword("123456789012345")).toMatch(/letras e números/);
  expect(validateEmployeePassword("Festa-2026-Roupa!")).toBeNull();
  expect(validateEmployeePassword("A".repeat(80)+"2026")).toMatch(/12 a 72/);
  expect(validateEmployeePassword("Á".repeat(40)+"1abc")).toMatch(/12 a 72/);
 });
 it("mantem botao de senha desabilitado quando a Edge Function nao esta publicada",async()=>{
  invoke.mockResolvedValueOnce({data:null,error:{context:{status:404}}})
    .mockResolvedValueOnce({data:null,error:{context:{status:405}}});
  expect(await checkEmployeePasswordService()).toBe(false);
  expect(await checkEmployeePasswordService()).toBe(true);
  expect(invoke).toHaveBeenCalledWith("closet-admin-set-employee-password",{
    method:"GET",
  });
  expect(rpc).not.toHaveBeenCalled();
 });
 it("redefine senha somente pela Edge Function administrativa, nunca por RPC ou update da tabela",async()=>{
  const newPassword="Festa-2026-Roupa!";
  invoke.mockResolvedValue({data:{updated:true,user_id:employeeId,
    audit_confirmed:true,message:"Senha alterada"},error:null});
  const result=await setEmployeePassword(employeeId,newPassword);
  expect(result.updated).toBe(true);
  expect(invoke).toHaveBeenCalledWith("closet-admin-set-employee-password",{
    body:{target_id:employeeId,password:newPassword},
  });
  expect(rpc).not.toHaveBeenCalled();
 });
 it("recusa respostas incompletas e nao aceita id alvo invalido",async()=>{
  await expect(setEmployeePassword("123","Festa-2026-Roupa!")).rejects.toThrow(/inválido/);
  expect(invoke).not.toHaveBeenCalled();
  invoke.mockResolvedValue({data:{updated:false},error:null});
  await expect(setEmployeePassword(employeeId,"Festa-2026-Roupa!")).rejects.toThrow(/não confirmou/);
 });
 it("exibe mensagem do servidor ao impedir alteracao nao autorizada",async()=>{
  const error={context:{json:async()=>({error:"Somente administradores podem alterar senhas."})}};
  invoke.mockResolvedValue({data:null,error});
  await expect(setEmployeePassword(employeeId,"Festa-2026-Roupa!"))
    .rejects.toThrow(/Somente administradores/);
 });
 it("apresenta permissões efetivas sem conceder permissões fictícias",()=>{
  expect(hasRolePermission("staff","timeClock","punch")).toBe(true);
  expect(hasRolePermission("staff","financial","read")).toBe(false);
  expect(hasRolePermission("cashier","cash","read")).toBe(true);
  expect(hasRolePermission("manager","users","update")).toBe(false);
  expect(hasRolePermission("admin","users","update")).toBe(true);
  expect(employeeRoleLabels.inactive).toBe("Sem acesso");
  expect(employeeRoleDetails.staff).toContain("Atendimento");
 });
});
