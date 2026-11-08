import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Clock3, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/api";
import ProductHistoryAvailabilityPanel from "@/components/products/ProductHistoryAvailabilityPanel";
import {
  fetchProductRentalHistory, productHistoryDate, productHistoryMoney,
  productHistoryStatus, PRODUCT_HISTORY_PAGE_SIZE,
} from "@/lib/productRentalHistory";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type HistoryProduct = Pick<Product, "id" | "name" | "sku">;

export default function ProductRentalHistoryDialog({
  product, onClose,
}: {
  product: HistoryProduct | null;
  onClose: () => void;
}) {
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [product?.id]);

  const query = useQuery({
    queryKey: ["product-rental-full-history", product?.id, page],
    enabled: Boolean(product?.id),
    queryFn: () => fetchProductRentalHistory(product!.id, page),
    staleTime: 0,
    refetchOnMount: "always",
  });
  const history = query.data;
  const total = Number(history?.total_count || 0);
  const start = total > 0 ? page * PRODUCT_HISTORY_PAGE_SIZE + 1 : 0;
  const end = Math.min((page + 1) * PRODUCT_HISTORY_PAGE_SIZE, total);
  const hasNext = (page + 1) * PRODUCT_HISTORY_PAGE_SIZE < total;

  return (
    <Dialog open={Boolean(product)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="flex max-h-[92vh] w-[96vw] max-w-4xl flex-col gap-0 overflow-hidden border-marsala-100 p-0">
        <DialogHeader className="shrink-0 border-b px-5 py-4 text-left">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-base font-semibold">
            <Clock3 className="h-5 w-5 text-marsala-700" aria-hidden="true" />
            Histórico do produto {product?.sku || product?.name || ""}
          </DialogTitle>
          <DialogDescription>
            {product?.name || "Produto"} · Todas as locações registradas, inclusive canceladas.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <ProductHistoryAvailabilityPanel productId={product?.id ?? null} />
          {query.isPending && <p className="py-8 text-center text-sm text-muted-foreground" role="status">
            Consultando o histórico real no Supabase...
          </p>}
          {query.isError && <div role="alert" className="space-y-3 rounded-lg border border-red-200 p-4">
            <p className="text-sm text-red-700">
              {query.error instanceof Error ? query.error.message : "Não foi possível consultar o histórico."}
            </p>
            <Button size="sm" variant="outline" onClick={() => void query.refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />Tentar novamente
            </Button>
          </div>}
          {query.isSuccess && history && (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {history.contract_count} contrato(s) · {history.total_count} registro(s) de locação
                </p>
                <Button size="sm" variant="outline" onClick={() => void query.refetch()}
                  disabled={query.isFetching}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar histórico
                </Button>
              </div>
              {history.items.length === 0 && (
                <p className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
                  {total === 0 ? "Este produto ainda não possui locações registradas."
                    : "Não há registros nesta página."}
                </p>
              )}
              {history.items.length > 0 && <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] border-collapse text-left text-xs sm:text-sm">
                  <thead className="border-b text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-3 font-semibold">Pedido</th>
                      <th className="px-3 py-3 font-semibold">Datas</th>
                      <th className="px-3 py-3 font-semibold">Valor</th>
                      <th className="px-3 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.items.map((item) => {
                      const status = productHistoryStatus(item);
                      return <tr key={item.id} className="border-b align-top last:border-b-0 hover:bg-muted/30">
                        <td className="px-3 py-4">
                          <Link to={"/pdv/pedidos/" + item.contract_id}
                            className="font-semibold text-marsala-800 hover:underline"
                            title="Abrir detalhes do contrato">
                            ALU-{String(item.contract_number).padStart(6, "0")}
                          </Link>
                          <p className="mt-1 max-w-[190px] break-words font-medium">{item.customer_name || "Cliente não identificado"}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Evento em {productHistoryDate(item.event_date)}
                          </p>
                          <p className="text-xs text-muted-foreground">Exemplar {item.unit_number}</p>
                        </td>
                        <td className="px-3 py-4">
                          <p>Prova: <strong>{productHistoryDate(item.try_on_date)}</strong></p>
                          <p>Retirada: <strong>{productHistoryDate(item.pickup_date)}</strong></p>
                          <p>Devolução: <strong>{productHistoryDate(item.return_date)}</strong></p>
                          {item.actual_return_at && <p className="text-muted-foreground">
                            Devolvido em {productHistoryDate(item.actual_return_at)}
                          </p>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 font-medium">
                          {productHistoryMoney(Number(item.unit_price) - Number(item.discount))}
                          {Number(item.discount) > 0 && <p className="text-xs font-normal text-muted-foreground">
                            Desconto: {productHistoryMoney(Number(item.discount))}
                          </p>}
                        </td>
                        <td className="px-3 py-4">
                          <Badge variant={status.variant}
                            className={status.label === "Reservado" ? "border-marsala-200 text-marsala-800" : ""}>
                            {status.label}
                          </Badge>
                          {item.conflict_override && <p className="mt-1 text-xs text-amber-700">
                            Desbloqueio excepcional
                          </p>}
                        </td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>}
            </>
          )}
        </div>

        {query.isSuccess && history && <div className="shrink-0 space-y-3 border-t bg-muted/20 px-5 py-4">
          <div className="grid gap-2 text-xs sm:grid-cols-3">
            <div><span className="text-muted-foreground">Total histórico (inclui cancelados)</span>
              <p className="font-semibold">{productHistoryMoney(Number(history.total_historical_value))}</p>
            </div>
            <div><span className="text-muted-foreground">Valor de locações não canceladas</span>
              <p className="font-semibold">{productHistoryMoney(Number(history.total_valid_value))}</p>
            </div>
            <div><span className="text-muted-foreground">Valor dos trajes que saíram</span>
              <p className="font-semibold">{productHistoryMoney(Number(history.total_out_value))}</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Valores contratuais por exemplar, não receita recebida nem custo contábil.
            {Number(history.cancelled_count) > 0 &&
              " Inclui " + history.cancelled_count + " registro(s) cancelado(s)."}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {total === 0 ? "Nenhum registro" : "Exibindo " + start + "–" + end + " de " + total}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0 || query.isFetching}
                onClick={() => setPage((current) => Math.max(0, current - 1))}>
                <ChevronLeft className="mr-1 h-4 w-4" />Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={!hasNext || query.isFetching}
                onClick={() => setPage((current) => current + 1)}>
                Próxima<ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>}
      </DialogContent>
    </Dialog>
  );
}
