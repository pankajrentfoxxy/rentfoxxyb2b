import type { InvoiceType, Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

function prefixForType(
  type: InvoiceType,
  s: {
    invoicePrefix: string;
    proformaPrefix: string;
    creditNotePrefix: string;
  },
): string {
  if (type === "PROFORMA") return s.proformaPrefix;
  if (type === "CREDIT_NOTE") return s.creditNotePrefix;
  return s.invoicePrefix;
}

export async function allocateInvoiceNumber(tx: Tx, type: InvoiceType): Promise<string> {
  const settings = await tx.platformSettings.findUniqueOrThrow({ where: { id: "singleton" } });
  const year = new Date().getFullYear();
  let y = settings.invoiceCounterYear;
  let n = settings.invoiceCounterValue;
  if (y !== year) {
    y = year;
    n = 0;
  }
  n += 1;
  await tx.platformSettings.update({
    where: { id: "singleton" },
    data: { invoiceCounterYear: y, invoiceCounterValue: n },
  });
  const prefix = prefixForType(type, settings);
  return `${prefix}-${year}-${String(n).padStart(6, "0")}`;
}
