import { gstBreakdown } from "@/lib/gst";

export function normalizeStateLabel(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Same state → CGST+SGST; different → IGST 18% on taxable base. */
export function classifyGst(
  companyState: string,
  shipToState: string,
  taxableSubtotal: number,
): {
  isInterState: boolean;
  cgst: number;
  sgst: number;
  igst: number;
  gstAmount: number;
  total: number;
} {
  const intra = normalizeStateLabel(companyState) === normalizeStateLabel(shipToState);
  const base = gstBreakdown(taxableSubtotal);
  if (intra) {
    return {
      isInterState: false,
      cgst: base.cgst,
      sgst: base.sgst,
      igst: 0,
      gstAmount: base.gstAmount,
      total: base.total,
    };
  }
  return {
    isInterState: true,
    cgst: 0,
    sgst: 0,
    igst: base.gstAmount,
    gstAmount: base.gstAmount,
    total: base.total,
  };
}
