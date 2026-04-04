-- CreateEnum
CREATE TYPE "ProductCondition" AS ENUM ('BRAND_NEW', 'REFURB_A_PLUS', 'REFURB_A', 'REFURB_B', 'REFURB_C');

-- AlterTable
ALTER TABLE "ProductListing" ADD COLUMN "condition" "ProductCondition" NOT NULL DEFAULT 'BRAND_NEW';
ALTER TABLE "ProductListing" ADD COLUMN "batteryHealth" INTEGER;
ALTER TABLE "ProductListing" ADD COLUMN "conditionNotes" TEXT;
ALTER TABLE "ProductListing" ADD COLUMN "warrantyMonths" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ProductListing" ADD COLUMN "warrantyType" TEXT;
ALTER TABLE "ProductListing" ADD COLUMN "refurbImages" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ProductListing" ADD COLUMN "requiresAdminApproval" BOOLEAN NOT NULL DEFAULT false;
