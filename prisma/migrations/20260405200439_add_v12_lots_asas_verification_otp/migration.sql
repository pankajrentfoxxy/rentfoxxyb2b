-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'LIVE', 'SOLD_OUT', 'DISPATCHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LotItemCondition" AS ENUM ('BRAND_NEW', 'REFURB_A_PLUS', 'REFURB_A', 'REFURB_B', 'REFURB_C');

-- CreateEnum
CREATE TYPE "InspectorType" AS ENUM ('INHOUSE', 'OUTSOURCED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING_ASSIGNMENT', 'ASSIGNED', 'SLOT_PROPOSED', 'SCHEDULED', 'INSPECTION_COMPLETE', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('PRODUCT_LISTING', 'LOT', 'ASAS');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'INSPECTOR';
ALTER TYPE "Role" ADD VALUE 'INSPECTION_MANAGER';

-- CreateTable
CREATE TABLE "OtpVerification" (
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "LotListing" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "totalQuantity" INTEGER NOT NULL,
    "lotSize" INTEGER NOT NULL,
    "totalLots" INTEGER NOT NULL,
    "lotsSold" INTEGER NOT NULL DEFAULT 0,
    "pricePerLot" DOUBLE PRECISION NOT NULL,
    "status" "LotStatus" NOT NULL DEFAULT 'DRAFT',
    "csvRawUrl" TEXT,
    "csvCleanUrl" TEXT,
    "verificationId" TEXT,
    "liveAt" TIMESTAMP(3),
    "dispatchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LotListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotInventoryItem" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "generation" TEXT,
    "processor" TEXT NOT NULL,
    "ramGb" INTEGER NOT NULL,
    "storageGb" INTEGER NOT NULL,
    "storageType" TEXT NOT NULL,
    "displayInch" DOUBLE PRECISION NOT NULL,
    "os" TEXT NOT NULL,
    "condition" "LotItemCondition" NOT NULL,
    "count" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,

    CONSTRAINT "LotInventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotPurchase" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "lotsCount" INTEGER NOT NULL,
    "totalUnits" INTEGER NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "paymentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "manifest" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LotPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsAsListing" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "totalUnits" INTEGER NOT NULL,
    "unitsSold" INTEGER NOT NULL DEFAULT 0,
    "avgUnitPrice" DOUBLE PRECISION NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "allowBidding" BOOLEAN NOT NULL DEFAULT true,
    "allowMultiBuyer" BOOLEAN NOT NULL DEFAULT false,
    "aiSuggestedLots" INTEGER,
    "status" "LotStatus" NOT NULL DEFAULT 'DRAFT',
    "csvRawUrl" TEXT,
    "csvCleanUrl" TEXT,
    "verificationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AsAsListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsAsInventoryItem" (
    "id" TEXT NOT NULL,
    "asasId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "generation" TEXT,
    "processor" TEXT NOT NULL,
    "ramGb" INTEGER NOT NULL,
    "storageGb" INTEGER NOT NULL,
    "storageType" TEXT NOT NULL,
    "condition" "LotItemCondition" NOT NULL,
    "count" INTEGER NOT NULL,
    "estimatedValue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "AsAsInventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsAsPurchase" (
    "id" TEXT NOT NULL,
    "asasId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "manifest" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AsAsPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspector" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "InspectorType" NOT NULL DEFAULT 'INHOUSE',
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "cityZones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Inspector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationTask" (
    "id" TEXT NOT NULL,
    "listingType" "ListingType" NOT NULL,
    "listingId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "inspectorId" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING_ASSIGNMENT',
    "proposedSlots" JSONB NOT NULL DEFAULT '[]',
    "confirmedSlot" JSONB,
    "vendorAddress" TEXT,
    "inspectorNotes" TEXT,
    "report" JSONB,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LotListing_vendorId_idx" ON "LotListing"("vendorId");

-- CreateIndex
CREATE INDEX "LotListing_status_idx" ON "LotListing"("status");

-- CreateIndex
CREATE INDEX "LotInventoryItem_lotId_idx" ON "LotInventoryItem"("lotId");

-- CreateIndex
CREATE INDEX "LotPurchase_lotId_idx" ON "LotPurchase"("lotId");

-- CreateIndex
CREATE INDEX "LotPurchase_customerId_idx" ON "LotPurchase"("customerId");

-- CreateIndex
CREATE INDEX "AsAsListing_vendorId_idx" ON "AsAsListing"("vendorId");

-- CreateIndex
CREATE INDEX "AsAsListing_status_idx" ON "AsAsListing"("status");

-- CreateIndex
CREATE INDEX "AsAsInventoryItem_asasId_idx" ON "AsAsInventoryItem"("asasId");

-- CreateIndex
CREATE INDEX "AsAsPurchase_asasId_idx" ON "AsAsPurchase"("asasId");

-- CreateIndex
CREATE INDEX "AsAsPurchase_customerId_idx" ON "AsAsPurchase"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Inspector_userId_key" ON "Inspector"("userId");

-- CreateIndex
CREATE INDEX "Inspector_isActive_idx" ON "Inspector"("isActive");

-- CreateIndex
CREATE INDEX "VerificationTask_vendorId_idx" ON "VerificationTask"("vendorId");

-- CreateIndex
CREATE INDEX "VerificationTask_listingType_listingId_idx" ON "VerificationTask"("listingType", "listingId");

-- CreateIndex
CREATE INDEX "VerificationTask_status_idx" ON "VerificationTask"("status");

-- CreateIndex
CREATE INDEX "VerificationTask_inspectorId_idx" ON "VerificationTask"("inspectorId");

-- AddForeignKey
ALTER TABLE "LotListing" ADD CONSTRAINT "LotListing_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotInventoryItem" ADD CONSTRAINT "LotInventoryItem_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "LotListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotPurchase" ADD CONSTRAINT "LotPurchase_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "LotListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotPurchase" ADD CONSTRAINT "LotPurchase_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsAsListing" ADD CONSTRAINT "AsAsListing_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsAsInventoryItem" ADD CONSTRAINT "AsAsInventoryItem_asasId_fkey" FOREIGN KEY ("asasId") REFERENCES "AsAsListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsAsPurchase" ADD CONSTRAINT "AsAsPurchase_asasId_fkey" FOREIGN KEY ("asasId") REFERENCES "AsAsListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsAsPurchase" ADD CONSTRAINT "AsAsPurchase_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspector" ADD CONSTRAINT "Inspector_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationTask" ADD CONSTRAINT "VerificationTask_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationTask" ADD CONSTRAINT "VerificationTask_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "Inspector"("id") ON DELETE SET NULL ON UPDATE CASCADE;
