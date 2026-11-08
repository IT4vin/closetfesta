import React,{useEffect,useRef,useState} from "react";
import {Camera,CameraOff,ImagePlus,Loader2} from "lucide-react";
import {Button} from "@/components/ui/button";

type ScannerInstance={
 start:()=>Promise<void>;stop:()=>void;destroy:()=>void;
};
type ScannerModule={
 default:new(
   video:HTMLVideoElement,
   onResult:(result:{data:string}|string)=>void,
   options:Record<string,unknown>
 )=>ScannerInstance & {constructor:unknown};
 scanImage?:unknown;
};
// O motor QR é carregado localmente do próprio sistema (MIT, sem serviço externo)
// para funcionar no Safari/iPhone, onde BarcodeDetector não está disponível.
async function loadScanner():Promise<any>{
 const path="/vendor/qr-scanner.min.js";
 const module=await import(/* @vite-ignore */ path);
 if(!module.default)throw new Error("Leitor QR indisponível.");
 return module.default;
}
export default function ClockQrScanner({
 enabled,onRead,onCancel,disabled=false,
}:{
 enabled:boolean;onRead:(code:string)=>void;onCancel:()=>void;disabled?:boolean;
}){
 const videoRef=useRef<HTMLVideoElement|null>(null);
 const instance=useRef<ScannerInstance|null>(null);
 const scanned=useRef(false);
 const [error,setError]=useState("");
 const [starting,setStarting]=useState(false);
 const [fallback,setFallback]=useState(false);
 useEffect(()=>{
  scanned.current=false;
  setError("");setFallback(false);
  if(!enabled||!videoRef.current)return;
  let alive=true;
  let scanner:ScannerInstance|null=null;
  (async()=>{
   setStarting(true);
   try{
    const QrScanner=await loadScanner();
    if(!alive)return;
    scanner=new QrScanner(videoRef.current!,
      (result:{data:string}|string)=>{
        if(scanned.current||!alive)return;
        const code=typeof result==="string"?result:result.data;
        if(!code)return;
        scanned.current=true;
        scanner?.stop();
        onRead(code);
      },
      {preferredCamera:"environment",returnDetailedScanResult:true,
        highlightScanRegion:true,highlightCodeOutline:true,
        maxScansPerSecond:12}
    );
    instance.current=scanner;
    await scanner.start();
   }catch(cause){
    if(alive){
      setError(cause instanceof Error?cause.message:
        "Não foi possível abrir a câmera. Confira a permissão do navegador.");
      setFallback(true);
    }
   }finally{if(alive)setStarting(false);}
  })();
  return ()=>{
    alive=false;
    try{scanner?.stop();scanner?.destroy();}catch{}
    if(instance.current===scanner)instance.current=null;
  };
 },[enabled]);
 const scanFile=async(e:React.ChangeEvent<HTMLInputElement>)=>{
  const file=e.target.files?.[0];
  if(!file||disabled)return;
  setStarting(true);setError("");
  try{
    const QrScanner=await loadScanner();
    const result=await QrScanner.scanImage(file,{returnDetailedScanResult:true});
    if(scanned.current)return;
    scanned.current=true;
    onRead(typeof result==="string"?result:result.data);
  }catch(cause){
    setError(cause instanceof Error?cause.message:"QR Code não encontrado na imagem.");
  }finally{setStarting(false);e.target.value="";}
 };
 if(!enabled)return null;
 return <div className="space-y-3 rounded-2xl border border-marsala-200 bg-white p-4">
  <div className="flex items-center justify-between gap-2">
   <p className="flex items-center gap-2 text-sm font-semibold text-marsala-900">
    <Camera className="h-4 w-4"/>Aponte a câmera para o QR Code da loja
   </p>
   <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={disabled}>
    <CameraOff className="mr-2 h-4 w-4"/>Fechar
   </Button>
  </div>
  <div className="relative mx-auto aspect-[4/3] w-full max-w-[440px] overflow-hidden rounded-xl bg-neutral-900">
   <video ref={videoRef} autoPlay playsInline muted
     aria-label="Prévia da câmera para leitura de QR Code" className="h-full w-full object-cover"/>
   {starting&&<span className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 text-sm text-white">
     <Loader2 className="h-5 w-5 animate-spin"/>Iniciando leitor...
   </span>}
  </div>
  {error&&<p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
   {error}
  </p>}
  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-marsala-800 hover:bg-marsala-50">
   <ImagePlus className="h-4 w-4"/>Ler QR Code de uma imagem
   <input type="file" accept="image/*" capture="environment" onChange={e=>void scanFile(e)}
     className="sr-only" disabled={starting||disabled}/>
  </label>
  <p className="text-xs text-muted-foreground">
   O sistema usa a câmera somente para identificar o QR. Não salva imagens nem grava vídeo.
   {fallback&&" Se a câmera não abrir, use a opção de imagem acima."}
  </p>
 </div>;
}
