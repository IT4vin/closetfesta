// @vitest-environment jsdom
import React from "react";
import {afterEach,describe,expect,it} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import FormSection from "@/components/products/FormSection";
afterEach(()=>cleanup());
describe("seções do cadastro profissional de produtos",()=>{
 it("mantém campos visíveis nas seções importantes",()=>{
   render(<FormSection title="Informações Básicas"><input aria-label="Nome do produto"/></FormSection>);
   expect(screen.getByLabelText("Nome do produto")).toBeTruthy();
   expect(screen.getByText("Identificação, tipo e controle de exemplares")).toBeTruthy();
 });
 it("expande e recolhe seções opcionais de maneira acessível",()=>{
   render(<FormSection title="Códigos Fiscais" collapsible defaultCollapsed>
     <input aria-label="NCM"/>
   </FormSection>);
   expect(screen.queryByLabelText("NCM")).toBeNull();
   const button=screen.getByRole("button",{name:/Códigos Fiscais/});
   expect(button.getAttribute("aria-expanded")).toBe("false");
   fireEvent.click(button);
   expect(screen.getByLabelText("NCM")).toBeTruthy();
   expect(button.getAttribute("aria-expanded")).toBe("true");
 });
});