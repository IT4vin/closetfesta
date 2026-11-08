import React,{useMemo} from "react";
import {useQuery} from "@tanstack/react-query";
import {Printer,QrCode,ShieldAlert} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Card,CardContent,CardHeader,CardTitle} from "@/components/ui/card";
import {qrcodegen} from "@/vendor/qrcodegen";
import {clockAdminQr} from "@/lib/timeClock";

function PrintableQRCode({payload,name}: {payload:string;name:string}){
 const matrix=useMemo(()=>{
  const code=qrcodegen.QrCode.encodeText(payload,qrcodegen.QrCode.Ecc.MEDIUM);
  const margin=4;
  const boxes:string[]=[];
  for(let y=0;y<code.size;y++)for(let x=0;x<code.size;x++){
    if(code.getModule(x,y))boxes.push(`M${x+margin} ${y+margin}h1v1h-1z`);
  }
  return {size:code.size+margin*2,path:boxes.join(" ")};
 },[payload]);
 return <div id="clock-print-qr"
  className="clock-print-area mx-auto flex max-w-sm flex-col items-center gap-4 rounded-2xl border bg-white px-5 py-7 text-center">
   <div>
    <h3 className="text-xl font-bold tracking-tight text-marsala-950">Closet Festa</h3>
    <p className="mt-1 text-sm font-medium text-foreground">Controle de Ponto · QR Code da Loja</p>
    <p className="mt-1 text-xs text-muted-foreground">{name}</p>
   </div>
   <svg role="img" aria-label="QR Code fixo da loja" xmlns="http://www.w3.org/2000/svg"
     className="aspect-square w-full max-w-[330px]" viewBox={`0 0 ${matrix.size} ${matrix.size}`}
     shapeRendering="crispEdges">
    <rect width={matrix.size} height={matrix.size} fill="#FFFFFF"/>
    <path d={matrix.path} fill="#161616"/>
   </svg>
   <div className="space-y-1 text-sm">
    <p className="font-semibold">1. Entre no sistema com seu login.</p>
    <p>2. Acesse <strong>Bater Ponto</strong>.</p>
    <p>3. Toque em <strong>Registrar Ponto</strong> e leia este QR.</p>
   </div>
   <p className="text-xs text-muted-foreground">
    Código fixo compartilhado. Cada marcação depende do login individual e é validada no servidor.
   </p>
 </div>;
}

export default function ClockQrAdmin(){
 const qr=useQuery({queryKey:["time-clock-admin","qr"],queryFn:clockAdminQr,
   staleTime:300000,refetchOnWindowFocus:false});
 return <Card className="shadow-sm">
  <CardHeader>
   <CardTitle className="flex items-center gap-2 text-base text-marsala-950">
    <QrCode className="h-5 w-5"/>QR Code fixo da loja
   </CardTitle>
   <p className="text-sm text-muted-foreground">
    Um único QR para todos os funcionários, sem expiração automática.
    O código não é compartilhado por APIs públicas de geração de imagem.
   </p>
  </CardHeader>
  <CardContent className="space-y-4">
   {qr.isPending&&<p className="text-sm" role="status">Consultando QR Code protegido...</p>}
   {qr.isError&&<p role="alert" className="text-sm text-red-700">
    {qr.error instanceof Error?qr.error.message:"Não foi possível consultar o QR da loja."}
   </p>}
   {qr.data&&<>
    <PrintableQRCode payload={qr.data.qr_payload} name={qr.data.store_name}/>
    <div className="flex justify-center">
     <Button className="bg-marsala hover:bg-marsala-700"
       onClick={()=>window.print()}><Printer className="mr-2 h-4 w-4"/>Visualizar e imprimir QR Code</Button>
    </div>
   </>}
   <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
    <ShieldAlert className="h-4 w-4 shrink-0"/>
    Um QR fixo pode ser fotografado e reutilizado. Mantenha o cartaz dentro da loja;
    o login individual e o horário do servidor continuam obrigatórios.
    Esta configuração não comprova, sozinha, presença física no estabelecimento.
   </div>
   <style>{`@media print {
    body * {visibility:hidden !important;}
    #clock-print-qr,#clock-print-qr * {visibility:visible !important;}
    #clock-print-qr {position:absolute;top:0;left:0;width:100%;max-width:none;
      border:none;box-shadow:none;padding:24px;}
    #clock-print-qr svg {width:330px;height:330px;}
    @page {size:A4;margin:16mm;}
   }`}</style>
  </CardContent>
 </Card>;
}
