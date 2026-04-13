-- Addendum v1.6: REFURB_D, RESERVED, cosmetic fields, bid revision, dispatch fields,
-- remove battery/warranty from ProductListing, balance reminder columns

-- Enums
ALTER TYPE "LotItemCondition" ADD VALUE IF NOT EXISTS 'REFURB_D';
ALTER TYPE "ProductCondition" ADD VALUE IF NOT EXISTS 'REFURB_D';
ALTER TYPE "LotStatus" ADD VALUE IF NOT EXISTS 'RESERVED';

-- ProductListing: drop battery / warranty
ALTER TABLE "ProductListing" DROP COLUMN IF EXISTS "batteryHealth";
ALTER TABLE "ProductListing" DROP COLUMN IF EXISTS "warrantyMonths";
ALTER TABLE "ProductListing" DROP COLUMN IF EXISTS "warrantyType";

-- LotInventoryItem
ALTER TABLE "LotInventoryItem" ADD COLUMN IF NOT EXISTS "cosmeticSummary" TEXT;
ALTER TABLE "LotInventoryItem" ADD COLUMN IF NOT EXISTS "functionalCount" INTEGER;
ALTER TABLE "LotInventoryItem" ADD COLUMN IF NOT EXISTS "nonFunctionalCount" INTEGER;

-- AsAsInventoryItem
ALTER TABLE "AsAsInventoryItem" ADD COLUMN IF NOT EXISTS "cosmeticSummary" TEXT;
ALTER TABLE "AsAsInventoryItem" ADD COLUMN IF NOT EXISTS "functionalCount" INTEGER;
ALTER TABLE "AsAsInventoryItem" ADD COLUMN IF NOT EXISTS "nonFunctionalCount" INTEGER;
ALTER TABLE "AsAsInventoryItem" ADD COLUMN IF NOT EXISTS "displayInch" DOUBLE PRECISION;

-- LotPurchase dispatch
ALTER TABLE "LotPurchase" ADD COLUMN IF NOT EXISTS "dispatchCarrier" TEXT;
ALTER TABLE "LotPurchase" ADD COLUMN IF NOT EXISTS "dispatchAwb" TEXT;
ALTER TABLE "LotPurchase" ADD COLUMN IF NOT EXISTS "dispatchedAt" TIMESTAMP(3);

-- AsAsPurchase dispatch
ALTER TABLE "AsAsPurchase" ADD COLUMN IF NOT EXISTS "dispatchCarrier" TEXT;
ALTER TABLE "AsAsPurchase" ADD COLUMN IF NOT EXISTS "dispatchAwb" TEXT;
ALTER TABLE "AsAsPurchase" ADD COLUMN IF NOT EXISTS "dispatchedAt" TIMESTAMP(3);

-- Bid revision
ALTER TABLE "Bid" ADD COLUMN IF NOT EXISTS "revisionCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Bid" ADD COLUMN IF NOT EXISTS "revisionHistory" JSONB NOT NULL DEFAULT '[]';

-- Order balance reminders: migrate from 12h to 48h/24h
ALTER TABLE "Order" DROP COLUMN IF EXISTS "balanceReminder12hSent";
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "balanceReminder48hSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "balanceReminder24hSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "balanceReminder2hSent" BOOLEAN NOT NULL DEFAULT false;
