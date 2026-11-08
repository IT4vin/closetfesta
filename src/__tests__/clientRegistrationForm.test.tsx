// @vitest-environment jsdom
import React from "react";
import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
const {create}=vi.hoisted(()=>({create:vi.fn()}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{from:vi.fn()}}));
vi.mock("@/lib/clientRegistration",async(importOriginal)=>{
  const original=await importOriginal<typeof import("@/lib/clientRegistration")>();
  return {...original,createRegisteredClient:create};
});
import ClientRegistrationForm from "@/components/clients/ClientRegistrationForm";
afterEach(()=>{cleanup();create.mockReset();});
describe("formulário único de cliente",()=>{
 it("mostra identificação, contato, endereço, medidas e observações",()=>{
   render(<ClientRegistrationForm onSaved={vi.fn()} onCancel={vi.fn()}/>);
   expect(screen.getByLabelText("Nome completo *")).toBeTruthy();
   expect(screen.getByLabelText("Telefone alternativo")).toBeTruthy();
   expect(screen.getByLabelText("Data de nascimento")).toBeTruthy();
   expect(screen.getByLabelText("Busto (cm)")).toBeTruthy();
   expect(screen.getByLabelText("CEP")).toBeTruthy();
   expect(screen.getByLabelText("Observações internas")).toBeTruthy();
 });
 it("conserva foco ao editar e salva pelo serviço real reutilizável",async()=>{
   const callback=vi.fn();
   create.mockResolvedValue({id:"c1",name:"Cliente Teste",document:"",phone:""});
   render(<ClientRegistrationForm onSaved={callback} onCancel={vi.fn()}/>);
   const name=screen.getByLabelText("Nome completo *") as HTMLInputElement;
   name.focus();
   fireEvent.change(name,{target:{value:"Cliente Teste"}});
   expect(document.activeElement).toBe(name);
   fireEvent.change(screen.getByLabelText("Telefone alternativo"),{
     target:{value:"(21) 3333-4444"},
   });
   fireEvent.click(screen.getByRole("button",{name:"Salvar cliente"}));
   await waitFor(()=>expect(create).toHaveBeenCalledWith(
     expect.objectContaining({full_name:"Cliente Teste",
       secondary_phone:"(21) 3333-4444"})
   ));
   expect(callback).toHaveBeenCalledWith({id:"c1",name:"Cliente Teste",document:"",phone:""});
 });
});