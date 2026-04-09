-- Addendum v1.5: Lot highlights; inspector correction fields on inventory + verification task.

ALTER TABLE "LotListing" ADD COLUMN IF NOT EXISTS "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "LotInventoryItem" ADD COLUMN IF NOT EXISTS "inspectorCondition" "LotItemCondition";
ALTER TABLE "LotInventoryItem" ADD COLUMN IF NOT EXISTS "inspectorCount" INTEGER;
ALTER TABLE "LotInventoryItem" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LotInventoryItem" ADD COLUMN IF NOT EXISTS "inspectorItemNotes" TEXT;

ALTER TABLE "AsAsInventoryItem" ADD COLUMN IF NOT EXISTS "inspectorCondition" "LotItemCondition";
ALTER TABLE "AsAsInventoryItem" ADD COLUMN IF NOT EXISTS "inspectorCount" INTEGER;
ALTER TABLE "AsAsInventoryItem" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AsAsInventoryItem" ADD COLUMN IF NOT EXISTS "inspectorItemNotes" TEXT;

ALTER TABLE "VerificationTask" ADD COLUMN IF NOT EXISTS "correctedTitle" TEXT;
ALTER TABLE "VerificationTask" ADD COLUMN IF NOT EXISTS "correctedDescription" TEXT;
ALTER TABLE "VerificationTask" ADD COLUMN IF NOT EXISTS "correctedHighlights" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "VerificationTask" ADD COLUMN IF NOT EXISTS "originalItemsJson" JSONB;
