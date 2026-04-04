-- Phase 5: invoice engine — proforma (bid), tax + credit note (order)

ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_orderId_key";

ALTER TABLE "Invoice" ADD COLUMN "bidId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "referencesTaxInvoiceId" TEXT;

ALTER TABLE "Invoice" ALTER COLUMN "orderId" DROP NOT NULL;

CREATE UNIQUE INDEX "Invoice_bidId_key" ON "Invoice"("bidId");

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Invoice_orderId_type_key" ON "Invoice"("orderId", "type");

ALTER TABLE "PlatformSettings" ADD COLUMN "companyState" TEXT NOT NULL DEFAULT 'Karnataka';
ALTER TABLE "PlatformSettings" ADD COLUMN "proformaPrefix" TEXT NOT NULL DEFAULT 'RFX-PRO';
ALTER TABLE "PlatformSettings" ADD COLUMN "creditNotePrefix" TEXT NOT NULL DEFAULT 'RFX-CN';
ALTER TABLE "PlatformSettings" ADD COLUMN "invoiceCounterYear" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PlatformSettings" ADD COLUMN "invoiceCounterValue" INTEGER NOT NULL DEFAULT 0;
