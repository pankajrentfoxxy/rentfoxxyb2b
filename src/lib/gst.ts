/** GST 18% — intra-state CGST 9% + SGST 9% */
export function gstBreakdown(subtotalExGst: number) {
  const gstAmount = Math.round(subtotalExGst * 0.18 * 100) / 100;
  const half = Math.round((gstAmount / 2) * 100) / 100;
  const total = Math.round((subtotalExGst + gstAmount) * 100) / 100;
  return {
    subtotal: subtotalExGst,
    cgst: half,
    sgst: Math.round((gstAmount - half) * 100) / 100,
    gstAmount,
    total,
  };
}
