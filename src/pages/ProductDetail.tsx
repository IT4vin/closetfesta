import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, PackageCheck, Pencil, RefreshCw, Shirt } from "lucide-react";
import { productsApi, type Product } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import PermissionManager from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import ProductForm from "@/components/products/ProductForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type PhysicalUnit = { id: string; unit_number: number; status: string };
type RentalLine = {
  id: string; contract_id: string; unit_id: string;
  pickup_date: string; event_date: string; return_date: string;
  actual_return_at: string | null; unit_price: number; discount: number; status: string;
};
type RentalContract = { id: string; contract_number: number; client_id: string };
type ClientName = { id: string; full_name: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const brl = (amount: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
const date = (value: string) => value ? value.split("T")[0].split("-").reverse().join("/") : "—";

export default function ProductDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [units, setUnits] = useState<PhysicalUnit[]>([]);
  const [rentals, setRentals] = useState<RentalLine[]>([]);
  const [contracts, setContracts] = useState<Record<string, RentalContract>>({});
  const [clients, setClients] = useState<Record<string, ClientName>>({});
  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [edit, setEdit] = useState(false);
  const [saveError, setSaveError] = useState("");
  const canEdit = PermissionManager.hasPermission("products", "update");

  useEffect(() => {
    let active = true;
    setLoading(true); setLoadError(""); setHistoryError("");
    setProduct(null); setUnits([]); setRentals([]); setContracts({}); setClients({});
    if (!id || !uuid.test(id)) {
      setLoadError("Código de produto inválido."); setLoading(false);
      return () => { active = false; };
    }
    void (async () => {
      try {
        const result = await productsApi.findById(id);
        if (!result.success || !result.data) throw new Error("Produto não encontrado.");
        if (!active) return;
        setProduct(result.data);
        try {
          const db = supabase as any;
          const [unitResult, rentResult] = await Promise.all([
            db.from("product_units").select("id,unit_number,status").eq("product_id", id)
              .order("unit_number"),
            db.from("rental_items")
              .select("id,contract_id,unit_id,pickup_date,event_date,return_date,actual_return_at,unit_price,discount,status")
              .eq("product_id", id).order("created_at", { ascending: false }).limit(100),
          ]);
          if (unitResult.error) throw new Error(unitResult.error.message);
          if (rentResult.error) throw new Error(rentResult.error.message);
          if (!active) return;
          setUnits((unitResult.data || []) as PhysicalUnit[]);
          const lines = (rentResult.data || []) as RentalLine[];
          setRentals(lines);
          if (lines.length) {
            const ids = Array.from(new Set(lines.map((line) => line.contract_id)));
            const contractResult = await db.from("rental_contracts")
              .select("id,contract_number,client_id").in("id", ids);
            if (contractResult.error) throw new Error(contractResult.error.message);
            if (!active) return;
            const contractsFound = (contractResult.data || []) as RentalContract[];
            setContracts(Object.fromEntries(contractsFound.map((row) => [row.id, row])));
            if (contractsFound.length) {
              const clientIds = Array.from(new Set(contractsFound.map((row) => row.client_id)));
              const clientResult = await db.from("clients").select("id,full_name").in("id", clientIds);
              if (clientResult.error) throw new Error(clientResult.error.message);
              if (active) setClients(Object.fromEntries(
                ((clientResult.data || []) as ClientName[]).map((row) => [row.id, row])
              ));
            }
          }
        } catch (cause) {
          if (active) setHistoryError(cause instanceof Error ? cause.message : "Erro ao consultar o histórico.");
        }
      } catch (cause) {
        if (active) setLoadError(cause instanceof Error ? cause.message : "Não foi possível carregar o traje.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, refresh]);

  const submitProduct = async (data: any) => {
    if (!product || !canEdit) throw new Error("Sem permissão para alterar o cadastro.");
    setSaveError("");
    try {
      const rentalPrice = Number(data.rentalPrice ?? product.rental_price ?? product.price);
      if (!Number.isFinite(rentalPrice) || rentalPrice < 0) throw new Error("Valor de locação inválido.");
      const next = await productsApi.update(product.id, {
        name: String(data.name ?? "").trim(),
        description: String(data.description ?? "").trim(),
        sku: String(data.fullCode ?? product.sku ?? "").trim(),
        quantity: Number(data.quantity ?? product.quantity),
        category_id: product.category_id,
        price: rentalPrice, rental_price: rentalPrice,
        cost: Number(data.cost ?? 0),
        sizes: data.size ? [data.size] : product.sizes,
        type: data.productType || product.type || "",
        color: data.color || product.color || "",
      });
      if (!next.success || !next.data?.id) throw new Error("O Supabase não confirmou a edição.");
      const files: File[] = data.imageFiles ?? [];
      if (files.length) {
        const images = await productsApi.uploadImages(product.id, files);
        if (!images.success) throw new Error("Produto salvo, mas houve erro ao enviar as fotos.");
      }
      toast({ title: "Produto atualizado", description: "Cadastro salvo no Supabase." });
      setEdit(false);
      setRefresh((current) => current + 1);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Não foi possível salvar o produto.";
      setSaveError(message);
      throw new Error(message);
    }
  };

  if (loading) return <main className="p-6 text-sm text-muted-foreground" role="status">Consultando o produto real...</main>;
  if (loadError || !product) return <main className="space-y-4 p-6">
    <p role="alert" className="text-red-700">{loadError || "Produto não encontrado."}</p>
    <Button variant="outline" asChild><Link to="/products">Voltar aos produtos</Link></Button>
    <Button variant="outline" onClick={() => setRefresh((current) => current + 1)}>Tentar novamente</Button>
  </main>;

  const image = product.images?.[0]?.url || product.image;
  const productRentalPrice = Number(product.rental_price ?? product.rentalPrice ?? product.price);
  const activeRows = rentals.filter((line) => line.status === "confirmed" || line.status === "picked_up");
  const status = {available:"Livre",reserved:"Reservado",rented:"Alugado",maintenance:"Em manutenção"};
  const statusText = (value: string) => status[value as keyof typeof status] || value;
  return <main className="page-transition space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <Button size="sm" variant="ghost" asChild><Link to="/products">
          <ArrowLeft className="mr-2 h-4 w-4" />Produtos
        </Link></Button>
        <h1 className="mt-2 text-3xl font-semibold">{product.name}</h1>
        <p className="text-sm text-muted-foreground">Código: {product.sku || "Não informado"}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setRefresh((current) => current + 1)}>
          <RefreshCw className="mr-2 h-4 w-4" />Atualizar
        </Button>
        {canEdit && <Button onClick={() => { setSaveError(""); setEdit(true); }}
          className="bg-marsala hover:bg-marsala-700"><Pencil className="mr-2 h-4 w-4" />Editar</Button>}
        <Button asChild variant="outline"><Link to="/pdv">Abrir PDV para locação</Link></Button>
      </div>
    </header>
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1"><CardContent className="p-5">
        {image ? <img className="h-72 w-full rounded-lg object-contain" src={image} alt={product.name} />
          : <div className="flex h-72 items-center justify-center rounded-lg bg-muted"><Shirt className="h-16 w-16 text-muted-foreground" /></div>}
      </CardContent></Card>
      <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">Ficha do produto</CardTitle></CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <div><p className="text-xs text-muted-foreground">Valor de aluguel</p>
            <strong className="text-xl">{brl(productRentalPrice)}</strong></div>
          <div><p className="text-xs text-muted-foreground">Quantidade cadastrada</p>
            <strong className="text-xl">{product.quantity}</strong></div>
          <div><p className="text-xs text-muted-foreground">Tipo</p><strong>{product.type || "Não informado"}</strong></div>
          <div><p className="text-xs text-muted-foreground">Tamanhos</p><strong>{product.sizes?.join(", ") || "Não informado"}</strong></div>
          <div><p className="text-xs text-muted-foreground">Cor</p><strong>{product.color || "Não informada"}</strong></div>
          <div><p className="text-xs text-muted-foreground">Status cadastrado</p><strong>{statusText(product.status)}</strong></div>
          <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Descrição</p>
            <p className="whitespace-pre-wrap">{product.description || "Sem descrição."}</p></div>
        </CardContent></Card>
    </div>
    {historyError && <p role="alert" className="rounded-lg border border-red-200 p-3 text-sm text-red-700">
      Não foi possível carregar todas as informações de histórico: {historyError}
    </p>}
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base">
        <PackageCheck className="h-4 w-4" />Exemplares físicos ({units.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {units.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma unidade física associada ao produto.</p>}
          {units.map((unit) => <div className="flex justify-between gap-2 rounded-md border p-3 text-sm" key={unit.id}>
            <strong>Exemplar {unit.unit_number}</strong><span>{statusText(unit.status)}</span>
          </div>)}
          <p className="text-xs text-muted-foreground">
            Situação cadastral dos exemplares. Consulte as datas no PDV antes de confirmar disponibilidade ou uma manutenção.
          </p>
        </CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base">
        <CalendarDays className="h-4 w-4" />Histórico de locações ({rentals.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {rentals.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma locação registrada para este traje.</p>}
          {rentals.map((line) => {
            const order = contracts[line.contract_id];
            const name = order ? clients[order.client_id]?.full_name : null;
            return <Link to={"/pdv/pedidos/" + line.contract_id} key={line.id}
              className="block rounded-md border p-3 text-sm hover:border-marsala-300">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <strong>{order ? "Contrato " + order.contract_number : "Contrato vinculado"}</strong>
                <span>{brl(Number(line.unit_price) - Number(line.discount))}</span>
              </div>
              {name && <p className="text-muted-foreground">{name}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                Retirada: {date(line.pickup_date)} · Evento: {date(line.event_date)} · Devolução: {date(line.return_date)}
              </p>
              <p className="mt-1 text-xs">{statusText(line.status)}
                {line.actual_return_at ? " · Devolvido em " + date(line.actual_return_at) : ""}
              </p>
            </Link>;
          })}
          <p className="text-xs text-muted-foreground">Até 100 registros recentes. Locação não implica autorização automática para retirar o traje.</p>
        </CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle className="text-base">Conservação e manutenção</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>{activeRows.length} item(ns) com contrato ativo ou retirado no histórico consultado.</p>
        <p className="text-muted-foreground">
          As ordens de lavanderia e manutenção são registradas no Supabase e podem ser consultadas no painel de Estoque.
        </p>
        <Button variant="outline" size="sm" asChild><Link to="/inventory">Consultar ordens de manutenção</Link></Button>
      </CardContent>
    </Card>
    <Sheet open={edit} onOpenChange={setEdit}>
      <SheetContent side="right" className="w-[95vw] overflow-y-auto sm:max-w-2xl">
        <SheetHeader><SheetTitle>Editar produto no Supabase</SheetTitle></SheetHeader>
        {saveError && <p role="alert" className="mt-3 text-sm text-red-700">{saveError}</p>}
        <ProductForm key={product.id} initialData={{
          name: product.name, description: product.description, quantity: product.quantity,
          fullCode: product.sku || "", productType: product.type || "",
          rentalPrice: productRentalPrice, color: product.color || "",
          size: product.size || product.sizes?.[0] || "", images: product.images,
        }} onSubmit={submitProduct} onCancel={() => setEdit(false)} />
      </SheetContent>
    </Sheet>
  </main>;
}
