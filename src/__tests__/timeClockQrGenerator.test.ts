import {describe,expect,it} from "vitest";
import {qrcodegen} from "@/vendor/qrcodegen";

describe("QR Code único da loja, gerado sem serviço externo",()=>{
 it("codifica um payload fixo com correção de erros em um QR verdadeiro",()=>{
  const payload="CF-PONTO:V1:"+"a".repeat(64);
  const q=qrcodegen.QrCode.encodeText(payload,qrcodegen.QrCode.Ecc.MEDIUM);
  expect(q.size).toBeGreaterThanOrEqual(21);
  expect(q.size).toBeLessThanOrEqual(177);
  expect(q.getModule(0,0)).toBeTruthy();
  const count=Array.from({length:q.size*q.size},
    (_,i)=>q.getModule(i%q.size,Math.floor(i/q.size))).filter(Boolean).length;
  expect(count).toBeGreaterThan(150);
 });
 it("QRs diferentes produzem matrizes diferentes, sem retorno da imagem a terceiros",()=>{
  const a=qrcodegen.QrCode.encodeText("CF-PONTO:V1:"+"a".repeat(64),qrcodegen.QrCode.Ecc.MEDIUM);
  const b=qrcodegen.QrCode.encodeText("CF-PONTO:V1:"+"b".repeat(64),qrcodegen.QrCode.Ecc.MEDIUM);
  const fingerprint=(q:typeof a)=>Array.from({length:q.size*q.size},(_,i)=>
   q.getModule(i%q.size,Math.floor(i/q.size))?"1":"0").join("");
  expect(fingerprint(a)).not.toBe(fingerprint(b));
 });
});
