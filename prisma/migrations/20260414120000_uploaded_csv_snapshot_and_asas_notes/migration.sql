-- Store vendor's original upload for download; per-line Status/inspection notes on AsAs items
ALTER TABLE "LotListing" ADD COLUMN "uploadedCsvSnapshot" TEXT;
ALTER TABLE "AsAsListing" ADD COLUMN "uploadedCsvSnapshot" TEXT;
ALTER TABLE "AsAsInventoryItem" ADD COLUMN "notes" TEXT;
