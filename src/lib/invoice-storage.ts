import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.env.INVOICE_PDF_DIR ?? path.join(process.cwd(), ".data", "invoices");

export function invoicePdfFileName(invoiceNumber: string): string {
  return `${invoiceNumber.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;
}

export function invoicePdfAbsolutePath(invoiceNumber: string): string {
  return path.join(rootDir, invoicePdfFileName(invoiceNumber));
}

export async function ensureInvoiceDir(): Promise<void> {
  await fs.mkdir(rootDir, { recursive: true });
}

export async function writeInvoicePdf(invoiceNumber: string, buffer: Buffer): Promise<void> {
  await ensureInvoiceDir();
  await fs.writeFile(invoicePdfAbsolutePath(invoiceNumber), buffer);
}

export async function readInvoicePdfIfExists(invoiceNumber: string): Promise<Buffer | null> {
  const p = invoicePdfAbsolutePath(invoiceNumber);
  try {
    return await fs.readFile(p);
  } catch {
    return null;
  }
}
