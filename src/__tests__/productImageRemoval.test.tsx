// @vitest-environment jsdom
import React from "react";
import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import ProductForm from "@/components/products/ProductForm";

afterEach(()=>cleanup());

describe("exclusão de imagens no formulário de produtos",()=>{
 const existing={
  id:"11111111-1111-4111-8111-111111111111",
  url:"https://example.com/produto-vestido-1.jpg",
 };
 const initialData={
  name:"Vestido vinho",fullCode:"ABC123",productType:"Vestido",quantity:1,
  rentalPrice:190,images:[existing],
 };
 it("habilita X de foto já salva e marca exclusão sem apagar antes do salvamento",()=>{
  const onSubmit=vi.fn();
  const onCancel=vi.fn();
  render(<ProductForm initialData={initialData} onSubmit={onSubmit} onCancel={onCancel}/>);
  const remove=screen.getByRole("button",{name:"Remover imagem 1"});
  expect(remove.hasAttribute("disabled")).toBe(false);
  fireEvent.click(remove);
  expect(screen.queryByAltText("Imagem 1")).toBeNull();
  expect(screen.getByRole("status").textContent).toMatch(/1 foto\(s\) marcada/);
  expect(onSubmit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button",{name:"Cancelar"}));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(onCancel).toHaveBeenCalledTimes(1);
 });
 it("não apaga foto na tela se o cadastro não contém identificador de imagem",()=>{
  render(<ProductForm initialData={{...initialData,images:[existing.url]}} onSubmit={vi.fn()}/>);
  fireEvent.click(screen.getByRole("button",{name:"Remover imagem 1"}));
  expect(screen.getByAltText("Imagem 1")).toBeTruthy();
  expect(screen.getByRole("alert").textContent).toMatch(/identificar esta foto/);
 });

 it("salva edição válida ao clicar no botão e repassa IDs de fotos marcadas",async()=>{
  const onSubmit=vi.fn().mockResolvedValue(undefined);
  render(<ProductForm initialData={initialData} onSubmit={onSubmit}/>);
  fireEvent.click(screen.getByRole("button",{name:"Remover imagem 1"}));
  fireEvent.click(screen.getByRole("button",{name:"Salvar alterações"}));
  await waitFor(()=>expect(onSubmit).toHaveBeenCalledTimes(1));
  expect(onSubmit.mock.calls[0][0]).toMatchObject({
   name:"Vestido vinho",removeImageIds:[existing.id],imageFiles:[],
  });
 });
 it("mostra erro de campo junto ao botão sem impedir novas tentativas de salvar",async()=>{
  const onSubmit=vi.fn();
  render(<ProductForm initialData={{...initialData,productType:""}} onSubmit={onSubmit}/>);
  const button=screen.getByRole("button",{name:"Salvar alterações"});
  expect(button.hasAttribute("disabled")).toBe(false);
  fireEvent.click(button);
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByRole("alert").textContent).toMatch(/Tipo de Produto|productType|obrigatório/i);
  expect(button.hasAttribute("disabled")).toBe(false);
 });
});
