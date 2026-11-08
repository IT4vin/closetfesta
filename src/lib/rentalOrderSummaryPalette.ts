/** Paleta exclusiva do cartão de identificação do pedido (coluna direita).
 * O status vem do contrato real; nunca inferir conclusão de uma simples data
 * prevista de devolução ou de uma confirmação de presença na loja.
 */
export type RentalOrderSummaryPalette = {
  container:string;
  muted:string;
  icon:string;
  badge:string;
  link:string;
  chip:string;
  notes:string;
  editButton:string;
};

const active:RentalOrderSummaryPalette={
  container:"border border-[#E5D6C3] bg-[#FAF2E7] text-[#48382F]",
  muted:"text-[#796052]",
  icon:"text-[#865C4B]",
  badge:"border-[#DFCCB6] bg-[#F1E1CF] text-[#714B3A] hover:bg-[#F1E1CF]",
  link:"text-[#644234] hover:text-[#432A22]",
  chip:"bg-[#EEDCC8] text-[#664436] hover:bg-[#E8D2BA]",
  notes:"border border-[#E7D7C5] bg-white/60 text-[#543F35]",
  editButton:"border-[#CFB8A1] bg-white/65 text-[#674436] hover:bg-white hover:text-[#493024]",
};

const cancelled:RentalOrderSummaryPalette={
  container:"border border-red-200 bg-[#FAF7F2] text-red-950",
  muted:"text-red-800",
  icon:"text-red-700",
  badge:"border-red-300 bg-[#FAF7F2] text-red-900 hover:bg-[#FAF7F2]",
  link:"text-red-900 hover:text-red-700",
  chip:"bg-[#FAF7F2] text-red-900 hover:bg-[#FAF7F2]",
  notes:"border border-red-200 bg-white/65 text-red-950",
  editButton:"border-red-300 bg-white/70 text-red-900 hover:bg-white hover:text-red-950",
};

const completed:RentalOrderSummaryPalette={
  container:"border border-emerald-200 bg-emerald-50 text-emerald-950",
  muted:"text-emerald-800",
  icon:"text-emerald-700",
  badge:"border-emerald-300 bg-emerald-100 text-emerald-900 hover:bg-emerald-100",
  link:"text-emerald-900 hover:text-emerald-700",
  chip:"bg-emerald-100 text-emerald-900 hover:bg-emerald-200",
  notes:"border border-emerald-200 bg-white/65 text-emerald-950",
  editButton:"border-emerald-300 bg-white/70 text-emerald-900 hover:bg-white hover:text-emerald-950",
};

export function rentalOrderSummaryPalette(status:string|undefined|null):RentalOrderSummaryPalette{
  switch((status??"").toLowerCase().trim()){
    case "cancelled": return cancelled;
    case "completed":
    case "returned": return completed;
    default: return active;
  }
}
