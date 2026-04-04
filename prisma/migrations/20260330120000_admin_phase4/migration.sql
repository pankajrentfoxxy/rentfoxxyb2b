-- AlterTable
ALTER TABLE "Order" ADD COLUMN "adminNotes" TEXT;

-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN "companyPhone" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PlatformSettings" ADD COLUMN "companyEmail" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PlatformSettings" ADD COLUMN "webhookPublicUrl" TEXT NOT NULL DEFAULT '';
