import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const theme=readFileSync("src/index.css","utf8");
const app=readFileSync("src/App.css","utf8");

describe("substituição visual dos fundos vermelho-claro por off-white",()=>{
  it("usa off-white nos tons claros do tema e preserva o marsala principal",()=>{
    expect(theme).toContain("--marsala-50: 37 44% 96%");
    expect(theme).toContain("--marsala-100: 37 44% 96%");
    expect(theme).toContain("--marsala: 353 69% 25%");
    expect(theme).toContain("--sidebar-background: 353 69% 20%");
  });
  it("substitui o fundo de alertas vermelho/rosa mantendo textos de alerta",()=>{
    for(const prefix of ["red","rose","pink"]){
      for(const shade of ["50","100","200"]){
        expect(theme).toContain(".bg-"+prefix+"-"+shade);
        expect(theme).toContain(".hover\\:bg-"+prefix+"-"+shade+":hover");
      }
    }
    expect(theme).toContain("background-color: #FAF7F2");
    expect(theme).not.toMatch(/(?:^|\\n)\\s*color:\\s*#FAF7F2/m);
  });
  it("retira o hover vermelho-claro legado sem mexer nas bordas e botões",()=>{
    expect(app).not.toContain("background-color: rgba(128, 0, 32, 0.05)");
    expect(app).not.toContain("background-color: rgba(128, 0, 32, 0.1)");
    expect(app).toContain("background-color: #FAF7F2");
    expect(app).toContain("--marsala: #800020");
  });
});
